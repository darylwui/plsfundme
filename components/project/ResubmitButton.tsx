"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResubmitButton({ projectId }: { projectId: string }) {
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

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" loading={loading} onClick={handleResubmit}>
        <Send className="w-4 h-4" />
        Resubmit for review
      </Button>
      {error && <p className="text-xs text-[var(--color-brand-coral)]">{error}</p>}
    </div>
  );
}
