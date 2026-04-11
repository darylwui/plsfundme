"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PMRegistrationSteps } from "@/components/auth/PMRegistrationSteps";

type Role = "backer" | "project_manager" | null;

export function RegisterForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
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

    setSuccess(true);
  }

  // PM success is handled inside PMRegistrationSteps

  if (success) {
    return (
      <div className="text-center flex flex-col gap-3">
        <div className="text-4xl">📬</div>
        <h3 className="font-bold text-lg text-[var(--color-ink)]">
          Check your inbox
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)]">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account.
        </p>
      </div>
    );
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
            className="flex flex-col gap-2 rounded-[var(--radius-card)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left hover:border-[var(--color-brand-violet)] hover:bg-[var(--color-surface-raised)] transition-all group"
          >
            <span className="text-3xl">🎁</span>
            <div>
              <p className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand-violet)] transition-colors">
                I&apos;m a Backer
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Support ideas you believe in.
              </p>
              <p className="text-xs text-green-600 font-medium mt-1.5">
                No approval needed.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("project_manager")}
            className="flex flex-col gap-2 rounded-[var(--radius-card)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left hover:border-[var(--color-brand-violet)] hover:bg-[var(--color-surface-raised)] transition-all group"
          >
            <span className="text-3xl">🚀</span>
            <div>
              <p className="font-bold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand-violet)] transition-colors">
                I want to raise funds
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Launch campaigns and raise funds for your projects.
              </p>
              <p className="text-xs text-amber-600 font-medium mt-1.5">
                Application required.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // PM registration flow
  if (selectedRole === "project_manager") {
    return (
      <PMRegistrationSteps onBack={() => setSelectedRole(null)} />
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
        <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
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
