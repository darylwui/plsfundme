"use client";

import { fundingPercent } from "@/lib/utils/currency";
import { daysRemaining } from "@/lib/utils/dates";
import { useCurrency } from "@/contexts/CurrencyContext";

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
  const { convert, format } = useCurrency();
  const isSmall = size === "sm";
  const percent = fundingPercent(pledged, goal);
  const days = daysRemaining(deadline);
  const funded = pledged >= goal;
  const nearFunded = percent >= 90;

  const barColor = funded
    ? "bg-[var(--color-brand-success)]"
    : days <= 3
    ? "bg-[var(--color-brand-danger)]"
    : "bg-[var(--color-brand-crust)]";

  const barGlow = nearFunded || funded
    ? funded
      ? "0 0 8px 0 rgba(101, 163, 13, 0.5)"
      : days <= 3
      ? "0 0 8px 0 rgba(194, 65, 12, 0.5)"
      : "0 0 8px 0 rgba(217, 119, 6, 0.5)"
    : undefined;

  return (
    <div className="flex flex-col gap-2">
      {/* Bar */}
      <div className="relative h-1.5 rounded-full bg-[var(--color-surface-overlay)] overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500`}
          style={{
            width: `${Math.min(percent, 100)}%`,
            ...(barGlow ? { boxShadow: barGlow } : {}),
          }}
        >
          <div className={`w-full h-full rounded-full ${barColor}`} />
        </div>
      </div>

      {/* Stats */}
      <div
        className={
          isSmall
              ? "flex flex-col gap-2 text-sm md:text-xs"
            : "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between text-sm"
        }
      >
        <div className={isSmall ? "min-h-[2.25rem]" : "min-h-[2.25rem] sm:min-h-0"}>
          <span className="font-bold font-mono text-[var(--color-ink)]">
            {format(convert(pledged))}
          </span>
          <span className="text-[var(--color-ink-subtle)]">
            {" "}
            raised of{" "}
            <span className="font-mono">{format(convert(goal))}</span>
          </span>
        </div>
        <div
          className={
            isSmall
              ? "flex items-center justify-between gap-3 text-[var(--color-ink-muted)]"
              : "flex items-center justify-between gap-3 text-[var(--color-ink-muted)] sm:justify-start sm:shrink-0"
          }
        >
          <span>
            <strong className="font-mono text-[var(--color-ink)]">{percent}%</strong>
          </span>
          <span>
            <strong
              className={`font-mono ${
                days <= 3 ? "text-[var(--color-brand-danger)]" : "text-[var(--color-ink)]"
              }`}
            >
              {days}d
            </strong>{" "}
            left
          </span>
          <span>
            <strong className="font-mono text-[var(--color-ink)]">{backerCount}</strong>{" "}
            backers
          </span>
        </div>
      </div>
    </div>
  );
}
