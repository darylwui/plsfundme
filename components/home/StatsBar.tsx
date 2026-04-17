"use client";

import { useEffect, useState } from "react";

interface Stat {
  value: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
}

function StatItem({ value, label }: Stat) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(numericValue)) {
      setDisplayValue(0);
      return;
    }

    const duration = 1200; // 1.2 seconds
    const startTime = Date.now() + 200; // 200ms delay before starting

    const animateCount = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(animateCount);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      setDisplayValue(Math.floor(numericValue * progress));
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayValue(numericValue);
      }
    };

    requestAnimationFrame(animateCount);
  }, [value]);

  // Extract prefix/suffix if any
  const hasPrefix = /^[^\d]+/.test(value);
  const hasSuffix = /[^\d]+$/.test(value);
  const prefix = hasPrefix ? value.match(/^[^\d]+/)?.[0] : "";
  const suffix = hasSuffix ? value.match(/[^\d]+$/)?.[0] : "";

  return (
    <div key={label} className="flex flex-col items-center text-center px-4 animate-fade-in">
      <span className="font-mono font-black text-2xl text-[var(--color-brand-gold)]">
        {prefix}
        {displayValue}
        {suffix}
      </span>
      <span className="text-sm md:text-xs text-[var(--color-ink-invert-subtle)] mt-1 uppercase tracking-[0.08em]">
        {label}
      </span>
    </div>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="bg-[var(--color-surface-invert)] border-y border-[var(--color-border-invert)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-[var(--color-border-invert)]">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
