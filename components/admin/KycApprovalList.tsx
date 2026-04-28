"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

type KycTab = "pending" | "approved" | "rejected";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  kyc_status: string;
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_rejection_reason: string | null;
  created_at: string;
}

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
}

const TABS: KycTab[] = ["pending", "approved", "rejected"];

const TAB_LABEL: Record<KycTab, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_PILL: Record<KycTab, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const BADGE_VARIANT: Record<KycTab, "amber" | "teal" | "neutral"> = {
  pending: "amber",
  approved: "teal",
  rejected: "neutral",
};

export function KycApprovalList() {
  const [tab, setTab] = useState<KycTab>("pending");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async (status: KycTab) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc?status=${status}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function updateKyc(userId: string, status: "approved" | "rejected") {
    setActionLoading(userId);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ kyc_status: status, kyc_reviewed_at: new Date().toISOString() })
      .eq("id", userId);
    // Optimistically remove from pending list and update badge counts
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    setCounts((prev) => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1),
      [status]: prev[status] + 1,
    }));
    setActionLoading(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)]">
        {TABS.map((t) => {
          const isActive = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-[var(--color-brand-crust)] text-[var(--color-ink)]"
                  : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {TAB_LABEL[t]}
              <span
                className={`ml-2 inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  isActive
                    ? STATUS_PILL[t]
                    : "bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]"
                }`}
              >
                {counts[t]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-ink-muted)]" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-ink-muted)]">
          {tab === "pending" && <p className="text-4xl mb-3">✅</p>}
          <p className="font-semibold">No {TAB_LABEL[tab].toLowerCase()} KYC requests</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand-crust)]/20 flex items-center justify-center font-bold text-[var(--color-brand-crust)] shrink-0">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--color-ink)]">{profile.display_name}</p>
                <p className="text-xs text-[var(--color-ink-subtle)]">
                  Joined {formatDate(profile.created_at)}
                  {profile.kyc_submitted_at &&
                    ` · Submitted ${formatDate(profile.kyc_submitted_at)}`}
                  {profile.kyc_reviewed_at &&
                    ` · Reviewed ${formatDate(profile.kyc_reviewed_at)}`}
                </p>
                {tab === "rejected" && profile.kyc_rejection_reason && (
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 italic">
                    Reason: {profile.kyc_rejection_reason}
                  </p>
                )}
              </div>
              <Badge variant={BADGE_VARIANT[profile.kyc_status as KycTab] ?? ("neutral" as const)}>
                {profile.kyc_status}
              </Badge>
              {tab === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="danger"
                    loading={actionLoading === profile.id}
                    onClick={() => updateKyc(profile.id, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    loading={actionLoading === profile.id}
                    onClick={() => updateKyc(profile.id, "approved")}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
