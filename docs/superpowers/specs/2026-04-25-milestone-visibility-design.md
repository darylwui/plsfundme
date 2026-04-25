# Milestone Visibility for Backers — Design Spec

**Date:** 2026-04-25
**Status:** Approved (brainstorming)
**Owner:** daryl

## Summary

The platform claims "milestone-based escrow protection" in marketing copy, but the milestone state is invisible to anyone who isn't the creator or an admin. The backend has the full system shipped — `projects.milestones` (3-entry JSONB), `milestone_submissions`, `milestone_approvals`, `escrow_releases`, and `disputes` — but no UI surfaces any of it to backers.

This change adds milestone visibility on two surfaces:

1. **Public project page** (`/projects/[slug]`): a prominent standalone section between the funding widget and the engagement tabs. Visible to everyone (logged-in backers, prospective backers, anonymous viewers).
2. **Backer dashboard** (`/dashboard/my-pledges`): a compact 3-segment summary strip inside each funded pledge card, replacing the funding-progress strip (which is meaningless once a campaign is 100% funded).

Zero schema changes — all four backer-facing states are derived from existing tables at render time.

## Goals

- Make the platform's marketing claim ("milestone-based escrow protection") visible to backers and prospective backers.
- Give backers an at-a-glance signal of whether a campaign is on track or off track without needing to email support.
- Use the existing milestone + escrow + dispute schema as-is — no migrations, no new columns.

## Non-goals

- Reward fulfillment tracking (no schema for this; only matters once first campaigns deliver — separate post-launch sub-project).
- Dispute filing UI (the disputes table exists; filing/management is a separate sub-project). This spec only *displays* whether an open dispute exists.
- Surfacing creator updates (`project_updates` table) on the dashboard or making them more prominent on the project page — separate small task.
- Refund-status visibility for individual pledges — separate small task.
- Any new email triggers — milestone email cadence is owned by a separate audit task.

---

## Architecture

Two new components and one new helper; no schema changes, no new routes, no new API endpoints.

```
                           ┌───────────────────────┐
                           │   <MilestoneTimeline> │  shared full view
                           │   (vertical list)     │  reads pre-resolved data
                           └───────────┬───────────┘
                                       │ used by
            ┌──────────────────────────┼──────────────────────────┐
            ▼                                                     ▼
  ┌─────────────────────┐                              ┌─────────────────────┐
  │ /projects/[slug]    │                              │ <MilestoneSummary>  │
  │ standalone section  │                              │ (compact 3-segment  │
  │ (full vertical)     │                              │  strip)             │
  └─────────────────────┘                              │ used in /dashboard/ │
                                                       │ my-pledges row      │
                                                       └─────────────────────┘
```

A single helper at `lib/milestones/backer-view.ts` joins `projects.milestones` with `milestone_submissions`, `milestone_approvals`, `escrow_releases`, and a count of open `disputes`. Both surfaces consume its output.

---

## Backer-facing state set

Backend has many states (`submitted`, `approved`, `rejected`, `needs_info`, plus time-derived `late`, plus dispute states). For backers we collapse to four:

| State | Trigger | Display |
|---|---|---|
| **Upcoming** | No submission, target_date in future | Number badge + target date |
| **Under review** | Submission exists, no approval (covers `submitted`, `rejected`, `needs_info` — admin loop opaque) | Number badge + "Submitted on X" |
| **Approved** | Approval row with `decision='approved'` | ✓ icon + approval date + escrow amount released |
| **Late** | No approved submission AND target_date passed | ! icon + amber tinting + "Late by N days. Disputes auto-open at 45 days." |

If a campaign has any `disputes` row with `status IN ('open', 'investigating')`, the surface gets a top-of-section "Open dispute — under investigation" banner regardless of individual milestone states. We do not show dispute counts.

---

## Components

### `<MilestoneTimeline />`

**File:** `components/milestones/MilestoneTimeline.tsx`
**Type:** Server component (no client JS, no DB writes)
**Props:** `{ milestones: ResolvedMilestone[]; hasOpenDispute?: boolean }`

