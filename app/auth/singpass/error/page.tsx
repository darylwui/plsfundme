import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SingpassIcon } from "@/components/icons/SingpassIcon";

export const metadata: Metadata = {
  title: "SingPass verification error",
  description: "Something went wrong with SingPass verification. Try again or contact support.",
};

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
            <div className="relative">
              <SingpassIcon className="w-12 h-12" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-brand-danger)]/15 ring-2 ring-[var(--color-surface)] flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-[var(--color-brand-danger)]" />
              </span>
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
                <Button asChild variant="primary" size="md" className="flex-1">
                  <Link href="/api/auth/singpass">
                    <RefreshCw className="w-4 h-4" />
                    Try again
                  </Link>
                </Button>
              )}
              {msg.action === "support" && (
                <Button asChild variant="primary" size="md" className="flex-1">
                  <a href="mailto:hello@getthatbread.sg">
                    Contact support
                  </a>
                </Button>
              )}
              <Button asChild variant="secondary" size="md" className="flex-1">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4" />
                  Back to dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
