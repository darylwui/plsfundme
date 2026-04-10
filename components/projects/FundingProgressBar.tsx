import { fundingPercent, formatSgd } from "@/lib/utils/currency";
import { daysRemaining } from "@/lib/utils/dates";

interface FundingProgressBarProps {
  pledged: number;
  goal: number;
  deadline: string;
  backerCount: number;
  size?: "sm" | "md";
}

export function FundingProgressBar({
  pledged,
  goal,
  deadline,
  backerCount,
  size = "md",
}: FundingProgressBarProps) {
  const percent = fundingPercent(pledged, goal);
  const days = daysRemaining(deadline);
  const funded = pledged >= goal;

  return (
    <div className="flex flex-col gap-2">
      {/* Bar */}
      <div className="relative h-2 rounded-full bg-[var(--color-surface-overlay)] overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            funded
              ? "bg-[var(--color-brand-lime)]"
              : days <= 3
              ? "bg-[var(--color-brand-coral)]"
              : "bg-[var(--color-brand-violet)]"
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div
        className={`flex items-end justify-between gap-2 ${
          size === "sm" ? "text-xs" : "text-sm"
        }`}
      >
        <div>
          <span className="font-bold text-[var(--color-ink)]">
            {formatSgd(pledged)}
          </span>
          <span className="text-[var(--color-ink-subtle)]">
            {" "}
            raised of {formatSgd(goal)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[var(--color-ink-muted)] shrink-0">
          <span>
            <strong className="text-[var(--color-ink)]">{percent}%</strong>
          </span>
          <span>
            <strong
              className={
                days <= 3 ? "text-[var(--color-brand-coral)]" : "text-[var(--color-ink)]"
              }
            >
              {days}d
            </strong>{" "}
            left
          </span>
          <span>
            <strong className="text-[var(--color-ink)]">{backerCount}</strong>{" "}
            backers
          </span>
        </div>
      </div>
    </div>
  );
}
