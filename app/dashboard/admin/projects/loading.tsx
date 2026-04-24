export default function AdminProjectsLoading() {
  return (
    <div className="animate-pulse max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-8 w-56 rounded bg-amber-100/60 dark:bg-amber-900/20 mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-amber-100/60 dark:bg-amber-900/20" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-amber-100/60 dark:bg-amber-900/20" />
        ))}
      </div>
    </div>
  );
}
