"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Posts to /api/projects/[id]/resubmit, which transitions either a
 * "cancelled" (rejected) or "draft" project into "pending_review".
 *
 * `mode` controls the button label so the creator's intent matches
 * the visible action: a fresh draft is "Submit for review", a
 * previously-rejected campaign is "Resubmit for review".
 */
export function ResubmitButton({
  projectId,
  mode = "resubmit",
}: {
  projectId: string;
  mode?: "submit" | "resubmit";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResubmit() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/resubmit`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard/projects?resubmitted=1");
    } else {
      const body = await res.json().catch(() => ({ error: "Failed" }));
      setError(body.error ?? "Something went wrong.");
    }
  }

  const label = mode === "submit" ? "Submit for review" : "Resubmit for review";

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" loading={loading} onClick={handleResubmit}>
        <Send className="w-4 h-4" />
        {label}
      </Button>
      {error && <p className="text-xs text-[var(--color-brand-danger)]">{error}</p>}
    </div>
  );
}
