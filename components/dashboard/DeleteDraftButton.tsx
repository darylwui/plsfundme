"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteDraftButtonProps {
  projectId: string;
}

type Status = "idle" | "pending" | "error";

const ERROR_MESSAGE = "Couldn't delete draft. Try again or contact support.";

export function DeleteDraftButton({ projectId }: DeleteDraftButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    if (status === "pending") return;

    const confirmed = window.confirm("Delete this draft? This cannot be undone.");
    if (!confirmed) return;

    setStatus("pending");
    try {
      const res = await fetch(`/api/projects/${projectId}/delete`, { method: "POST" });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      router.refresh();
      // status stays "pending" until refresh swaps the dashboard view; don't reset
      // to avoid a flash of the idle button right before unmount.
    } catch {
      setStatus("error");
    }
  }

  const label = status === "pending" ? "Deleting…" : "Delete draft";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "pending"}
        className="text-sm font-semibold text-[var(--color-ink-subtle)] hover:text-[var(--color-ink-muted)] underline underline-offset-2 disabled:no-underline disabled:cursor-not-allowed"
      >
        {label}
      </button>
      {status === "error" && <p className="text-xs text-red-600 dark:text-red-400">{ERROR_MESSAGE}</p>}
    </div>
  );
}
