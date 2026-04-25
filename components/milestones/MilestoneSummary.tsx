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
