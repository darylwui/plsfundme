"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreatorRegistrationSteps } from "@/components/auth/CreatorRegistrationSteps";

type Role = "backer" | "creator" | null;

function RegisterSuccess({
  email,
  mailHost,
}: {
  email: string;
  mailHost: { url: string; label: string } | null;
}) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setResendError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
    setResending(false);
    if (error) {
      setResendError(error.message);
      return;
    }
    setResent(true);
  }

  return (
    <div className="text-center flex flex-col gap-4 items-center">
      <div className="text-4xl">📬</div>
      <div>
        <h3 className="font-bold text-lg text-[var(--color-ink)]">
          Check your inbox
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account.
        </p>
      </div>

      {mailHost && (
        <a
          href={mailHost.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-crust-dark)] transition-colors w-full sm:w-auto"
        >
          {mailHost.label} →
        </a>
      )}

      <div className="flex flex-col gap-1.5 items-center">
        <p className="text-xs text-[var(--color-ink-muted)]">
          Didn&apos;t get the email? Check spam, or
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resent}
          className="text-xs font-semibold text-[var(--color-brand-crust)] hover:underline disabled:opacity-60 disabled:no-underline"
        >
          {resent ? "Sent — check your inbox again" : resending ? "Resending…" : "Resend confirmation email"}
        </button>
        {resendError && (
          <p className="text-xs text-[var(--color-brand-danger)] mt-1">{resendError}</p>
        )}
      </div>
    </div>
  );
}

interface RegisterFormProps {
  initialRole?: Role;
}

export function RegisterForm({ initialRole = null }: RegisterFormProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = "Name is required";
    if (!email) e.email = "Email is required";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName.trim(), role: "backer" },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      setErrors({ form: error.message });
      setLoading(false);
      return;
    }

    trackEvent("account_created", { method: "email" });
    setSuccess(true);
  }

  // PM success is handled inside CreatorRegistrationSteps

  if (success) {
    const provider = email.split("@")[1]?.toLowerCase() ?? "";
    const mailHost =
      provider.includes("gmail") || provider.includes("googlemail")
        ? { url: "https://mail.google.com", label: "Open Gmail" }
        : provider.includes("outlook") || provider.includes("hotmail") || provider.includes("live")
        ? { url: "https://outlook.live.com/mail", label: "Open Outlook" }
        : provider.includes("yahoo")
        ? { url: "https://mail.yahoo.com", label: "Open Yahoo Mail" }
        : null;

    return <RegisterSuccess email={email} mailHost={mailHost} />;
  }

  // Role selection screen
  if (selectedRole === null) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <h3 className="font-bold text-lg text-[var(--color-ink)]">
            How do you want to use get that bread?
          </h3>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Choose your account type to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedRole("backer")}
            className="flex flex-col gap-2 rounded-[var(--radius-card)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left hover:border-[var(--color-brand-crust)] hover:bg-[var(--color-surface-raised)] transition-all group"
          >
            <span className="text-3xl">🎁</span>
            <div>
              <p className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand-crust)] transition-colors">
                I&apos;m a Backer
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Support ideas you believe in.
              </p>
              <p className="text-xs text-[var(--color-brand-success)] font-medium mt-1.5">
                No approval needed.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("creator")}
            className="flex flex-col gap-2 rounded-[var(--radius-card)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left hover:border-[var(--color-brand-crust)] hover:bg-[var(--color-surface-raised)] transition-all group"
          >
            <span className="text-3xl">🚀</span>
            <div>
              <p className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand-crust)] transition-colors">
                I want to raise funds
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Launch campaigns and raise funds for your projects.
              </p>
              <p className="text-xs text-[var(--color-brand-golden)] font-medium mt-1.5">
                Application required.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // PM registration flow
  if (selectedRole === "creator") {
    return (
      <CreatorRegistrationSteps onBack={() => setSelectedRole(null)} />
    );
  }

  // Backer registration form
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setSelectedRole(null)}
        className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors w-fit"
      >
        ← Back
      </button>

      {errors.form && (
        <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-[var(--color-brand-danger)]">
          {errors.form}
        </div>
      )}
      <Input
        label="Your name"
        type="text"
        autoComplete="name"
        placeholder="Jane Tan"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={errors.displayName}
        required
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint="Must be at least 8 characters"
        showPasswordToggle
        required
      />
      <Button type="submit" size="lg" fullWidth loading={loading}>
        Create account
      </Button>
      <p className="text-xs text-center text-[var(--color-ink-subtle)]">
        By signing up you agree to our{" "}
        <a href="/terms" className="underline hover:text-[var(--color-ink)]">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-[var(--color-ink)]">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
