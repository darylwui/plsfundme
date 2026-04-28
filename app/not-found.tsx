import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BugReportForm } from "@/components/BugReportForm";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center bg-[var(--color-surface-raised)] px-4 py-24">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🔍</div>
        <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed">
          Hmm, we couldn&apos;t find what you were looking for. It might have
          moved or never existed.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/explore">Explore projects</Link>
          </Button>
        </div>
        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-ink-muted)] mb-1">
            Think this is a mistake?
          </p>
          <BugReportForm />
          <p className="mt-5 text-xs italic text-[var(--color-ink-subtle)]">
            &ldquo;Don&apos;t get even, get even better.&rdquo;
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
            Thank you in advance for reporting this to us! &mdash; Get That Bread team
          </p>
        </div>
      </div>
    </main>
  );
}