**Renders:**
- Section heading: **"Milestones"**
- Optional dispute banner (red emphasis): **"Open dispute — under investigation"**, only when `hasOpenDispute === true`
- Three stacked `<MilestoneRow />` items (one per milestone), separated by a 1px divider, no divider after the last row

**`<MilestoneRow />`** is co-located inside `MilestoneTimeline.tsx` (tightly coupled, not exported). It renders:
- **Status icon** (left, 28px circle):
  - `approved`: green check (`bg-emerald-500 text-white`)
  - `late`: amber warning (`bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`)
  - `upcoming`: grey number badge (`bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]`)
  - `under_review`: amber number badge (`bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`)
- **Title** (`<h3>` semantic, but rendered as bold span for layout) + status pill (matches the icon color)
- **Dates line** (small text, muted):
  - `upcoming`: `Due {target_date}` (e.g., "Due 30 Jun 2026")
  - `under_review`: `Submitted {submitted_at}` (e.g., "Submitted 28 Jun 2026")
  - `approved`: `Approved {approved_at} · S${escrow_released_sgd} released`
  - `late`: `Due {target_date} · Late by {late_by_days} days. Disputes auto-open at 45 days.`
- Late rows additionally get a `bg-amber-50 dark:bg-amber-950/20` row tint to draw the eye

### `<MilestoneSummary />`

**File:** `components/milestones/MilestoneSummary.tsx`
**Type:** Server component
**Props:** `{ milestones: ResolvedMilestone[]; hasOpenDispute?: boolean }`

**Renders:**
- Three-segment horizontal bar (one segment per milestone), gap-1, height-2
  - Each segment color matches the milestone state (emerald for approved, amber for under_review/late, grey for upcoming)
  - When `hasOpenDispute === true`: bar tints red (overrides individual state colors)
- Summary text (small, single line below the bar):
  - Default: `{N} of 3 milestones approved` and (if N>0) `· S${total_released} released`
  - When any milestone late: `Milestone {N} late by {days} days` overrides the default
  - When `hasOpenDispute === true`: `Open dispute — under investigation` overrides everything

### `lib/milestones/backer-view.ts`

**File:** `lib/milestones/backer-view.ts`
**Exports:** `resolveMilestonesForBacker(supabase, projectId)` and the `ResolvedMilestone` / `MilestoneState` types

**Behavior:**
- Returns `{ milestones: [], hasOpenDispute: false }` if `projects.milestones` is null or not a 3-element array (legacy / draft data)
- Otherwise returns 3 `ResolvedMilestone` records with state derived from `milestone_submissions` + `milestone_approvals` joined by `milestone_number`
- Pure function on top of three Supabase reads — no caching, no memoization at v1

**Type contract:**

```ts
export type MilestoneState = "upcoming" | "under_review" | "approved" | "late";

export interface ResolvedMilestone {
  number: 1 | 2 | 3;
  title: string;
  description: string;
  target_date: string;          // ISO from projects.milestones JSONB
  state: MilestoneState;
  submitted_at?: string;        // when submitted, present for under_review/approved
  approved_at?: string;         // when admin approved, present only for approved
  escrow_released_sgd?: number; // amount released for this milestone, present only for approved
  late_by_days?: number;        // computed: floor((now - target_date) / 1d), present only for late
}

export interface BackerMilestoneView {
  milestones: ResolvedMilestone[]; // length 0 (legacy) or 3 (always)
  hasOpenDispute: boolean;
}
```

---

## Data flow

### Source queries (inside `resolveMilestonesForBacker`)

