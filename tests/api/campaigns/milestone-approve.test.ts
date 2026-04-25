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

function buildAuthClient(isAdmin = true) {
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1' } } }) },
    from: () => ({
      select: () => thenable({ is_admin: isAdmin }),
    }),
  };
}

interface ServiceMockArgs {
  decision: 'approved' | 'rejected' | 'needs_info';
  backers?: Array<{ status: string; display_name: string; email: string }>;
}

function buildServiceClient({ decision, backers = [] }: ServiceMockArgs) {
  const submission = { id: 'sub-1', campaign_id: 'campaign-1', milestone_number: 1, status: 'pending' };
  const project = {
    id: 'campaign-1',
    title: 'Sourdough',
    slug: 'sourdough',
    amount_pledged_sgd: 10000,
    creator: { display_name: 'Jamie', email: 'creator@example.com' },
  };

  // The route's pledges query: .eq('project_id', x).in('status', ['captured', 'paynow_captured'])
  // Filter our test backers list to match what the .in() filter would return.
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
        // Route does .insert(...).select().single() — chain through select to thenable
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

describe('milestone-approve route', () => {
  beforeEach(() => {
    mocks.releaseMilestonePayment.mockClear();
    mocks.releaseMilestonePayment.mockResolvedValue({ success: true, amount_released: 4000 });
    mocks.sendMilestoneApprovedToCreatorEmail.mockClear();
    mocks.sendMilestoneApprovedToBackerEmail.mockClear();
    mocks.sendMilestoneNeedsActionEmail.mockClear();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(buildAuthClient(true));
  });

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
    expect(mocks.releaseMilestonePayment.mock.calls[0][0]).toEqual({
      campaign_id: 'campaign-1',
      milestone_number: 1,
      campaign_total_sgd: 10000,
    });
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
      body: JSON.stringify({
        submission_id: 'sub-1',
        decision: 'rejected',
        feedback_text: 'Photo blurry',
      }),
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
