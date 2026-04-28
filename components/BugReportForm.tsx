"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BugReportForm({ currentPath }: { currentPath?: string }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentPath ?? window.location.href, desc, email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-sm text-[var(--color-ink-subtle)]">
        ✅ Got it — we&apos;ll look into it. Thanks for helping us improve!
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline"
      >
        🐛 Report this issue
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 text-left space-y-3">
      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1">
          What were you trying to do?
        </label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          required
          minLength={5}
          maxLength={500}
          rows={3}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
          placeholder="I clicked … and ended up here"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-muted)] mb-1">
          Your email <span className="text-[var(--color-ink-subtle)]">(optional — so we can follow up)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
          placeholder="you@example.com"
        />
      </div>
      {status === "error" && (
        <p className="text-xs text-red-600">Something went wrong — try emailing us directly at hello@getthatbread.sg</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Send report"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
