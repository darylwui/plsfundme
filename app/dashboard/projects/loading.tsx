export default function DashboardProjectsLoading() {
  return (
    <div className="animate-pulse max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-48 rounded bg-amber-100/60 dark:bg-amber-900/20" />
        <div className="h-10 w-32 rounded-[var(--radius-btn)] bg-amber-100/60 dark:bg-amber-900/20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 rounded-2xl bg-amber-100/60 dark:bg-amber-900/20" />
        ))}
      </div>
    </div>
  );
}
