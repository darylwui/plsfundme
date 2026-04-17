interface Stat {
  value: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="bg-[var(--color-surface-invert)] border-y border-[var(--color-border-invert)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-[var(--color-border-invert)]">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center text-center px-4">
              <span className="font-mono font-black text-2xl text-[var(--color-brand-gold)]">
                {value}
              </span>
              <span className="text-sm md:text-xs text-[var(--color-ink-invert-subtle)] mt-1 uppercase tracking-[0.08em]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