```ts
// 1. Project milestones (3 promised entries)
const { data: project } = await supabase
  .from("projects")
  .select("milestones")
  .eq("id", projectId)
  .single();

// 2. Submissions + approvals (small, bounded to 3 rows max each)
const { data: submissions } = await supabase
  .from("milestone_submissions")
  .select("milestone_number, submitted_at, milestone_approvals(decision, reviewed_at)")
  .eq("campaign_id", projectId);

// 3. Escrow releases
const { data: releases } = await supabase
  .from("escrow_releases")
  .select("milestone_number, amount_sgd")
  .eq("campaign_id", projectId);

// 4. Open dispute count
const { data: disputes } = await supabase
  .from("disputes")
  .select("id")
  .eq("campaign_id", projectId)
  .in("status", ["open", "investigating"]);
```

These can be fired in parallel via `Promise.all()` since they're independent.

### State derivation (pure TS)

```ts
function deriveState(
  promise: { target_date: string },
  submission: SubmissionRow | undefined,
  approval: ApprovalRow | undefined,
): MilestoneState {
  if (approval?.decision === "approved") return "approved";
  if (submission) return "under_review"; // covers rejected/needs_info — opaque to backers
  if (new Date(promise.target_date) < new Date()) return "late";
  return "upcoming";
}
```

The schema does not enforce a UNIQUE constraint on `milestone_approvals.submission_id`, so theoretically a single submission could have multiple approval rows. In practice each submission gets reviewed once. The helper takes the most recent approval row by `reviewed_at` (descending) when multiple exist; the assertion test covers this edge case.

### Where the helper is called

- **`/projects/[slug]` page**: called once per request inside the existing server component. Result passed to a new `<MilestoneTimeline />` section between the funding widget and the engagement tabs. Visible to all viewers (logged in or out, backer or not).
- **`/dashboard/my-pledges` page**: called per *funded* pledge in parallel via `Promise.all()`. Result passed to `<MilestoneSummary />` inside the existing pledge card, replacing the funding-progress strip when `pledge.project.status === "funded"`. Not called for `active` (still funding) or `failed`/`cancelled` campaigns.

### Network footprint

- Project page: +4 queries per render (small, all indexed by `campaign_id` / `project_id` / `id`). Acceptable — the page already does ~6 queries.
- Dashboard with N funded pledges: +4N queries. For a backer with 5 active funded pledges, that's 20 extra queries. Bounded — no realistic backer will have hundreds of active funded pledges. If post-launch profiling shows this is a hotspot, batch into a single helper that takes `projectId[]`.

### RLS verification

The four source tables (`milestone_submissions`, `milestone_approvals`, `escrow_releases`, `disputes`) currently have RLS policies that may not include public/backer read access. **Action item for implementation:** verify backers (and anonymous users for the public project page) can read these tables. If not, the safest fix is to add narrow read policies — e.g., "anyone can read `milestone_submissions` rows where the parent project status is `active` or `funded`." Implementer should run a quick RLS test plan and either confirm existing policies suffice or add a small migration. Surface this as a task in the implementation plan.

### Caching/staleness

None for v1. Server components re-run on each navigation. If a milestone gets approved between the dashboard render and a click-through to the project page, the dashboard summary may briefly say "Under review" while the project page (separate request) says "Approved." This is acceptable for v1; users can refresh.

---

## Render-decision logic

### `/projects/[slug]` (existing server component)

After fetching the project, call `resolveMilestonesForBacker(supabase, project.id)`.

- If `result.milestones.length === 0` (legacy / no milestones defined): render nothing in the milestones slot.
- Otherwise: render `<MilestoneTimeline milestones={result.milestones} hasOpenDispute={result.hasOpenDispute} />` as a new section above the existing engagement tabs.
- For active (still funding) campaigns: all three milestones will render as Upcoming with target dates — same component, no special-case needed.
- For failed / cancelled campaigns: the section still renders if milestones were defined (shows the original promise plus any history), but late states won't fire on cancelled campaigns since target_date is irrelevant.

### `/dashboard/my-pledges` (existing server component)

Inside the existing pledge mapping, for each pledge where `pledge.project.status === "funded"`:

```ts
const milestoneView = await resolveMilestonesForBacker(supabase, pledge.project.id);
```

