"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportConcernButtonProps {
  pledgeId: string;
  projectTitle: string;
  /**
   * Milestone number (1-3) currently in the `late` state, if any.
   * If provided, the dialog pre-selects this milestone in the scope dropdown.
   */
  defaultLateMilestone?: 1 | 2 | 3 | null;
  /**
   * Visual style — `inline` is a small text-style trigger (for use inside
   * a card row), `compact` is a small ghost button (for use under a section).
   */
  variant?: "inline" | "compact";
  /**
   * Optional className passthrough for layout adjustments by the parent.
   */
  className?: string;
}

const MIN_LEN = 10;
const MAX_LEN = 2000;

type Scope = "whole" | "1" | "2" | "3";

export function ReportConcernButton({
  pledgeId,
  projectTitle,
  defaultLateMilestone = null,
  variant = "compact",
  className = "",
}: ReportConcernButtonProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>(
    defaultLateMilestone ? (String(defaultLateMilestone) as Scope) : "whole",
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset scope default if the prop changes (rare in practice, but cheap)
  useEffect(() => {
    setScope(defaultLateMilestone ? (String(defaultLateMilestone) as Scope) : "whole");
  }, [defaultLateMilestone]);

  function openDialog() {
    setError(null);
    setSuccess(false);
    setMessage("");
    setOpen(true);
    // Wait for the next paint so the dialog is in the DOM
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
      setError(`Message must be at least ${MIN_LEN} characters.`);
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setError(`Message must be at most ${MAX_LEN} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/dispute-concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pledgeId,
          milestoneNumber: scope === "whole" ? null : Number(scope),
          message: trimmed,
        }),
      });
      const json = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Could not file concern.");
      }
      setSuccess(true);
      // Refresh the dashboard so the open-concern indicator appears
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const triggerLabel = (
    <>
      <MessageSquareWarning className="w-3.5 h-3.5" aria-hidden="true" />
      Report a concern
    </>
  );

  const trigger =
    variant === "inline" ? (
      <button
        type="button"
        onClick={openDialog}
        className={`inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-brand-crust)] transition-colors ${className}`}
      >
        {triggerLabel}
      </button>
    ) : (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={openDialog}
        className={className}
      >
        {triggerLabel}
      </Button>
    );

  return (
    <>
      {trigger}
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto rounded-[var(--radius-card)] bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm w-[min(540px,calc(100vw-32px))] p-0"
      >
        {open && (
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
                  Stage 1 concern
                </p>
                <h2 className="text-lg font-black mt-1 leading-tight">
                  Report a concern about {projectTitle}
                </h2>
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
                <p className="font-bold text-[var(--color-ink)]">Concern received.</p>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  We&apos;ll be in touch within 2 business days. Per our policy,
                  the creator has 14 days to respond before a formal dispute can
                  open.
                </p>
                <div className="flex justify-end mt-2">
                  <Button type="button" variant="secondary" size="sm" onClick={closeDialog}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
                {defaultLateMilestone && (
                  <div className="rounded-[var(--radius-btn)] border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    Milestone {defaultLateMilestone} is currently late — we&apos;ve
                    pre-selected it below. Change it if your concern is broader.
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="concern-scope" className="text-xs font-bold text-[var(--color-ink)]">
                    What&apos;s the concern about?
                  </label>
                  <select
                    id="concern-scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value as Scope)}
                    className="h-10 px-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
                  >
                    <option value="whole">Whole campaign</option>
                    <option value="1">Milestone 1</option>
                    <option value="2">Milestone 2</option>
                    <option value="3">Milestone 3</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="concern-message" className="text-xs font-bold text-[var(--color-ink)]">
                    What&apos;s happening?
                  </label>
                  <textarea
                    id="concern-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What did you expect, what's actually happening, when did you first notice? Specifics help us triage faster."
                    rows={6}
                    minLength={MIN_LEN}
                    maxLength={MAX_LEN}
                    required
                    className="px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
                  />
                  <div className="flex items-center justify-between text-xs text-[var(--color-ink-subtle)]">
                    <span>Sent to our team. The creator does not see this directly.</span>
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
                    loading={submitting}
                    disabled={submitting || message.trim().length < MIN_LEN}
                  >
                    File concern
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
