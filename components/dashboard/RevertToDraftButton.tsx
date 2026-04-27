"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

interface RevertToDraftButtonProps {
  projectId: string;
  projectTitle: string;
}

/**
 * Admin-only convenience button on the creator's own /dashboard/projects
 * page. Calls the same PATCH /api/admin/projects/[id] endpoint as the
 * full admin UI — the API enforces both the admin guard and the
 * pledge-money safety check, so this component just trusts those.
 *
 * Hidden by default for non-admin users (the parent page only renders
 * this when isAdmin is true).
 */
export function RevertToDraftButton({
  projectId,
  projectTitle,
}: RevertToDraftButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (
      !confirm(
        `Revert "${projectTitle}" to draft?\n\n` +
          `It will be hidden from /explore and editable again. Pledges holding money will block this — refund or release first.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revert_to_draft" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const body = await res
          .json()
          .catch(() => ({ error: "Action failed. Please try again." }));
        alert(body.error ?? "Action failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Admin: un-publish this campaign and send it back to draft"
    >
      <RotateCcw className="w-3 h-3" />
      {loading ? "Reverting…" : "Revert to draft"}
    </button>
  );
}
