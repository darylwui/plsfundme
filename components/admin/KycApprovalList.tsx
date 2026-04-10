"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/dates";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  kyc_status: string;
  kyc_submitted_at: string | null;
  created_at: string;
}

export function KycApprovalList({ profiles: initial }: { profiles: Profile[] }) {
  const [profiles, setProfiles] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function updateKyc(userId: string, status: "approved" | "rejected") {
    setLoading(userId);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ kyc_status: status, kyc_reviewed_at: new Date().toISOString() })
      .eq("id", userId);
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    setLoading(null);
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-ink-muted)]">
        <p className="text-4xl mb-3">✅</p>
        <p className="font-semibold">No pending KYC requests</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-violet)]/20 flex items-center justify-center font-bold text-[var(--color-brand-violet)] shrink-0">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-ink)]">{profile.display_name}</p>
            <p className="text-xs text-[var(--color-ink-subtle)]">
              Joined {formatDate(profile.created_at)}
              {profile.kyc_submitted_at && ` · Submitted ${formatDate(profile.kyc_submitted_at)}`}
            </p>
          </div>
          <Badge variant={profile.kyc_status === "pending" ? "amber" : "neutral"}>
            {profile.kyc_status}
          </Badge>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="danger"
              loading={loading === profile.id}
              onClick={() => updateKyc(profile.id, "rejected")}
            >
              Reject
            </Button>
            <Button
              size="sm"
              loading={loading === profile.id}
              onClick={() => updateKyc(profile.id, "approved")}
            >
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
