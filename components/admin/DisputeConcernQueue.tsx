"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConcernRow {
  id: string;
  pledge_id: string;
  milestone_number: number | null;
  message: string;
  status: "open" | "responded" | "dismissed" | "escalated";
  admin_notes: string | null;
  created_at: string;
  project: { id: string; title: string; slug: string } | null;
  backer: { id: string; display_name: string } | null;
}

const STATUS_OPTIONS: { value: ConcernRow["status"]; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "responded", label: "Responded" },
  { value: "dismissed", label: "Dismissed" },
  { value: "escalated", label: "Escalated" },
];

const STATUS_PILL: Record<ConcernRow["status"], string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  responded: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  dismissed: "bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]",
  escalated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function DisputeConcernQueue({ items }: { items: ConcernRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((c) => (
        <ConcernCard key={c.id} item={c} />
      ))}
    </div>
  );
}

function ConcernCard({ item }: { item: ConcernRow }) {
  const router = useRouter();
  const [status, setStatus] = useState<ConcernRow["status"]>(item.status);
  const [notes, setNotes] = useState(item.admin_notes ?? "");
  const [saving, setSaving] = useState<"status" | "notes" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: Partial<{ status: string; admin_notes: string | null }>) {
    setError(null);
    const res = await fetch(`/api/admin/dispute-concerns/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error?: string; success?: boolean };
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? "Update failed.");
    }
  }

  async function onStatusChange(next: ConcernRow["status"]) {
    const previous = status;
    setStatus(next);
    setSaving("status");
    try {
      await patch({ status: next });
      router.refresh();
    } catch (err) {
      setStatus(previous);
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(null);
    }
  }

  async function onNotesSave() {
    setSaving("notes");
    try {
      await patch({ admin_notes: notes.trim() === "" ? null : notes });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(null);
    }
  }

  const milestoneLabel = item.milestone_number ? `Milestone ${item.milestone_number}` : "Whole campaign";
  const filed = new Date(item.created_at).toLocaleString("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
      <header className="flex items-start justify-between gap-4 px-5 py-3 border-b border-[var(--color-border)]">
        <div className="min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {item.project ? (
              <Link
                href={`/projects/${item.project.slug}`}
                target="_blank"
                className="font-bold text-[var(--color-ink)] hover:text-[var(--color-brand-crust)] inline-flex items-center gap-1 truncate"
              >
                {item.project.title}
                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
              </Link>
            ) : (
              <span className="font-bold text-[var(--color-ink-muted)]">(deleted project)</span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_PILL[status]}`}>
              {status}
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            {milestoneLabel} · {item.backer?.display_name ?? "Unknown backer"} · filed {filed}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={status}
            disabled={saving === "status"}
            onChange={(e) => onStatusChange(e.target.value as ConcernRow["status"])}
            className="h-8 text-xs px-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {saving === "status" && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-ink-muted)]" />}
        </div>
      </header>

      <div className="px-5 py-4 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
            Message
          </p>
          <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
            {item.message}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
            Admin notes
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes — backer doesn't see this."
            rows={2}
            maxLength={5000}
            className="w-full px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
          />
          <div className="flex justify-end mt-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={saving === "notes"}
              disabled={saving === "notes" || (notes ?? "") === (item.admin_notes ?? "")}
              onClick={onNotesSave}
            >
              <Save className="w-3.5 h-3.5" /> Save notes
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-[var(--color-brand-danger)]">{error}</p>
        )}
      </div>
    </article>
  );
}
