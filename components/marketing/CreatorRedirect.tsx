import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";

export function CreatorRedirect() {
  return (
    <div className="rounded-[var(--radius-card)] ring-1 ring-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8">
      <div className="w-12 h-12 shrink-0 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] flex items-center justify-center shadow-[var(--shadow-cta)]">
        <Rocket className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg md:text-xl font-black text-[var(--color-ink)] tracking-tight">
          Got an idea of your own?
        </h3>
        <p className="text-[var(--color-ink-muted)] leading-relaxed mt-1">
          Here&apos;s how creators raise capital on get that bread — from first draft to funded.
        </p>
      </div>
      <Link
        href="/for-creators"
        className="inline-flex items-center gap-1.5 shrink-0 text-sm font-bold text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)] hover:gap-2 transition-all"
      >
        See the creator guide
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
