"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <Card padding="lg" className="flex flex-col gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
            Check your inbox
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] max-w-sm">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-semibold text-[var(--color-ink)]">{email}</span>.
            Click the link in the email to set a new password.
          </p>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-[var(--color-brand-crust)] hover:underline font-medium"
            >
              try again
            </button>
            .
          </p>
        </div>
        <Button asChild variant="secondary" fullWidth>
          <Link href="/login">
            Back to login
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
          Forgot password?
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          error={error ?? undefined}
        />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Send reset link
        </Button>
      </form>

      <div className="flex justify-center">
        <BackLink href="/login">Back to login</BackLink>
      </div>
    </Card>
  );
}
