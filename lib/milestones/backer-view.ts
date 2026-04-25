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
