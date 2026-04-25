# Milestone Visibility for Backers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the milestone-based escrow system to backers — `<MilestoneTimeline>` on `/projects/[slug]` (full vertical view) and `<MilestoneSummary>` on `/dashboard/my-pledges` (compact 3-segment strip), driven by a single `resolveMilestonesForBacker` helper that derives four backer-facing states (Upcoming / Under review / Approved / Late) from existing tables at render time.

**Architecture:** One pure-TS helper joins four existing tables (`projects.milestones`, `milestone_submissions`, `milestone_approvals`, `escrow_releases`, `disputes`). Two new server components consume its output. Zero schema changes assumed; an RLS-policy migration is only added if Task 1's verification reveals backers can't read the source tables.

**Tech Stack:** Next.js App Router (server components), Supabase (existing tables), Tailwind CSS with project CSS vars, Vitest + Testing Library, lucide-react icons. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-25-milestone-visibility-design.md`

---

## File Structure

**New files:**
- `lib/milestones/backer-view.ts` — `resolveMilestonesForBacker()` helper + `MilestoneState` / `ResolvedMilestone` / `BackerMilestoneView` types
- `components/milestones/MilestoneTimeline.tsx` — full vertical milestone list (server component); `<MilestoneRow />` co-located inside (not exported)
- `components/milestones/MilestoneSummary.tsx` — compact 3-segment strip (server component)
- `tests/lib/milestones/backer-view.test.ts` — pure-TS state derivation tests
- `tests/components/milestones/MilestoneTimeline.test.tsx`
- `tests/components/milestones/MilestoneSummary.test.tsx`

**Modified files:**
- `app/projects/[slug]/page.tsx` — call `resolveMilestonesForBacker`, render `<MilestoneTimeline />` as a section between the funding widget (mobile inline) and `<ProjectPageSections />` (engagement tabs)
- `app/dashboard/my-pledges/page.tsx` — for each `funded` pledge, call `resolveMilestonesForBacker`, render `<MilestoneSummary />` inside the pledge card replacing the funding-progress strip when `milestones.length === 3`

**Conditionally added:**
- `supabase/migrations/023_milestone_backer_read.sql` — only if Task 1 reveals backers/anon can't read the source tables. Implementer verifies the next available migration number from `ls supabase/migrations/` (the repo currently has duplicate 021 and 022 numbers — see Task 1 Step 2 for details).

---

## Task 1: Verify RLS read access for source tables (read-only audit)

This task decides whether a migration is needed. Read the policies on each of the four source tables and report what's there. The output of this task drives whether Task 2 ships.

**Files:**
- Read: `supabase/migrations/002_rls_policies.sql`
- Read: `supabase/migrations/018_escrow_milestone_schema.sql`
- Read: `supabase/migrations/019_add_rls_policies.sql`
- Any other migration files matching `*milestone*` or `*dispute*`

- [ ] **Step 1: Read all RLS-relevant migration files**

```bash
grep -lE "(milestone_submissions|milestone_approvals|escrow_releases|disputes)" supabase/migrations/*.sql
```

For each file returned, read it and find every `CREATE POLICY` and `ALTER POLICY` statement that mentions one of the four target tables.

- [ ] **Step 2: For each of the four tables, document the existing read policies**

The four tables: `milestone_submissions`, `milestone_approvals`, `escrow_releases`, `disputes`.

For each table, write down (in your head or on scratch):
- Is RLS enabled? (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`)
- What `SELECT` policies exist?
- Who do they grant read access to (`anon`, `authenticated`, specific roles)?
- What conditions do they require (e.g., `auth.uid() = creator_id`)?

The verification target: a backer (authenticated user with no special role) AND an anonymous user must be able to `SELECT` rows from these tables for projects with `status IN ('active', 'funded', 'failed', 'cancelled')`. Read access to all the rows the helper queries.

- [ ] **Step 3: Decide and report**

Two outcomes:

- **All four tables already grant the required public/backer read access.** Skip Task 2. Note this in your report so the controller knows.
- **At least one table is restricted (e.g., creator-only or admin-only SELECT).** Task 2 must run. List which tables need new policies in your report.

No code changes in this task. Pure investigation.

- [ ] **Step 4: Commit (only if you produced any artefacts)**

This task produces no code. If you took notes inline as a markdown comment file, commit it. Otherwise just report findings to the controller — no commit.

---

## Task 2: Add backer read RLS migration (CONDITIONAL — only if Task 1 says needed)

**Skip this task entirely if Task 1 reports all four tables already grant backer/anon read access.**

**Files:**
- Create: `supabase/migrations/<next-number>_milestone_backer_read.sql`

- [ ] **Step 1: Find the next available migration number**

```bash
ls supabase/migrations/ | sort | tail -10
```

The repo currently has `020`, `021_creator_review_threads.sql`, `021_project_milestones.sql` (duplicate 021), `022_project_milestones.sql`, `022_rename_pm_to_creator.sql` (duplicate 022). Use `023` unless something else has been added since. Confirm by reading the directory listing — pick the smallest unused integer ≥ 023.

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/023_milestone_backer_read.sql` (or whichever number you picked) with policies covering ONLY the tables Task 1 flagged. Use this template — include only the policies you need:

```sql
-- Milestone visibility for backers
--
-- Adds narrow public-read policies on the milestone-system tables so the
-- backer dashboard and public project page can show milestone status.
-- Read access is gated by the parent project's status — only campaigns
-- that are active/funded/failed/cancelled (i.e. once they've been
-- launched into review) expose their milestone state.
--
-- Drafts, removed, and pending_review projects stay hidden from the
-- public read path; their data only flows through admin/creator surfaces.

-- milestone_submissions: backer + anon may read submissions for launched campaigns
CREATE POLICY "milestone_submissions_select_public"
  ON milestone_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = milestone_submissions.campaign_id
        AND p.status IN ('active', 'funded', 'failed', 'cancelled')
    )
  );

-- milestone_approvals: same gate, joined through the parent submission
CREATE POLICY "milestone_approvals_select_public"
  ON milestone_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM milestone_submissions ms
      JOIN projects p ON p.id = ms.campaign_id
      WHERE ms.id = milestone_approvals.submission_id
        AND p.status IN ('active', 'funded', 'failed', 'cancelled')
    )
  );

-- escrow_releases: same gate
CREATE POLICY "escrow_releases_select_public"
  ON escrow_releases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = escrow_releases.campaign_id
        AND p.status IN ('active', 'funded', 'failed', 'cancelled')
    )
  );

-- disputes: same gate. Note we expose status presence, not dispute description
-- (the helper only selects `id` for the open-dispute count).
CREATE POLICY "disputes_select_public"
  ON disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = disputes.campaign_id
        AND p.status IN ('active', 'funded', 'failed', 'cancelled')
    )
  );
```

If Task 1 only flagged some tables, delete the policies for the unflagged tables before saving. Each policy is independent.

- [ ] **Step 3: Apply the migration locally and verify**

Run:
```bash
npx supabase db reset
```
Expected: migration applies cleanly, all migrations replay without error.

If Supabase CLI is not available locally, the implementer runs the equivalent via the Supabase MCP server's `apply_migration` tool, or surfaces the migration to the user for manual application.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/023_milestone_backer_read.sql
git commit -m "feat(milestones): add public read RLS policies on milestone tables for backer view"
```

---

## Task 3: `resolveMilestonesForBacker` helper + tests

**Files:**
- Create: `lib/milestones/backer-view.ts`
- Create: `tests/lib/milestones/backer-view.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/milestones/backer-view.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveMilestonesForBacker } from '@/lib/milestones/backer-view';

// Mock the Supabase client. The helper calls four queries; each returns
// `{ data, error }` like the real client.
function createMockSupabase(responses: {
  project: unknown;
  submissions: unknown;
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
    milestone_submissions: () => ({
      select: () => ({
        eq: async () => ({ data: responses.submissions, error: null }),
      }),
    }),
    escrow_releases: () => ({
      select: () => ({
        eq: async () => ({ data: responses.releases, error: null }),
      }),
    }),
    disputes: () => ({
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
        { milestone_number: 1, submitted_at: '2026-04-20', milestone_approvals: [] },
      ],
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
        {
          milestone_number: 1,
          submitted_at: '2026-04-20',
          milestone_approvals: [{ decision: 'rejected', reviewed_at: '2026-04-22' }],
        },
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
        {
          milestone_number: 1,
          submitted_at: '2026-04-20',
          milestone_approvals: [{ decision: 'needs_info', reviewed_at: '2026-04-22' }],
        },
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
        {
          milestone_number: 1,
          submitted_at: '2026-04-20',
          milestone_approvals: [{ decision: 'approved', reviewed_at: '2026-04-22' }],
        },
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
        {
          milestone_number: 1,
          submitted_at: '2026-04-20',
          milestone_approvals: [{ decision: 'approved', reviewed_at: '2026-04-22' }],
        },
      ],
      releases: [], // missing release row
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
        {
          milestone_number: 1,
          submitted_at: '2026-04-20',
          milestone_approvals: [
            { decision: 'rejected', reviewed_at: '2026-04-22' },
            { decision: 'approved', reviewed_at: '2026-04-23' },
          ],
        },
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
        {
          milestone_number: 1,
          submitted_at: '2026-04-10',
          milestone_approvals: [{ decision: 'approved', reviewed_at: '2026-04-12' }],
        },
        {
          milestone_number: 2,
          submitted_at: '2026-04-20',
          milestone_approvals: [],
        },
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
      releases: [],
      disputes: [],
    });
    const result = await resolveMilestonesForBacker(supabase, 'proj-1');
    expect(result.hasOpenDispute).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/milestones/backer-view.test.ts
```
Expected: FAIL — `Failed to resolve import "@/lib/milestones/backer-view"`.

- [ ] **Step 3: Implement the helper**

Create `lib/milestones/backer-view.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type MilestoneState = "upcoming" | "under_review" | "approved" | "late";

export interface ResolvedMilestone {
  number: 1 | 2 | 3;
  title: string;
  description: string;
  target_date: string;
  state: MilestoneState;
  submitted_at?: string;
  approved_at?: string;
  escrow_released_sgd?: number;
  late_by_days?: number;
}

export interface BackerMilestoneView {
  milestones: ResolvedMilestone[];
  hasOpenDispute: boolean;
}

interface MilestonePromise {
  title: string;
  description: string;
  target_date: string;
}

interface SubmissionRow {
  milestone_number: number;
  submitted_at: string;
  milestone_approvals: Array<{ decision: string; reviewed_at: string }>;
}

interface ReleaseRow {
  milestone_number: number;
  amount_sgd: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function isMilestonePromiseArray(v: unknown): v is MilestonePromise[] {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    v.every(
      (m) =>
        m &&
        typeof m === "object" &&
        typeof (m as { title?: unknown }).title === "string" &&
        typeof (m as { description?: unknown }).description === "string" &&
        typeof (m as { target_date?: unknown }).target_date === "string",
    )
  );
}

/**
 * Pick the most recent approval row when a submission has multiple.
 * Returns undefined if none exist. The schema doesn't enforce
 * UNIQUE(submission_id) so multiple rows are theoretically possible.
 */
