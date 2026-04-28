"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = "/dashboard" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setError("Too many login attempts. Please wait a moment and try again.");
      } else {
        setError(
          json.error === "Invalid login credentials"
            ? "Wrong email or password. Give it another shot."
            : (json.error ?? "Something went wrong. Please try again.")
        );
      }
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="flex flex-col gap-1.5">
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          showPasswordToggle
          error={error ?? undefined}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-[var(--color-brand-crust)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      <Button type="submit" size="lg" fullWidth loading={loading}>
        Log in
      </Button>
    </form>
  );
}
