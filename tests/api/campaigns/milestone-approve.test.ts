import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  releaseMilestonePayment: vi.fn().mockResolvedValue({ success: true, amount_released: 4000 }),
  sendMilestoneApprovedToCreatorEmail: vi.fn().mockResolvedValue({}),
  sendMilestoneApprovedToBackerEmail: vi.fn().mockResolvedValue({}),
  sendMilestoneNeedsActionEmail: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/milestones/escrow', () => ({
  releaseMilestonePayment: mocks.releaseMilestonePayment,
}));

vi.mock('@/lib/email/templates', () => ({
  sendMilestoneApprovedToCreatorEmail: mocks.sendMilestoneApprovedToCreatorEmail,
  sendMilestoneApprovedToBackerEmail: mocks.sendMilestoneApprovedToBackerEmail,
  sendMilestoneNeedsActionEmail: mocks.sendMilestoneNeedsActionEmail,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { POST } from '@/app/api/campaigns/[campaignId]/milestone-approve/route';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// ─── Shared helpers ────────────────────────────────────────────────────────

/** Makes a chainable query object that resolves with { data, error: null }. */
function thenable(data: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const m of ['eq', 'in', 'is', 'order', 'limit', 'range']) {
    chain[m] = () => chain;
  }
  chain.single = async () => ({ data, error: null });
  chain.then = (resolve: (v: unknown) => void) => resolve({ data, error: null });
  return chain;
}

/**
 * Build a minimal auth client.
 * - isAdmin=true  → profile row { is_admin: true }
 * - isAdmin=false → profile row { is_admin: false }
 * - isAdmin=null  → profile row null (missing profile)
 * - Pass profileError to simulate a DB error on the profiles query.
 */
function buildAuthClient(
  opts:
    | boolean
    | {
        isAdmin?: boolean | null;
        profileError?: { message: string };
        unauthenticated?: boolean;
      } = true
) {
  const o = typeof opts === 'boolean' ? { isAdmin: opts as boolean } : opts;
  // Deliberately keep null distinct from undefined: null → missing profile row, true/false → is_admin value
  const isAdmin = 'isAdmin' in o ? o.isAdmin : true;
  const profileError = (o as { profileError?: { message: string } }).profileError;
  const unauthenticated = (o as { unauthenticated?: boolean }).unauthenticated;

  return {
    auth: {
      getUser: async () =>
        unauthenticated
          ? { data: { user: null } }
          : { data: { user: { id: 'admin-1' } } },
    },
    from: () => ({
      select: () => {
        if (profileError) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chain: any = {};
          for (const m of ['eq', 'in', 'is', 'order', 'limit', 'range']) {
            chain[m] = () => chain;
          }
          chain.single = async () => ({ data: null, error: profileError });
          chain.then = (resolve: (v: unknown) => void) =>
            resolve({ data: null, error: profileError });
          return chain;
        }
        return thenable(isAdmin === null ? null : { is_admin: isAdmin });
      },
    }),
  };
}

interface ServiceMockArgs {
  decision: 'approved' | 'rejected' | 'needs_info';
  backers?: Array<{ status: string; display_name: string; email: string }>;
}

/** Full happy-path service client for email/escrow tests. */
function buildServiceClient({ decision, backers = [] }: ServiceMockArgs) {
  const submission = {
    id: 'sub-1',
    campaign_id: 'campaign-1',
    milestone_number: 1,
    status: 'pending',
  };
  const project = {
    id: 'campaign-1',
    title: 'Sourdough',
    slug: 'sourdough',
    amount_pledged_sgd: 10000,
    creator: { display_name: 'Jamie', email: 'creator@example.com' },
  };

  // Filter to captured/paynow_captured to match .in() the route applies.
  const visibleBackers = backers
    .filter((b) => ['captured', 'paynow_captured'].includes(b.status))
    .map((b) => ({ backer: { display_name: b.display_name, email: b.email } }));

  return {
    from: (table: string) => {
      if (table === 'milestone_submissions') {
        return {
          select: () => thenable(submission),
          update: () => thenable(null),
        };
      }
      if (table === 'milestone_approvals') {
        return {
          insert: () => ({
            select: () => thenable({ id: 'app-1', submission_id: 'sub-1', decision }),
          }),
        };
      }
      if (table === 'projects') {
        return { select: () => thenable(project) };
      }
      if (table === 'pledges') {
        return { select: () => thenable(visibleBackers) };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

/**
 * Build a chainable mock for the service client that returns a configurable
 * resolution value. Covers select().eq().eq().single() chains.
 */
function createChainableMock(resolveValue: { data: unknown; error: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  };
  return chain;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('milestone-approve route', () => {
  beforeEach(() => {
    mocks.releaseMilestonePayment.mockClear();
    mocks.releaseMilestonePayment.mockResolvedValue({ success: true, amount_released: 4000 });
    mocks.sendMilestoneApprovedToCreatorEmail.mockClear();
    mocks.sendMilestoneApprovedToBackerEmail.mockClear();
    mocks.sendMilestoneNeedsActionEmail.mockClear();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(buildAuthClient(true));
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('401 when user is not authenticated', async () => {
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildAuthClient({ unauthenticated: true })
      );

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  // ── Admin Authorization ───────────────────────────────────────────────────

  describe('Admin Authorization', () => {
    it('403 when user is not admin', async () => {
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildAuthClient({ isAdmin: false })
      );

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Only admins can approve milestones');
    });

    it('403 when profile does not exist', async () => {
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildAuthClient({ isAdmin: null })
      );

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Only admins can approve milestones');
    });

    it('500 when admin check query fails', async () => {
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildAuthClient({ profileError: { message: 'Database error' } })
      );

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to verify admin status');
    });
  });

  // ── Input Validation ──────────────────────────────────────────────────────

  describe('Validation', () => {
    it('400 when submission_id is missing', async () => {
      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('submission_id is required');
    });

    it('400 when decision is invalid', async () => {
      // The route validates submission_id and decision before calling createServiceClient,
      // so no service client setup is needed here.
      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'invalid_decision' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('decision must be one of');
    });

    it('accepts valid decisions: approved, rejected, needs_info', async () => {
      const decisions = ['approved', 'rejected', 'needs_info'] as const;

      for (const decision of decisions) {
        mocks.releaseMilestonePayment.mockClear();
        mocks.sendMilestoneApprovedToCreatorEmail.mockClear();
        mocks.sendMilestoneApprovedToBackerEmail.mockClear();
        mocks.sendMilestoneNeedsActionEmail.mockClear();
        (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(buildAuthClient(true));
        (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
          buildServiceClient({ decision })
        );

        const req = new Request('http://localhost/x', {
          method: 'POST',
          body: JSON.stringify({ submission_id: 'sub-1', decision }),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

        expect(res.status).toBe(200);
      }
    });
  });

  // ── Submission Handling ───────────────────────────────────────────────────

  describe('Submission Handling', () => {
    it('404 when submission not found', async () => {
      (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: () =>
          createChainableMock({ data: null, error: null }),
      });

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'non-existent', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Submission not found');
    });

    it('include feedback_text in approval when provided', async () => {
      const feedbackText = 'Great submission, approved!';

      // Custom service client that returns feedback_text in the approval row.
      let submissionCallCount = 0;
      (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: (table: string) => {
          if (table === 'milestone_submissions') {
            submissionCallCount++;
            if (submissionCallCount === 1) {
              return createChainableMock({
                data: { id: 'sub-1', campaign_id: 'campaign-1', milestone_number: 1, status: 'pending' },
                error: null,
              });
            }
            // Second call is the update()
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === 'milestone_approvals') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'approval-1',
                      submission_id: 'sub-1',
                      approved_by: 'admin-1',
                      decision: 'approved',
                      feedback_text: feedbackText,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'projects') {
            return createChainableMock({
              data: {
                id: 'campaign-1',
                title: 'Sourdough',
                slug: 'sourdough',
                amount_pledged_sgd: 10000,
                creator: { display_name: 'Jamie', email: 'creator@example.com' },
              },
              error: null,
            });
          }
          if (table === 'pledges') {
            // Pledges query uses .eq().in() — use thenable which supports .in()
            return { select: () => thenable([]) };
          }
          return createChainableMock({ data: null, error: null });
        },
      });

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved', feedback_text: feedbackText }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.approval.feedback_text).toBe(feedbackText);
    });

    it('500 when approval creation fails', async () => {
      (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: (table: string) => {
          if (table === 'milestone_submissions') {
            return createChainableMock({
              data: { id: 'sub-1', campaign_id: 'campaign-1', milestone_number: 1, status: 'pending' },
              error: null,
            });
          }
          if (table === 'milestone_approvals') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database constraint violation' },
                  }),
                }),
              }),
            };
          }
          return createChainableMock({ data: null, error: null });
        },
      });

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Database constraint violation');
    });

    it('500 when submission update fails', async () => {
      let submissionCallCount = 0;
      (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: (table: string) => {
          if (table === 'milestone_submissions') {
            submissionCallCount++;
            if (submissionCallCount === 1) {
              return createChainableMock({
                data: { id: 'sub-1', campaign_id: 'campaign-1', milestone_number: 1, status: 'pending' },
                error: null,
              });
            }
            // Second call: the update() that should fail
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed to update submission' } }),
            };
          }
          if (table === 'milestone_approvals') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'approval-1', submission_id: 'sub-1', approved_by: 'admin-1', decision: 'approved', feedback_text: null },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return createChainableMock({ data: null, error: null });
        },
      });

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to update submission');
    });
  });

  // ── Email + Escrow ────────────────────────────────────────────────────────

  describe('Email and Escrow', () => {
    it('on approved, releases escrow + emails creator + emails captured backers', async () => {
      (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
        buildServiceClient({
          decision: 'approved',
          backers: [
            { status: 'captured', display_name: 'Sam', email: 'sam@example.com' },
            { status: 'paynow_captured', display_name: 'Pat', email: 'pat@example.com' },
            { status: 'authorized', display_name: 'Skip', email: 'skip@example.com' },
          ],
        })
      );

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(res.status).toBe(200);
      expect(mocks.releaseMilestonePayment).toHaveBeenCalledTimes(1);
      expect(mocks.releaseMilestonePayment.mock.calls[0][0]).toMatchObject({
        campaign_id: 'campaign-1',
        milestone_number: 1,
        campaign_total_sgd: 10000,
      });
      expect(mocks.releaseMilestonePayment.mock.calls[0][0].supabase).toBeDefined();
      expect(mocks.sendMilestoneApprovedToCreatorEmail).toHaveBeenCalledTimes(1);
      expect(mocks.sendMilestoneApprovedToCreatorEmail.mock.calls[0][0].escrowReleasedSgd).toBe(4000);
      expect(mocks.sendMilestoneApprovedToBackerEmail).toHaveBeenCalledTimes(2);
      const recipients = mocks.sendMilestoneApprovedToBackerEmail.mock.calls.map((c) => c[0].backerEmail);
      expect(recipients).toContain('sam@example.com');
      expect(recipients).toContain('pat@example.com');
      expect(recipients).not.toContain('skip@example.com');
    });

    it('still sends emails when releaseMilestonePayment fails', async () => {
      mocks.releaseMilestonePayment.mockResolvedValueOnce({ success: false, error: 'db error' });
      (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
        buildServiceClient({
          decision: 'approved',
          backers: [{ status: 'captured', display_name: 'Sam', email: 'sam@example.com' }],
        })
      );

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(mocks.sendMilestoneApprovedToCreatorEmail).toHaveBeenCalledTimes(1);
      expect(mocks.sendMilestoneApprovedToCreatorEmail.mock.calls[0][0].escrowReleasedSgd).toBe(0);
      expect(mocks.sendMilestoneApprovedToBackerEmail).toHaveBeenCalledTimes(1);
    });

    it('on rejected, sends needs-action email and skips approval emails + escrow release', async () => {
      (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
        buildServiceClient({
          decision: 'rejected',
          backers: [{ status: 'captured', display_name: 'Sam', email: 'sam@example.com' }],
        })
      );

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'rejected', feedback_text: 'Photo blurry' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(mocks.releaseMilestonePayment).not.toHaveBeenCalled();
      expect(mocks.sendMilestoneApprovedToCreatorEmail).not.toHaveBeenCalled();
      expect(mocks.sendMilestoneApprovedToBackerEmail).not.toHaveBeenCalled();
      expect(mocks.sendMilestoneNeedsActionEmail).toHaveBeenCalledTimes(1);
      expect(mocks.sendMilestoneNeedsActionEmail.mock.calls[0][0]).toMatchObject({
        decision: 'rejected',
        feedbackText: 'Photo blurry',
        milestoneNumber: 1,
      });
    });

    it('on needs_info, sends needs-action email with that decision', async () => {
      (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
        buildServiceClient({ decision: 'needs_info' })
      );

      const req = new Request('http://localhost/x', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'sub-1', decision: 'needs_info' }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

      expect(mocks.sendMilestoneNeedsActionEmail).toHaveBeenCalledTimes(1);
      expect(mocks.sendMilestoneNeedsActionEmail.mock.calls[0][0].decision).toBe('needs_info');
    });
  });
});
