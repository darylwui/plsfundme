"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InternationalInterestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/international-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          country,
          projectDescription,
          // Helps us attribute which entry points actually convert
          referrer:
            typeof document !== "undefined" ? document.referrer || null : null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const body = await res
          .json()
          .catch(() => ({ error: "Submission failed. Please try again." }));
        setError(body.error ?? "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-brand-crust)]/30 bg-[var(--color-brand-crumb)]/40 dark:bg-[var(--color-brand-crust-dark)]/15 p-6 sm:p-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-brand-crust)] flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[var(--color-ink)] mb-1">
            You&apos;re on the list 🍞
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] max-w-sm leading-relaxed">
            Check your inbox — we&apos;ve sent a confirmation. We&apos;ll email
            you the moment we open in {country || "your country"}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 flex flex-col gap-5"
    >
      <Input
        label="Your name"
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
        maxLength={100}
        placeholder="e.g. Jane Tan"
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="you@example.com"
        hint="We'll email you when we open creator applications in your country."
      />

      <Input
        label="Country"
        type="text"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        required
        maxLength={60}
        placeholder="e.g. United States"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-ink)]">
          What would you launch?{" "}
          <span className="font-normal text-[var(--color-ink-subtle)]">
            (optional)
          </span>
        </label>
        <textarea
          rows={3}
          maxLength={1000}
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="A sentence or two about your project — helps us prioritise which markets to open next."
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface-raised)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] resize-none"
        />
        <p className="text-xs text-[var(--color-ink-subtle)]">
          Helps us prioritise which markets to open next.
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-btn)] border border-[var(--color-brand-danger)]/40 bg-red-50 dark:bg-red-900/15 px-3 py-2 text-sm text-[var(--color-brand-danger)]">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} size="lg" variant="primary">
        Add me to the list
      </Button>

      <p className="text-xs text-[var(--color-ink-subtle)] text-center">
        We won&apos;t share your details. We&apos;ll only email you about
        platform availability in your country.
      </p>
    </form>
  );
}
