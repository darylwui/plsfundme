"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "hello@getthatbread.sg";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error(error);
    }
  }, [error]);

  const subject = encodeURIComponent("Something broke on get that bread");
  const body = encodeURIComponent(
    `Hi,\n\nI hit an error on get that bread.\n\nPage URL: ${
      typeof window !== "undefined" ? window.location.href : "(unknown)"
    }\nError digest: ${error.digest ?? "(none)"}\nWhat I was doing: (describe here)\n\nThanks`
  );

  return (
    <main className="flex-1 flex items-center justify-center bg-[var(--color-surface-raised)] px-4 py-24">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6" aria-hidden>
          🫠
        </div>
        <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
          Something went sideways.
        </h1>
        <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed">
          This one&apos;s on us — an unexpected error interrupted your session.
          Try again, or head home and we&apos;ll get things sorted.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/">
            <Button size="lg" variant="secondary">
              Go home
            </Button>
          </Link>
        </div>
        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-ink-subtle)] mb-3">
            Still stuck? We want to hear about it.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-crust)] hover:underline"
          >
            🐛 Report this issue
          </a>
          {error.digest ? (
            <p className="mt-4 font-mono text-[11px] text-[var(--color-ink-subtle)]">
              Ref: {error.digest}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
