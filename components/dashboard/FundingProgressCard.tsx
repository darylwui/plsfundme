"use client";

import { useRealtimeFunding } from "@/hooks/useRealtimeFunding";
import { fundingPercent, formatSgd } from "@/lib/utils/currency";
import { daysRemaining } from "@/lib/utils/dates";
import { TrendingUp, Users, Clock } from "lucide-react";

interface FundingProgressCardProps {
  projectId: string;
  goal: number;
  deadline: string;
  initialPledged: number;
  initialBackers: number;
}

export function FundingProgressCard({
  projectId,
  goal,
  deadline,
  initialPledged,
  initialBackers,
}: FundingProgressCardProps) {
  const { amount_pledged_sgd, backer_count } = useRealtimeFunding(projectId, {
    amount_pledged_sgd: initialPledged,
    backer_count: initialBackers,
  });

  const percent = fundingPercent(amount_pledged_sgd, goal);
  const days = daysRemaining(deadline);
  const isFunded = amount_pledged_sgd >= goal;

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[var(--color-ink)]">Funding progress</h3>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-lime)] bg-lime-50 dark:bg-lime-900/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-lime)] animate-pulse" />
          Live
        </div>
      </div>

      {/* Big number */}
      <div className="mb-4">
        <p className="text-3xl font-black text-[var(--color-ink)]">
          {formatSgd(amount_pledged_sgd)}
        </p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          of {formatSgd(goal)} goal
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-[var(--color-surface-overlay)] overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isFunded ? "bg-[var(--color-brand-lime)]" : "bg-[var(--color-brand-violet)]"
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Stat
          icon={<TrendingUp className="w-4 h-4" />}
          value={`${percent}%`}
          label="Funded"
          highlight={isFunded}
        />
        <Stat
          icon={<Users className="w-4 h-4" />}
          value={String(backer_count)}
          label="Backers"
        />
        <Stat
          icon={<Clock className="w-4 h-4" />}
          value={`${days}d`}
          label="Remaining"
          urgent={days <= 3}
        />
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  highlight,
  urgent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  highlight?: boolean;
  urgent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-1 ${
          highlight
            ? "bg-lime-100 dark:bg-lime-900/20 text-[var(--color-brand-lime)]"
            : urgent
            ? "bg-red-100 dark:bg-red-900/20 text-[var(--color-brand-coral)]"
            : "bg-[var(--color-surface-overlay)] text-[var(--color-ink-muted)]"
        }`}
      >
        {icon}
      </div>
      <p
        className={`text-lg font-black ${
          highlight
            ? "text-[var(--color-brand-lime)]"
            : urgent
            ? "text-[var(--color-brand-coral)]"
            : "text-[var(--color-ink)]"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-[var(--color-ink-subtle)]">{label}</p>
    </div>
  );
}