function latestApproval(
  approvals: Array<{ decision: string; reviewed_at: string }>,
): { decision: string; reviewed_at: string } | undefined {
  if (!approvals || approvals.length === 0) return undefined;
  return [...approvals].sort((a, b) =>
    a.reviewed_at < b.reviewed_at ? 1 : a.reviewed_at > b.reviewed_at ? -1 : 0,
  )[0];
}

function deriveState(
  promise: MilestonePromise,
  submission: SubmissionRow | undefined,
  approval: { decision: string; reviewed_at: string } | undefined,
  now: Date,
): MilestoneState {
  if (approval?.decision === "approved") return "approved";
  if (submission) return "under_review";
  if (new Date(promise.target_date) < now) return "late";
  return "upcoming";
}

export async function resolveMilestonesForBacker(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  projectId: string,
): Promise<BackerMilestoneView> {
  // Fire all four queries in parallel — they're independent.
  const [projectResult, submissionsResult, releasesResult, disputesResult] = await Promise.all([
    supabase.from("projects").select("milestones").eq("id", projectId).single(),
    supabase
      .from("milestone_submissions")
      .select("milestone_number, submitted_at, milestone_approvals(decision, reviewed_at)")
      .eq("campaign_id", projectId),
    supabase.from("escrow_releases").select("milestone_number, amount_sgd").eq("campaign_id", projectId),
    supabase
      .from("disputes")
      .select("id")
      .eq("campaign_id", projectId)
      .in("status", ["open", "investigating"]),
  ]);

  const milestonesRaw = (projectResult.data as { milestones?: unknown } | null)?.milestones;
  if (!isMilestonePromiseArray(milestonesRaw)) {
    return { milestones: [], hasOpenDispute: (disputesResult.data?.length ?? 0) > 0 };
  }

  const submissions = (submissionsResult.data ?? []) as unknown as SubmissionRow[];
  const releases = (releasesResult.data ?? []) as unknown as ReleaseRow[];
  const submissionByNumber = new Map<number, SubmissionRow>();
  for (const s of submissions) submissionByNumber.set(s.milestone_number, s);
  const releaseByNumber = new Map<number, ReleaseRow>();
  for (const r of releases) releaseByNumber.set(r.milestone_number, r);

  const now = new Date();
  const resolved: ResolvedMilestone[] = milestonesRaw.map((promise, i) => {
    const number = (i + 1) as 1 | 2 | 3;
    const submission = submissionByNumber.get(number);
    const approval = submission ? latestApproval(submission.milestone_approvals) : undefined;
    const state = deriveState(promise, submission, approval, now);

    const m: ResolvedMilestone = {
      number,
      title: promise.title,
      description: promise.description,
      target_date: promise.target_date,
      state,
    };

    if (submission) m.submitted_at = submission.submitted_at;

    if (state === "approved" && approval) {
      m.approved_at = approval.reviewed_at;
      const release = releaseByNumber.get(number);
      if (release) m.escrow_released_sgd = release.amount_sgd;
    }

    if (state === "late") {
      m.late_by_days = Math.floor(
        (now.getTime() - new Date(promise.target_date).getTime()) / MS_PER_DAY,
      );
    }

    return m;
  });

  return {
    milestones: resolved,
    hasOpenDispute: (disputesResult.data?.length ?? 0) > 0,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/milestones/backer-view.test.ts
```
Expected: 13 passing tests, 0 failing.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add lib/milestones/backer-view.ts tests/lib/milestones/backer-view.test.ts
git commit -m "feat(milestones): add resolveMilestonesForBacker helper for backer view"
```

---

## Task 4: `<MilestoneTimeline />` component + tests

**Files:**
- Create: `components/milestones/MilestoneTimeline.tsx`
- Create: `tests/components/milestones/MilestoneTimeline.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/milestones/MilestoneTimeline.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestoneTimeline } from '@/components/milestones/MilestoneTimeline';
import type { ResolvedMilestone } from '@/lib/milestones/backer-view';

const baseMilestones: ResolvedMilestone[] = [
  {
    number: 1,
    title: 'Production tooling',
    description: 'Secure factory and tooling',
    target_date: '2026-05-15',
    state: 'approved',
    submitted_at: '2026-05-10',
    approved_at: '2026-05-15',
    escrow_released_sgd: 4000,
  },
  {
    number: 2,
    title: 'Production run',
    description: 'Manufacture units',
    target_date: '2026-06-30',
    state: 'under_review',
    submitted_at: '2026-06-28',
  },
  {
    number: 3,
    title: 'Fulfillment',
    description: 'Ship rewards',
    target_date: '2026-08-15',
    state: 'upcoming',
  },
];

describe('MilestoneTimeline', () => {
  it('renders the section heading', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Milestones')).toBeTruthy();
  });

  it('renders all 3 milestone titles', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Production tooling')).toBeTruthy();
    expect(screen.getByText('Production run')).toBeTruthy();
    expect(screen.getByText('Fulfillment')).toBeTruthy();
  });

  it('shows "Approved" pill and escrow amount for approved milestones', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Approved')).toBeTruthy();
    expect(screen.getByText(/S\$4,?000 released/)).toBeTruthy();
  });

  it('shows "Under review" pill and submitted date for under_review milestones', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Under review')).toBeTruthy();
    expect(screen.getByText(/Submitted/)).toBeTruthy();
  });

  it('shows "Upcoming" pill and "Due" date for upcoming milestones', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Upcoming')).toBeTruthy();
    expect(screen.getByText(/Due/)).toBeTruthy();
  });

  it('shows "Late" pill and "Late by N days" copy for late milestones', () => {
    const late: ResolvedMilestone[] = [
      { ...baseMilestones[0], state: 'late', late_by_days: 7, approved_at: undefined, submitted_at: undefined, escrow_released_sgd: undefined },
      baseMilestones[1],
      baseMilestones[2],
    ];
    render(<MilestoneTimeline milestones={late} />);
    expect(screen.getByText('Late')).toBeTruthy();
    expect(screen.getByText(/Late by 7 days/)).toBeTruthy();
    expect(screen.getByText(/Disputes auto-open at 45 days/)).toBeTruthy();
  });

  it('renders the dispute banner when hasOpenDispute is true', () => {
    render(<MilestoneTimeline milestones={baseMilestones} hasOpenDispute={true} />);
    expect(screen.getByText(/open dispute/i)).toBeTruthy();
  });

  it('does not render the dispute banner when hasOpenDispute is false', () => {
    render(<MilestoneTimeline milestones={baseMilestones} hasOpenDispute={false} />);
    expect(screen.queryByText(/open dispute/i)).toBeNull();
  });

  it('renders nothing visible when milestones is empty', () => {
    const { container } = render(<MilestoneTimeline milestones={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/components/milestones/MilestoneTimeline.test.tsx
```
Expected: FAIL — `Failed to resolve import "@/components/milestones/MilestoneTimeline"`.

- [ ] **Step 3: Implement the component**

Create `components/milestones/MilestoneTimeline.tsx`:

```tsx
import { Check, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import { formatSgd } from "@/lib/utils/currency";
import type { ResolvedMilestone, MilestoneState } from "@/lib/milestones/backer-view";

interface MilestoneTimelineProps {
  milestones: ResolvedMilestone[];
  hasOpenDispute?: boolean;
}

export function MilestoneTimeline({ milestones, hasOpenDispute }: MilestoneTimelineProps) {
  if (milestones.length === 0) return null;

  return (
    <section className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-black text-[var(--color-ink)]">Milestones</h2>
      </div>

      {hasOpenDispute && (
        <div
          role="alert"
          className="px-5 py-3 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">
            Open dispute — under investigation
          </p>
        </div>
      )}

      <ol className="flex flex-col">
        {milestones.map((m, idx) => (
          <MilestoneRow key={m.number} milestone={m} isLast={idx === milestones.length - 1} />
        ))}
      </ol>
    </section>
  );
}

function MilestoneRow({ milestone, isLast }: { milestone: ResolvedMilestone; isLast: boolean }) {
  const isLate = milestone.state === "late";
  const borderClass = isLast ? "" : "border-b border-[var(--color-border)]";
  const tintClass = isLate ? "bg-amber-50 dark:bg-amber-950/20" : "";

  return (
    <li className={`flex gap-3 px-5 py-4 ${borderClass} ${tintClass}`}>
      <StateIcon state={milestone.state} number={milestone.number} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[var(--color-ink)]">{milestone.title}</p>
          <StatePill state={milestone.state} />
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
          <DatesLine milestone={milestone} />
        </p>
      </div>
    </li>
  );
}

function StateIcon({ state, number }: { state: MilestoneState; number: 1 | 2 | 3 }) {
  const base = "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold";

  if (state === "approved") {
    return (
      <div className={`${base} bg-emerald-500 text-white`}>
        <Check className="w-4 h-4" />
      </div>
    );
  }
  if (state === "late") {
    return (
      <div className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>
        <AlertTriangle className="w-3.5 h-3.5" />
      </div>
    );
  }
  if (state === "under_review") {
    return (
      <div className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>
        {number}
      </div>
    );
  }
  // upcoming
  return (
    <div className={`${base} bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]`}>
      {number}
    </div>
  );
}

function StatePill({ state }: { state: MilestoneState }) {
  const base = "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider";
  if (state === "approved") {
    return <span className={`${base} bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400`}>Approved</span>;
  }
  if (state === "late") {
    return <span className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>Late</span>;
  }
  if (state === "under_review") {
    return <span className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>Under review</span>;
  }
  return <span className={`${base} bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]`}>Upcoming</span>;
}

function DatesLine({ milestone }: { milestone: ResolvedMilestone }) {
  const { state, target_date, submitted_at, approved_at, escrow_released_sgd, late_by_days } = milestone;

  if (state === "approved") {
    const date = approved_at ? formatDate(approved_at) : formatDate(target_date);
    if (typeof escrow_released_sgd === "number") {
      return <>Approved {date} · {formatSgd(escrow_released_sgd)} released</>;
    }
    return <>Approved {date}</>;
  }
  if (state === "under_review") {
    return <>Submitted {submitted_at ? formatDate(submitted_at) : formatDate(target_date)}</>;
  }
  if (state === "late") {
    return (
      <>
        Due {formatDate(target_date)} · Late by {late_by_days ?? 0} days. Disputes auto-open at 45 days.
      </>
    );
  }
  // upcoming
  return <>Due {formatDate(target_date)}</>;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/components/milestones/MilestoneTimeline.test.tsx
```
Expected: 9 passing tests, 0 failing.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add components/milestones/MilestoneTimeline.tsx tests/components/milestones/MilestoneTimeline.test.tsx
git commit -m "feat(milestones): add MilestoneTimeline component"
```

---

## Task 5: `<MilestoneSummary />` component + tests

**Files:**
- Create: `components/milestones/MilestoneSummary.tsx`
- Create: `tests/components/milestones/MilestoneSummary.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/milestones/MilestoneSummary.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestoneSummary } from '@/components/milestones/MilestoneSummary';
import type { ResolvedMilestone } from '@/lib/milestones/backer-view';

