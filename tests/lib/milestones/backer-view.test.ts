import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveMilestonesForBacker } from '@/lib/milestones/backer-view';

// Mock the Supabase client. The helper calls five queries; each returns
// `{ data, error }` like the real client.
function createMockSupabase(responses: {
  project: unknown;
  submissions: unknown;
  approvals: unknown;
  releases: unknown;
  disputes: unknown;
}) {
  const fromMap: Record<string, () => unknown> = {
    projects: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: responses.project, error: null }),
        }),
      }),
    }),
    milestone_submissions_public: () => ({
      select: () => ({
        eq: async () => ({ data: responses.submissions, error: null }),
      }),
    }),
    milestone_approvals_public: () => ({
      select: async () => ({ data: responses.approvals, error: null }),
    }),
    escrow_releases_public: () => ({
      select: () => ({
        eq: async () => ({ data: responses.releases, error: null }),
      }),
    }),
    disputes_public: () => ({
      select: () => ({
        eq: () => ({
          in: async () => ({ data: responses.disputes, error: null }),
        }),
      }),
    }),
  };
  return { from: (table: string) => fromMap[table]() } as unknown as Parameters<typeof resolveMilestonesForBacker>[0];
}

const M_TEMPLATE = [
  { title: 'Tooling', description: 'Factory tooling', target_date: '2026-05-01' },
  { title: 'Production', description: 'Production run', target_date: '2026-06-01' },
  { title: 'Fulfillment', description: 'Ship rewards', target_date: '2026-07-01' },
];

