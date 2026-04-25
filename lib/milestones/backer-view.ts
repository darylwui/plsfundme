import type { SupabaseClient } from "@supabase/supabase-js";
import type { MilestoneDecision } from "./types";

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
  id: string;
  milestone_number: number;
  submitted_at: string;
}

interface ReleaseRow {
  milestone_number: number;
  amount_sgd: number;
}

/**
 * Parse a target_date string from `projects.milestones` JSONB. Date-only
 * strings ("2026-05-01") parse as UTC midnight — the safe default. If a
 * future schema change introduces local-time strings, this is the single
 * place to fix the parsing contract.
 */
function parseTargetDate(s: string): Date {
  return new Date(s);
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
  approvals: Array<{ decision: MilestoneDecision; reviewed_at: string }>,
): { decision: MilestoneDecision; reviewed_at: string } | undefined {
  if (!approvals || approvals.length === 0) return undefined;
  return [...approvals].sort((a, b) =>
    a.reviewed_at < b.reviewed_at ? 1 : a.reviewed_at > b.reviewed_at ? -1 : 0,
  )[0];
}

function deriveState(
  promise: MilestonePromise,
  submission: SubmissionRow | undefined,
  approval: { decision: MilestoneDecision; reviewed_at: string } | undefined,
  now: Date,
): MilestoneState {
  if (approval?.decision === "approved") return "approved";
  if (submission) return "under_review";
  if (parseTargetDate(promise.target_date) < now) return "late";
  return "upcoming";
}

/**
 * Resolve the milestone timeline for a backer's view of a campaign.
 *
 * Returns a {@link BackerMilestoneView} with:
 * - `milestones`: an array of exactly 3 {@link ResolvedMilestone} entries, each
 *   in one of four states:
 *   - `"upcoming"` — target date is in the future and no submission exists
 *   - `"under_review"` — a submission exists but the latest approval decision
 *     is not `"approved"` (includes `"rejected"` and `"needs_info"`)
 *   - `"approved"` — latest approval decision is `"approved"`
 *   - `"late"` — target date has passed and no submission exists
 * - `hasOpenDispute`: true when at least one `open` or `investigating` dispute
 *   exists for the campaign
 *
 * Returns `{ milestones: [], hasOpenDispute }` (empty timeline) when
 * `projects.milestones` is missing, not an array of exactly 3 entries, or any
 * entry lacks a string `target_date` — all-or-nothing to avoid partial/confusing
 * backer timelines.
 *
 * Query errors (RLS denials, connection failures) are logged via
 * `console.warn` — which Sentry captures as breadcrumbs — but do NOT throw.
 * Callers receive degraded-but-valid data rather than an unhandled rejection.
 *
 * `target_date` strings are treated as UTC. Date-only strings ("2026-05-01")
 * parse as UTC midnight. See {@link parseTargetDate} for the single parsing point.
 *
 * Queries target the column-scoped public views (`milestone_submissions_public`,
 * `milestone_approvals_public`, `escrow_releases_public`, `disputes_public`)
 * rather than the base tables. The views select only the columns the helper
 * needs and gate by parent project status IN ('active', 'funded', 'failed'),
 * keeping private fields (proof_data, feedback_text, description, backer_id)
 * out of reach of anon/authenticated users. Approvals are fetched in a
 * separate query and joined in JS because views lack FK constraints for
 * Supabase's auto-relationship resolution.
 */
export async function resolveMilestonesForBacker(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  projectId: string,
): Promise<BackerMilestoneView> {
  // Fire all five queries in parallel — they're independent.
  const [projectResult, submissionsResult, approvalsResult, releasesResult, disputesResult] = await Promise.all([
    supabase.from("projects").select("milestones").eq("id", projectId).single(),
    supabase
      .from("milestone_submissions_public")
      .select("id, milestone_number, submitted_at")
      .eq("campaign_id", projectId),
    supabase
      .from("milestone_approvals_public")
      .select("submission_id, decision, reviewed_at"),
    supabase.from("escrow_releases_public").select("milestone_number, amount_sgd").eq("campaign_id", projectId),
    supabase
      .from("disputes_public")
      .select("id")
      .eq("campaign_id", projectId)
      .in("status", ["open", "investigating"]),
  ]);

  // Surface RLS denials / connection failures as breadcrumbs without
  // breaking the UI — milestones gracefully degrade to "no data" but the
  // failure itself shouldn't be silent.
  const queryErrors: Array<[string, unknown]> = [
    ["projects", projectResult.error],
    ["milestone_submissions_public", submissionsResult.error],
    ["milestone_approvals_public", approvalsResult.error],
    ["escrow_releases_public", releasesResult.error],
    ["disputes_public", disputesResult.error],
  ];
  for (const [label, error] of queryErrors) {
    if (error) console.warn(`resolveMilestonesForBacker: ${label} query failed`, error);
  }

  const milestonesRaw = (projectResult.data as { milestones?: unknown } | null)?.milestones;
  if (!isMilestonePromiseArray(milestonesRaw)) {
    return { milestones: [], hasOpenDispute: (disputesResult.data?.length ?? 0) > 0 };
  }

  const submissions = (submissionsResult.data ?? []) as unknown as Array<{
    id: string;
    milestone_number: number;
    submitted_at: string;
  }>;
  const approvals = (approvalsResult.data ?? []) as unknown as Array<{
    submission_id: string;
    decision: MilestoneDecision;
    reviewed_at: string;
  }>;
  const releases = (releasesResult.data ?? []) as unknown as ReleaseRow[];

  // Build lookup maps
  const submissionByNumber = new Map<number, typeof submissions[number]>();
  for (const s of submissions) submissionByNumber.set(s.milestone_number, s);

  const releaseByNumber = new Map<number, ReleaseRow>();
  for (const r of releases) releaseByNumber.set(r.milestone_number, r);

  // Join approvals to submissions via submission_id
  const approvalsBySubmissionId = new Map<string, Array<{ decision: MilestoneDecision; reviewed_at: string }>>();
  for (const a of approvals) {
    const list = approvalsBySubmissionId.get(a.submission_id) ?? [];
    list.push({ decision: a.decision, reviewed_at: a.reviewed_at });
    approvalsBySubmissionId.set(a.submission_id, list);
  }

  const now = new Date();
  const resolved: ResolvedMilestone[] = milestonesRaw.map((promise, i) => {
    const number = (i + 1) as 1 | 2 | 3;
    const submission = submissionByNumber.get(number);
    const submissionApprovals = submission ? (approvalsBySubmissionId.get(submission.id) ?? []) : [];
    const approval = latestApproval(submissionApprovals);
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
        (now.getTime() - parseTargetDate(promise.target_date).getTime()) / MS_PER_DAY,
      );
    }

    return m;
  });

  return {
    milestones: resolved,
    hasOpenDispute: (disputesResult.data?.length ?? 0) > 0,
  };
}
