"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export function BackerNotifyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/backer-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          referrer: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-btn)] bg-[var(--color-brand-success)]/10 text-[var(--color-brand-success)] text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        You&apos;re on the list — we&apos;ll email you.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={status === "loading"}
          className="flex-1 min-w-0 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="group shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-btn)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-sm transition-all duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[var(--color-brand-crumb)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Notify me
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-[200ms] group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-[var(--color-brand-danger)]">{errorMsg}</p>
      )}
    </form>
  );
}
