"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportCampaignButtonProps {
  projectId: string;
  projectTitle: string;
  className?: string;
}

const MIN_LEN = 10;
const MAX_LEN = 2000;

const CATEGORIES = [
  { value: "fraud", label: "Fraud or scam" },
  { value: "ip_infringement", label: "IP infringement or counterfeit" },
  { value: "illegal_regulated", label: "Illegal or unlicensed regulated product" },
  { value: "inappropriate", label: "Inappropriate or hateful content" },
  { value: "other", label: "Other" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export function ReportCampaignButton({
  projectId,
  projectTitle,
  className = "",
}: ReportCampaignButtonProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("fraud");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function openDialog() {
    setError(null);
    setSuccess(false);
    setMessage("");
    setCategory("fraud");
    setOpen(true);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  function closeDialog() {
    dialogRef.current?.close();
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = message.trim();
    if (trimmed.length < MIN_LEN) {
      setError(`Please add at least ${MIN_LEN} characters of detail.`);
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setError(`Message must be at most ${MAX_LEN} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/campaign-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          category,
          message: trimmed,
        }),
      });
      const json = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Could not file report.");
      }
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-subtle)] hover:text-[var(--color-brand-danger)] transition-colors ${className}`}
      >
        <Flag className="w-3.5 h-3.5" aria-hidden="true" />
        Report this campaign
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto rounded-[var(--radius-card)] bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm w-[min(540px,calc(100vw-32px))] p-0"
      >
        {open && (
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-danger)]">
                  Report campaign
                </p>
                <h2 className="text-lg font-black mt-1 leading-tight">
                  Report {projectTitle}
                </h2>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">
                  Reports go to our team and stay confidential — the creator is not notified.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close"
                className="text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] -mt-1 -mr-1 p-1"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {success ? (
              <div className="px-5 py-6 flex flex-col gap-3">
                <p className="font-bold text-[var(--color-ink)]">Report received.</p>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  Our team will review and investigate. We don&apos;t share who filed a
                  report. Thanks for keeping the platform safe.
                </p>
                <div className="flex justify-end mt-2">
                  <Button type="button" variant="secondary" size="sm" onClick={closeDialog}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="report-category" className="text-xs font-bold text-[var(--color-ink)]">
                    What&apos;s the issue?
                  </label>
                  <select
                    id="report-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="h-10 px-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="report-message" className="text-xs font-bold text-[var(--color-ink)]">
                    Tell us more
                  </label>
                  <textarea
                    id="report-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What did you notice and where? Links, screenshots, or specific claims help us investigate faster."
                    rows={6}
                    minLength={MIN_LEN}
                    maxLength={MAX_LEN}
                    required
                    className="px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
                  />
                  <div className="flex items-center justify-between text-xs text-[var(--color-ink-subtle)]">
                    <span>False reports may affect your account.</span>
                    <span className={message.length > MAX_LEN ? "text-[var(--color-brand-danger)]" : ""}>
                      {message.length} / {MAX_LEN}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="rounded-[var(--radius-btn)] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 px-3 py-2 text-sm text-[var(--color-brand-danger)]">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={closeDialog} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="danger"
                    loading={submitting}
                    disabled={submitting || message.trim().length < MIN_LEN}
                  >
                    Submit report
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
