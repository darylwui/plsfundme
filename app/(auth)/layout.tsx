import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal top bar */}
      <header className="px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-black text-xl tracking-tight text-[var(--color-ink)] hover:text-[var(--color-brand-violet)] transition-colors"
        >
          <span className="text-[var(--color-brand-violet)]">pls</span>fundme
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Decorative bg */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      >
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-sky-200/20 blur-3xl" />
      </div>
    </div>
  );
}
