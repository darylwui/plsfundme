"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";

type Stage = "verifying" | "ready" | "success" | "expired";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyCode() {
      const code = searchParams.get("code");

      if (!code) {
        // No code — might be a direct visit or hash-based (old flow)
        // Check if we already have a valid recovery session
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStage("ready");
        } else {
          setStage("expired");
        }
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setStage("expired");
      } else {
        setStage("ready");
      }
    }

    verifyCode();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setStage("success");
  }

  if (stage === "verifying") {
    return (
      <Card padding="lg" className="flex flex-col items-center gap-4 text-center py-10">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-violet)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--color-ink-muted)]">Verifying your reset link…</p>
      </Card>
    );
  }

  if (stage === "expired") {
    return (
      <Card padding="lg" className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
            Link expired
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] max-w-sm">
            This password reset link has expired or already been used. Request a new one.
          </p>
        </div>
        <Link href="/forgot-password" className="w-full">
          <Button size="lg" fullWidth>
            Request new link
          </Button>
        </Link>
        <Link
          href="/login"
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          Back to login
        </Link>
      </Card>
    );
  }

  if (stage === "success") {
    return (
      <Card padding="lg" className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
            Password updated!
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Your password has been changed. You&apos;re now logged in.
          </p>
        </div>
        <Button size="lg" fullWidth onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
          Set new password
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters"
          required
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          error={error ?? undefined}
        />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
