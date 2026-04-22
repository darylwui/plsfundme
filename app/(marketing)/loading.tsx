export default function MarketingLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton — matches the gradient hero section */}
      <div className="min-h-[420px] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20" />

      {/* Stats bar skeleton */}
      <div className="h-16 bg-amber-100/40 dark:bg-amber-900/20" />

      {/* Discovery section skeleton */}
      <div className="bg-[var(--color-surface-raised)] border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-14">
          {/* Filter tabs skeleton */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="h-10 w-64 rounded-lg bg-amber-100/60 dark:bg-amber-900/20" />
            <div className="h-5 w-16 rounded bg-amber-100/60 dark:bg-amber-900/20" />
          </div>

          {/* Project card grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-amber-100/60 dark:bg-amber-900/20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
