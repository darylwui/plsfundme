export default function ProjectLoading() {
  return (
    <div className="animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-4 w-32 rounded bg-amber-100/60 dark:bg-amber-900/20 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video w-full rounded-2xl bg-amber-100/60 dark:bg-amber-900/20" />
            <div className="h-8 w-3/4 rounded bg-amber-100/60 dark:bg-amber-900/20" />
            <div className="h-4 w-full rounded bg-amber-100/60 dark:bg-amber-900/20" />
            <div className="h-4 w-5/6 rounded bg-amber-100/60 dark:bg-amber-900/20" />
          </div>
          <div className="space-y-4">
            <div className="h-64 rounded-2xl bg-amber-100/60 dark:bg-amber-900/20" />
            <div className="h-32 rounded-2xl bg-amber-100/60 dark:bg-amber-900/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
