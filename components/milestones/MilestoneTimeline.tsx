import Link from "next/link";
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
          role="status"
          className="px-5 py-3 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" aria-hidden="true" />
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
        <Check className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (state === "late") {
    return (
      <div className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>
        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
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
        Due {formatDate(target_date)} · Late by {late_by_days ?? 0} days.{" "}
        <Link
          href="/terms?tab=refund"
          className="underline hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-crust)] rounded"
        >
          Disputes auto-open at 45 days.
        </Link>
      </>
    );
  }
  // upcoming
  return <>Due {formatDate(target_date)}</>;
}