Replace the funding-progress strip JSX with `<MilestoneSummary milestones={milestoneView.milestones} hasOpenDispute={milestoneView.hasOpenDispute} />` when `milestoneView.milestones.length === 3`. Otherwise (legacy data with no milestones defined) keep the existing funding strip — defensive fallback.

For `active`, `pending_review`, `failed`, `cancelled` pledges: keep the existing funding strip as-is.

---

## Edge cases

1. **Pre-launch campaigns with `milestones = NULL`.** Helper returns `{ milestones: [], hasOpenDispute: false }`. Both surfaces render nothing in the milestones slot. No crash, no fake data.

2. **Active (still-funding) campaigns.** Backer pledged; campaign hasn't funded yet. Milestones are *promises*, not status. `<MilestoneTimeline />` renders all 3 as `upcoming`. Dashboard does not call the helper for active pledges — funding strip stays.

3. **Failed / cancelled campaigns.** Public page still renders the milestone timeline as a record of what was promised, but no late states fire (target_date irrelevance). Dashboard pledge card uses the existing past-pledges layout — no milestone summary appears.

4. **Late but submitted, awaiting admin approval.** State = `under_review` (submission wins over time). Backer sees "Submitted on X · Under review" without late warning. Acceptable: creator did their part, ball is in admin's court.

5. **Approved but `escrow_releases` row missing** (crash between approval and escrow write). State = `approved`, `escrow_released_sgd` undefined. Display shows "Approved on X" without the dollar amount. Operations team can audit `escrow_releases` separately.

6. **Multiple disputes from different backers.** `hasOpenDispute` is a boolean (count > 0). Backers don't see counts. Single banner regardless of dispute volume.

7. **Anonymous viewer** (logged out, no session). Public project page renders milestones identically. Component takes no `currentUserId`. RLS on source tables governs read auth — see RLS verification action item above.

8. **Race condition: milestone approved between dashboard render and project page render.** Acceptable inconsistency; refresh reconciles.

9. **Dark mode.** All components use existing CSS variables (`--color-ink`, `--color-surface`, `--color-border`, `--color-brand-*`). Status pills follow the patterns already in `SingpassVerificationCard.tsx`:
   - Amber: `bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`
   - Emerald: `bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400`
   - Red (dispute): `bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400`

---

## Testing

### Automated (Vitest + Testing Library)

**`tests/lib/milestones/backer-view.test.ts`** — pure-TS state derivation. Tests the `deriveState()` helper and the full `resolveMilestonesForBacker` function with mocked Supabase responses:
- Approved submission → `approved`
- Submitted, no approval → `under_review`
- Rejected submission → `under_review` (admin loop opaque)
- `needs_info` submission → `under_review`
- No submission, target in future → `upcoming`
- No submission, target in past → `late`, with `late_by_days` matching `floor((now - target_date) / 1d)`
- Submission with **multiple approval rows** → uses the latest by `reviewed_at`
- Mixed milestones (M1 approved, M2 under_review, M3 upcoming) → array shape correct, each milestone reflects its own state
- Project with `milestones = null` → `{ milestones: [], hasOpenDispute: false }`
- Project with `milestones = []` → `{ milestones: [], hasOpenDispute: false }`
- Project with `milestones` length != 3 → `{ milestones: [], hasOpenDispute: false }`
- Open dispute exists → `hasOpenDispute === true`
- No disputes → `hasOpenDispute === false`

**`tests/components/milestones/MilestoneTimeline.test.tsx`** — render assertions:
- All 3 milestone titles render
- "Approved" pill + `S${amount} released` shown when state is approved
- "Under review" pill + "Submitted on" line when state is under_review
- "Late" pill + amber tint + "Late by N days" copy when state is late
- "Upcoming" pill + "Due X" when state is upcoming
- Dispute banner renders when `hasOpenDispute={true}`
- No dispute banner when `hasOpenDispute={false}`
- Empty milestones array → component renders nothing visible (no header, no banner)

