import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

const MESSAGES: Record<string, { heading: string; body: string; action: "retry" | "support" | "back" }> = {
  duplicate: {
    heading: "Identity already linked",
    body: "This SingPass identity is already linked to another getthatbread account. If you think this is a mistake, contact us.",
    action: "support",
  },
  expired: {
    heading: "Session expired",
    body: "Your verification session timed out. Please start again from your dashboard.",
    action: "back",
  },
  failed: {
    heading: "Verification failed",
    body: "Something went wrong during verification. Please try again — if the problem persists, contact support.",
    action: "retry",
  },
};

export default async function SingPassErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const msg = MESSAGES[reason ?? ""] ?? MESSAGES.failed;

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-none p-8 text-center flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>

            <div>
              <h1 className="text-xl font-black text-[var(--color-ink)] mb-2">
                {msg.heading}
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                {msg.body}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {msg.action === "retry" && (
                <Link
                  href="/api/auth/singpass"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white font-semibold text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </Link>
              )}
              {msg.action === "support" && (
                <a
                  href="mailto:hello@getthatbread.sg"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white font-semibold text-sm"
                >
                  Contact support
                </a>
              )}
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-btn)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-[var(--color-ink)] font-semibold text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