const oneApproved: ResolvedMilestone[] = [
  { number: 1, title: 'M1', description: '', target_date: '2026-05-15', state: 'approved', approved_at: '2026-05-15', escrow_released_sgd: 4000 },
  { number: 2, title: 'M2', description: '', target_date: '2026-06-30', state: 'upcoming' },
  { number: 3, title: 'M3', description: '', target_date: '2026-08-15', state: 'upcoming' },
];

const noneApproved: ResolvedMilestone[] = [
  { number: 1, title: 'M1', description: '', target_date: '2026-05-15', state: 'upcoming' },
  { number: 2, title: 'M2', description: '', target_date: '2026-06-30', state: 'upcoming' },
  { number: 3, title: 'M3', description: '', target_date: '2026-08-15', state: 'upcoming' },
];

const m2Late: ResolvedMilestone[] = [
  { number: 1, title: 'M1', description: '', target_date: '2026-05-15', state: 'approved', approved_at: '2026-05-15', escrow_released_sgd: 4000 },
  { number: 2, title: 'M2', description: '', target_date: '2026-06-30', state: 'late', late_by_days: 5 },
  { number: 3, title: 'M3', description: '', target_date: '2026-08-15', state: 'upcoming' },
];

describe('MilestoneSummary', () => {
  it('shows "1 of 3 approved · S$4,000 released" when one milestone is approved', () => {
    render(<MilestoneSummary milestones={oneApproved} />);
    expect(screen.getByText(/1 of 3 milestones approved/i)).toBeTruthy();
    expect(screen.getByText(/S\$4,?000 released/)).toBeTruthy();
  });

  it('shows "0 of 3 approved" with no dollar suffix when none are approved', () => {
    render(<MilestoneSummary milestones={noneApproved} />);
    expect(screen.getByText(/0 of 3 milestones approved/i)).toBeTruthy();
    expect(screen.queryByText(/released/)).toBeNull();
  });

  it('shows "Milestone 2 late by 5 days" when M2 is late (overrides the default summary)', () => {
    render(<MilestoneSummary milestones={m2Late} />);
    expect(screen.getByText(/Milestone 2 late by 5 days/i)).toBeTruthy();
    expect(screen.queryByText(/of 3 milestones approved/i)).toBeNull();
  });

  it('shows "Open dispute — under investigation" when hasOpenDispute is true (overrides everything)', () => {
    render(<MilestoneSummary milestones={oneApproved} hasOpenDispute={true} />);
    expect(screen.getByText(/open dispute — under investigation/i)).toBeTruthy();
    expect(screen.queryByText(/of 3 milestones approved/i)).toBeNull();
  });

  it('renders nothing when milestones is empty', () => {
    const { container } = render(<MilestoneSummary milestones={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 3 segment elements (one per milestone)', () => {
    const { container } = render(<MilestoneSummary milestones={oneApproved} />);
    const segments = container.querySelectorAll('[data-milestone-segment]');
    expect(segments.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/components/milestones/MilestoneSummary.test.tsx
```
Expected: FAIL — `Failed to resolve import "@/components/milestones/MilestoneSummary"`.

- [ ] **Step 3: Implement the component**

Create `components/milestones/MilestoneSummary.tsx`:

```tsx
import { formatSgd } from "@/lib/utils/currency";
import type { ResolvedMilestone, MilestoneState } from "@/lib/milestones/backer-view";

interface MilestoneSummaryProps {
  milestones: ResolvedMilestone[];
  hasOpenDispute?: boolean;
}

const SEGMENT_COLOR: Record<MilestoneState, string> = {
  approved: "bg-emerald-500",
  under_review: "bg-amber-300 dark:bg-amber-500/60",
  late: "bg-amber-500 dark:bg-amber-400",
  upcoming: "bg-[var(--color-surface-overlay)]",
};

export function MilestoneSummary({ milestones, hasOpenDispute }: MilestoneSummaryProps) {
  if (milestones.length === 0) return null;

  const approvedCount = milestones.filter((m) => m.state === "approved").length;
  const totalReleased = milestones.reduce(
    (acc, m) => acc + (m.escrow_released_sgd ?? 0),
    0,
  );
  const lateMilestone = milestones.find((m) => m.state === "late");

  let summaryText: string;
  if (hasOpenDispute) {
    summaryText = "Open dispute — under investigation";
  } else if (lateMilestone) {
    summaryText = `Milestone ${lateMilestone.number} late by ${lateMilestone.late_by_days ?? 0} days`;
  } else if (approvedCount > 0) {
    summaryText = `${approvedCount} of 3 milestones approved · ${formatSgd(totalReleased)} released`;
  } else {
    summaryText = `0 of 3 milestones approved`;
  }

  const summaryColorClass = hasOpenDispute
    ? "text-red-700 dark:text-red-400"
    : lateMilestone
      ? "text-amber-700 dark:text-amber-400"
      : "text-[var(--color-ink-muted)]";

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-3 flex flex-col gap-2">
      <div className="h-2 flex gap-1 rounded-full overflow-hidden">
        {milestones.map((m) => (
          <div
            key={m.number}
            data-milestone-segment={m.number}
            className={`flex-1 rounded-full ${
              hasOpenDispute ? "bg-red-500 dark:bg-red-600" : SEGMENT_COLOR[m.state]
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${summaryColorClass}`}>{summaryText}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/components/milestones/MilestoneSummary.test.tsx
```
Expected: 6 passing tests, 0 failing.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add components/milestones/MilestoneSummary.tsx tests/components/milestones/MilestoneSummary.test.tsx
git commit -m "feat(milestones): add MilestoneSummary component"
```

---

## Task 6: Wire `<MilestoneTimeline />` into `/projects/[slug]`

**Files:**
- Modify: `app/projects/[slug]/page.tsx`

- [ ] **Step 1: Update imports at the top of `app/projects/[slug]/page.tsx`**

Find the existing import block (lines 1-15 roughly) and add these two lines alongside the others:

```ts
import { MilestoneTimeline } from "@/components/milestones/MilestoneTimeline";
import { resolveMilestonesForBacker } from "@/lib/milestones/backer-view";
```

Place them with the other `@/components/...` and `@/lib/...` imports respectively to keep grouping consistent.

- [ ] **Step 2: Add the helper call alongside existing parallel queries**

Find the existing `Promise.all([...])` block that fetches updates / feedback / backer-check (around line 92). Add the milestone resolver as a new parallel call. Look for code that looks like:

```ts
const [{ data: updatesRaw }, { data: feedbackRaw }, backerCheck] = await Promise.all([
  supabase.from("project_updates")...,
  supabase.from("project_feedback")...,
  supabase.from("pledges")...,
]);
```

Modify to:

```ts
const [{ data: updatesRaw }, { data: feedbackRaw }, backerCheck, milestoneView] = await Promise.all([
  supabase.from("project_updates")...,
  supabase.from("project_feedback")...,
  supabase.from("pledges")...,
  resolveMilestonesForBacker(supabase, project.id),
]);
```

Preserve the existing query bodies — only add the fourth entry.

- [ ] **Step 3: Render `<MilestoneTimeline />` between the funding widget and `<ProjectPageSections />`**

Find the JSX block that ends the mobile funding-widget div and immediately precedes `<ProjectPageSections ...>`. It looks like:

```tsx
{/* Funding widget — inline on mobile only */}
<div className="lg:hidden">
  <section className="max-w-2xl">
    <BackerEducationSection />
  </section>
  <FundingWidget project={project} />
</div>

{/* ── Anchored sections (nav + Campaign, Rewards, FAQ, Updates, Comments) ── */}
<ProjectPageSections ... />
```

Insert the milestone timeline between the closing `</div>` of the mobile funding widget and the `{/* ── Anchored sections ... ── */}` comment:

```tsx
{/* Funding widget — inline on mobile only */}
<div className="lg:hidden">
  <section className="max-w-2xl">
    <BackerEducationSection />
  </section>
  <FundingWidget project={project} />
</div>

{/* ── Milestones ── */}
{milestoneView.milestones.length > 0 && (
  <MilestoneTimeline
    milestones={milestoneView.milestones}
    hasOpenDispute={milestoneView.hasOpenDispute}
  />
)}

{/* ── Anchored sections (nav + Campaign, Rewards, FAQ, Updates, Comments) ── */}
<ProjectPageSections ... />
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 5: Run all milestone-related tests**

```bash
npx vitest run tests/lib/milestones/ tests/components/milestones/
```
Expected: all 28 tests passing (13 helper + 9 timeline + 6 summary).

- [ ] **Step 6: Commit**

```bash
git add app/projects/[slug]/page.tsx
git commit -m "feat(projects): render MilestoneTimeline on public project page"
```

---

## Task 7: Wire `<MilestoneSummary />` into `/dashboard/my-pledges`

**Files:**
- Modify: `app/dashboard/my-pledges/page.tsx`

- [ ] **Step 1: Update imports at the top of `app/dashboard/my-pledges/page.tsx`**

Add these two lines alongside the existing imports (after the `@/lib/utils/dates` import):

```ts
import { MilestoneSummary } from "@/components/milestones/MilestoneSummary";
import { resolveMilestonesForBacker, type BackerMilestoneView } from "@/lib/milestones/backer-view";
```

- [ ] **Step 2: Resolve milestones for funded pledges in parallel after the existing pledges fetch**

Find the existing `pledgesRaw` fetch (line 15-19). Right after the `pledges` array is constructed (line 35) and before `const activePledges = ...` (line 36), insert:

```ts
const fundedPledges = pledges.filter((p) => p.project?.status === "funded");
const milestoneViewByProjectId = new Map<string, BackerMilestoneView>();
await Promise.all(
  fundedPledges.map(async (p) => {
    if (!p.project) return;
    const view = await resolveMilestonesForBacker(supabase, p.project.id);
    milestoneViewByProjectId.set(p.project.id, view);
  }),
);
```

This pre-populates a `Map` keyed by project id so the JSX render can look up the view per pledge in O(1) without re-querying.

- [ ] **Step 3: Replace the funding-progress strip in `ActivePledgeCard` for funded pledges**

Find the existing `<div>` block that renders the live progress strip inside `ActivePledgeCard` (lines 101-124). It begins with `{/* Live progress strip */}`. Replace the existing block with conditional logic:

```tsx
{/* Progress strip: funding bar while funding; milestone summary once funded */}
{(() => {
  if (project.status === "funded") {
    const view = milestoneViewByProjectId.get(project.id);
    if (view && view.milestones.length === 3) {
      return <MilestoneSummary milestones={view.milestones} hasOpenDispute={view.hasOpenDispute} />;
    }
    // Defensive fallback: funded but no milestones defined (legacy data) — keep funding strip
  }
  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-3 flex flex-col gap-2">
      <div className="h-1.5 rounded-full bg-[var(--color-surface-overlay)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
        <span>
          <span className="font-mono font-bold text-[var(--color-ink)]">{formatSgd(project.amount_pledged_sgd)}</span>
          {" "}raised of <span className="font-mono">{formatSgd(project.funding_goal_sgd)}</span>
        </span>
        <div className="flex items-center gap-3">
          <span><span className="font-mono font-bold text-[var(--color-ink)]">{percent}%</span> funded</span>
          <span><span className="font-mono font-bold text-[var(--color-ink)]">{project.backer_count}</span> backers</span>
          {isActive && (
            <span className={`font-mono font-bold ${days <= 3 ? "text-[var(--color-brand-danger)]" : "text-[var(--color-ink)]"}`}>
              {days}d left
            </span>
          )}
        </div>
      </div>
    </div>
  );
})()}
```

The inline IIFE is fine for this server component — keeps the conditional readable without splitting `ActivePledgeCard` into more pieces.

`ActivePledgeCard` needs to receive the `milestoneViewByProjectId` map. Update its signature and the call site:

Find:
```tsx
function ActivePledgeCard({ pledge }: { pledge: PledgeRow }) {
```

Change to:
```tsx
function ActivePledgeCard({
  pledge,
  milestoneViewByProjectId,
}: {
  pledge: PledgeRow;
  milestoneViewByProjectId: Map<string, BackerMilestoneView>;
}) {
```

Find the call site:
```tsx
{activePledges.map((p) => <ActivePledgeCard key={p.id} pledge={p} />)}
```

Change to:
```tsx
{activePledges.map((p) => (
  <ActivePledgeCard key={p.id} pledge={p} milestoneViewByProjectId={milestoneViewByProjectId} />
))}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 5: Run all milestone-related tests**

```bash
npx vitest run tests/lib/milestones/ tests/components/milestones/
```
Expected: 28 passing.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/my-pledges/page.tsx
git commit -m "feat(dashboard): render MilestoneSummary in my-pledges for funded campaigns"
```

---

## Task 8: Final verification + manual smoke test

This task validates the full integrated work. No new code unless the smoke test reveals a bug.

- [ ] **Step 1: Full test suite**

```bash
npm test
```
Expected: all milestone tests pass; pre-existing failures in `tests/api/projects/create.test.ts` (the same 7 that fail on main today) may still be present but are unrelated. Document but do not fix in this PR.

- [ ] **Step 2: Full typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: 0 errors on the changed files. Pre-existing errors in `tests/api/...` and `tests/lib/milestones/...` (the existing 98 errors flagged in earlier PRs) may still appear; only investigate if a new error is introduced by this PR's code.

- [ ] **Step 4: Manual smoke test (gating release)**

Open the dev server (`npm run dev`, default port 3000 unless `PORT` is overridden) and walk through each scenario. Each is a hard gate.

1. **Active funding campaign** (status=`active`). Public page renders the milestone timeline with all 3 as Upcoming + target dates. Dashboard pledge card shows the existing funding strip (not milestone summary).
2. **Funded campaign with 0 approved milestones** (status=`funded`, no submissions). Public page shows 3 Upcoming. Dashboard summary shows "0 of 3 milestones approved" with grey segments.
3. **Funded campaign with M1 approved**. Public page: ✓ on M1 with date + escrow amount; M2/M3 still Upcoming. Dashboard: "1 of 3 milestones approved · S$X released" with one emerald segment.
4. **Funded campaign with M2 submitted, not yet approved** (M1 already approved). Public page: "Under review" pill on M2 with "Submitted on X" line. Dashboard summary still says "1 of 3 milestones approved" (Under review doesn't bump the count).
5. **Funded campaign with M2 past target_date, no submission**. Both surfaces show Late state with amber emphasis + "Late by N days" copy. Dashboard summary text changes to "Milestone 2 late by N days" overriding the default count line.
6. **Funded campaign with an open dispute** (insert a row into `disputes` with `status='open'` for testing). Both surfaces show the dispute banner with red emphasis. Individual milestone state pills unchanged.
7. **Project with `milestones = NULL` (legacy)**. Public page: no milestone section appears. Dashboard pledge card: keeps the existing funding strip. No crashes, no console errors.
8. **Anonymous viewer** (open the public project page in an incognito/logged-out window). Milestones render identically to the logged-in view. **If this fails (RLS-blocked reads)**: revisit Task 1's verification — the migration in Task 2 may have been needed but skipped, or the migration didn't cover the right table.
9. **Dark mode** on each scenario above. Toggle the theme. Contrast and readability look right; status pills, dispute banner, and segment colors render correctly.

If any scenario fails, fix in this task with a follow-up step. Do not declare done until all 9 pass.

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin claude/milestone-visibility
gh pr create --base main --head claude/milestone-visibility --title "feat(milestones): backer visibility on project page + dashboard" --body "$(cat <<'EOF'
## Summary
- Surfaces the milestone-based escrow system to backers for the first time. The backend has been shipped since migration 018; this PR wires the UI on two surfaces.
- **Public project page** (`/projects/[slug]`): new \`<MilestoneTimeline>\` section between the funding widget and the engagement tabs. Visible to all viewers including anonymous.
- **Backer dashboard** (`/dashboard/my-pledges`): \`<MilestoneSummary>\` (compact 3-segment strip) replaces the funding-progress strip on funded pledge cards.
- Four backer-facing states (Upcoming / Under review / Approved / Late) derived at render time from existing tables. Open campaign disputes surface a banner.
- Zero new dependencies. Conditional RLS migration only added if Task 1 verification revealed it was needed — note in PR body whether migration 023 is part of this diff.

Spec: \`docs/superpowers/specs/2026-04-25-milestone-visibility-design.md\`
Plan: \`docs/superpowers/plans/2026-04-25-milestone-visibility.md\`

## Test plan
- [x] 28 new unit tests pass (\`npx vitest run tests/lib/milestones/ tests/components/milestones/\`)
- [x] \`npx tsc --noEmit\` clean
- [x] \`npm run lint\` clean on changed files
- [x] Manual smoke test all 9 scenarios passed (active, funded with 0/1 approved, M2 under review, M2 late, open dispute, legacy null milestones, anonymous viewer, dark mode)

## Out of scope
- Dispute filing UI
- Reward fulfillment tracking
- Project-updates feed surfacing
- Refund-status visibility
- Milestone email cadence

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review checklist (for the executor)

Before declaring this plan done:

- [ ] Every spec section has a corresponding task: helper (Task 3), components (Tasks 4 + 5), public-page wiring (Task 6), dashboard wiring (Task 7), state derivation tests (Task 3 step 1), component render tests (Tasks 4 + 5 step 1), manual smoke test (Task 8), RLS verification (Task 1), conditional migration (Task 2)
- [ ] All component prop names match between definition and consumer (`milestones: ResolvedMilestone[]`, `hasOpenDispute?: boolean`)
- [ ] All four states (`upcoming` / `under_review` / `approved` / `late`) are tested in the helper AND rendered in both components
- [ ] Smoke test in Task 8 is gated and required before declaring done
- [ ] No tasks reference helpers, types, or methods not defined in this plan or in the existing codebase