describe('resolveMilestonesForBacker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty milestones when projects.milestones is null', async () => {
    const supabase = createMockSupabase({
      project: { milestones: null },
      submissions: [],
      approvals: [],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones).toEqual([]);
    expect(result.hasOpenDispute).toBe(false);
  });

  it('returns empty milestones when projects.milestones has fewer than 3 entries', async () => {
    const supabase = createMockSupabase({
      project: { milestones: [M_TEMPLATE[0], M_TEMPLATE[1]] },
      submissions: [],
      approvals: [],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones).toEqual([]);
  });

  it('returns 3 upcoming milestones when no submissions and target dates in future', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [],
      approvals: [],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones).toHaveLength(3);
    expect(result.milestones.every((m) => m.state === 'upcoming')).toBe(true);
  });

  it('returns "late" when target_date passed and no submission exists', async () => {
    const supabase = createMockSupabase({
      project: { milestones: [{ title: 'Tooling', description: 'x', target_date: '2026-04-15' }, M_TEMPLATE[1], M_TEMPLATE[2]] },
      submissions: [],
      approvals: [],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones[0].state).toBe('late');
    expect(result.milestones[0].late_by_days).toBe(10);
  });

  it('returns "under_review" when submission exists but no approval', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [
        { id: 'sub-1', milestone_number: 1, submitted_at: '2026-04-20' },
      ],
      approvals: [],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones[0].state).toBe('under_review');
    expect(result.milestones[0].submitted_at).toBe('2026-04-20');
  });

  it('returns "under_review" when approval decision is "rejected"', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [
        { id: 'sub-1', milestone_number: 1, submitted_at: '2026-04-20' },
      ],
      approvals: [
        { submission_id: 'sub-1', decision: 'rejected', reviewed_at: '2026-04-22' },
      ],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones[0].state).toBe('under_review');
  });

  it('returns "under_review" when approval decision is "needs_info"', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [
        { id: 'sub-1', milestone_number: 1, submitted_at: '2026-04-20' },
      ],
      approvals: [
        { submission_id: 'sub-1', decision: 'needs_info', reviewed_at: '2026-04-22' },
      ],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones[0].state).toBe('under_review');
  });

  it('returns "approved" with approval date and escrow amount', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [
        { id: 'sub-1', milestone_number: 1, submitted_at: '2026-04-20' },
      ],
      approvals: [
        { submission_id: 'sub-1', decision: 'approved', reviewed_at: '2026-04-22' },
      ],
      releases: [{ milestone_number: 1, amount_sgd: 4000 }],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones[0].state).toBe('approved');
    expect(result.milestones[0].approved_at).toBe('2026-04-22');
    expect(result.milestones[0].escrow_released_sgd).toBe(4000);
  });

  it('returns "approved" without escrow amount when escrow_releases row is missing', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [
        { id: 'sub-1', milestone_number: 1, submitted_at: '2026-04-20' },
      ],
      approvals: [
        { submission_id: 'sub-1', decision: 'approved', reviewed_at: '2026-04-22' },
      ],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones[0].state).toBe('approved');
    expect(result.milestones[0].escrow_released_sgd).toBeUndefined();
  });

  it('uses the latest approval row when multiple exist for one submission', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [
        { id: 'sub-1', milestone_number: 1, submitted_at: '2026-04-20' },
      ],
      approvals: [
        { submission_id: 'sub-1', decision: 'rejected', reviewed_at: '2026-04-22' },
        { submission_id: 'sub-1', decision: 'approved', reviewed_at: '2026-04-23' },
      ],
      releases: [{ milestone_number: 1, amount_sgd: 4000 }],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones[0].state).toBe('approved');
    expect(result.milestones[0].approved_at).toBe('2026-04-23');
  });

  it('handles mixed milestone states (M1 approved, M2 under_review, M3 upcoming)', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [
        { id: 'sub-1', milestone_number: 1, submitted_at: '2026-04-10' },
        { id: 'sub-2', milestone_number: 2, submitted_at: '2026-04-20' },
      ],
      approvals: [
        { submission_id: 'sub-1', decision: 'approved', reviewed_at: '2026-04-12' },
      ],
      releases: [{ milestone_number: 1, amount_sgd: 4000 }],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.milestones.map((m) => m.state)).toEqual(['approved', 'under_review', 'upcoming']);
  });

  it('sets hasOpenDispute=true when at least one open or investigating dispute exists', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [],
      approvals: [],
      releases: [],
      disputes: [{ id: 'd-1' }, { id: 'd-2' }],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.hasOpenDispute).toBe(true);
  });

  it('sets hasOpenDispute=false when no disputes are open or investigating', async () => {
    const supabase = createMockSupabase({
      project: { milestones: M_TEMPLATE },
      submissions: [],
      approvals: [],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.hasOpenDispute).toBe(false);
  });

  it('degrades gracefully when one of the queries returns an error', async () => {
    // Simulate the disputes query failing — the helper should log a
    // warning but still return milestone data without crashing.
    const supabase = {
      from: (table: string) => {
        if (table === 'projects') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { milestones: M_TEMPLATE }, error: null }),
              }),
            }),
          };
        }
        if (table === 'milestone_submissions_public') {
          return {
            select: () => ({ eq: async () => ({ data: [], error: null }) }),
          };
        }
        if (table === 'milestone_approvals_public') {
          return {
            select: async () => ({ data: [], error: null }),
          };
        }
        if (table === 'escrow_releases_public') {
          return {
            select: () => ({ eq: async () => ({ data: [], error: null }) }),
          };
        }
        if (table === 'disputes_public') {
          return {
            select: () => ({
              eq: () => ({
                in: async () => ({
                  data: null,
                  error: { message: 'permission denied for table disputes' },
                }),
              }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    } as unknown as Parameters<typeof resolveMilestonesForBacker>[0];

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');

    // Milestones still resolve from the successful queries
    expect(result.milestones).toHaveLength(3);
    // Dispute query failed → defaults to false (no row count to use)
    expect(result.hasOpenDispute).toBe(false);
    // The error was logged
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('disputes_public query failed'),
      expect.objectContaining({ message: expect.stringContaining('permission denied') }),
    );

    warnSpy.mockRestore();
  });

  it('returns empty milestones when any milestone has a non-string target_date (defensive guard)', async () => {
    const supabase = createMockSupabase({
      project: {
        milestones: [
          M_TEMPLATE[0],
          { title: 'Bad', description: 'has null target', target_date: null },
          M_TEMPLATE[2],
        ],
      },
      submissions: [],
      approvals: [],
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    // All-or-nothing: a single malformed entry blanks the whole timeline.
    // This is intentional — better to render no milestones than partial
    // ones that confuse backers.
    expect(result.milestones).toEqual([]);
  });
});