**`tests/components/milestones/MilestoneSummary.test.tsx`** — render assertions:
- 3-segment bar with correct color per state combination
- "1 of 3 approved · S$X released" copy when one approved
- "0 of 3 approved" copy when none approved (no dollar suffix)
- "Milestone 2 late by 5 days" copy overrides default when M2 is late
- "Open dispute — under investigation" copy + red bar tint when `hasOpenDispute={true}`
- Empty milestones array → component renders nothing

### Manual smoke test (gating release)

Mirrors the PR #84 / #85 pattern. Hit the dev server and verify each scenario:

1. **Active funding campaign.** Public page renders milestone timeline with all 3 as Upcoming + target dates. Dashboard pledge card shows the existing funding strip (not milestone summary).
2. **Funded campaign with 0 approved milestones.** Public page shows 3 Upcoming. Dashboard summary shows "0 of 3 approved" with grey segments.
3. **Funded campaign with M1 approved.** Public page shows ✓ on M1 with date + escrow amount, M2/M3 still Upcoming. Dashboard summary shows "1 of 3 approved · S$X released" with one emerald segment.
4. **Funded campaign with M2 submitted, not yet approved.** Public page shows "Under review" pill on M2 with "Submitted on X" line. Dashboard summary still shows "1 of 3 approved" (Under review doesn't bump the count).
5. **Funded campaign with M2 past target_date, no submission.** Both surfaces show Late state with amber emphasis + "Late by N days" copy.
6. **Funded campaign with open dispute.** Both surfaces show the dispute banner with red emphasis. Individual milestone state pills unchanged.
7. **Project with `milestones = NULL` (legacy).** No milestone section appears on the public page. Dashboard pledge card keeps its funding strip. No crash, no console errors.
8. **Anonymous viewer (logged out).** Public page shows milestones identically to logged-in view.
9. **Dark mode.** Toggle on each scenario above. Contrast and readability look right; no broken color combinations.

### Out of scope

- E2E / visual regression (no Playwright/Cypress in project)
- Dispute filing UI (separate sub-project)
- Reward fulfillment tracking (separate sub-project)
- Project-updates surfacing (separate small task)
- Refund-status visibility (separate small task)
- Re-testing the existing `/api/admin/milestones/*` endpoints — already shipped, have their own coverage

---

## File summary

**New files:**
- `lib/milestones/backer-view.ts` — `resolveMilestonesForBacker()` helper + types
- `components/milestones/MilestoneTimeline.tsx` — full vertical milestone list (server component)
- `components/milestones/MilestoneSummary.tsx` — compact 3-segment strip (server component)
- `tests/lib/milestones/backer-view.test.ts`
- `tests/components/milestones/MilestoneTimeline.test.tsx`
- `tests/components/milestones/MilestoneSummary.test.tsx`

**Modified files:**
- `app/projects/[slug]/page.tsx` — call `resolveMilestonesForBacker`, render `<MilestoneTimeline />` as a new section between the funding widget and the engagement tabs
- `app/dashboard/my-pledges/page.tsx` — for each funded pledge, call `resolveMilestonesForBacker` and render `<MilestoneSummary />` inside the pledge card, replacing the funding-progress strip when `project.status === "funded"`

**Possibly added (RLS verification action item):**
- `supabase/migrations/<next-number>_milestone_backer_read.sql` — only if the RLS verification step reveals backers or anonymous viewers cannot read `milestone_submissions`, `milestone_approvals`, `escrow_releases`, or `disputes` for funded campaigns. The implementer runs the RLS test plan in Task 1 of the implementation plan and decides; if a migration is needed, it adds narrow read policies (e.g., "any authenticated or anonymous user can read these rows for projects with `status IN ('active', 'funded', 'failed', 'cancelled')`"). The next migration number is computed by listing the `supabase/migrations/` directory.

**Unmodified:**
- All milestone admin / creator surfaces (`MilestoneSubmissionForm`, `MilestoneReviewQueue`, `app/api/admin/milestones/*`)
- Existing schema — no migrations required by this design

---

## Open questions

None. All design decisions finalized in brainstorming.
