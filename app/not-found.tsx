import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";

const SUPPORT_EMAIL = "support@getthatbread.sg";

export default function NotFound() {
  const subject = encodeURIComponent("404 Page Not Found");
  const body = encodeURIComponent(
    "Hi,\n\nI encountered a 404 error on get that bread.\n\nPage URL: (paste URL here)\nWhat I was trying to do: (describe here)\n\nThanks"
  );

  return (
    <>
      <Navbar />
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
            <Link href="/">
              <Button size="lg">Go home</Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="secondary">
                Explore projects
              </Button>
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-ink-subtle)] mb-3">
              Think this is a mistake?
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-violet)] hover:underline"
            >
              🐛 Report this issue
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
