"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, XCircle, Clock, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreatorProfile {
  id: string;
  bio: string;
  linkedin_url: string | null;
  company_name: string | null;
  company_website: string | null;
  project_type: string;
  project_description: string;
  id_document_url: string | null;
  singpass_verified: boolean;
  status: "pending_review" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  email?: string;
}

interface CreatorApprovalListProps {
  creatorProfiles: CreatorProfile[];
  activeTab: "pending_review" | "approved" | "rejected";
}

function AvatarInitial({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
        <Image src={avatarUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[var(--color-brand-crust)] flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function CreatorCard({
  profile,
  onApprove,
  onReject,
}: {
  profile: CreatorProfile;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const displayName = profile.profile?.display_name ?? "Unknown";
  const email = profile.email ?? "";

  async function handleApprove() {
    setLoading("approve");
    await onApprove(profile.id);
    setLoading(null);
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return;
    setLoading("reject");
    await onReject(profile.id, rejectionReason.trim());
    setLoading(null);
    setRejectOpen(false);
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Card header */}
      <div className="p-4 flex items-start gap-3">
        <AvatarInitial name={displayName} avatarUrl={profile.profile?.avatar_url ?? null} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-[var(--color-ink)]">{displayName}</p>
            {profile.status === "pending_review" && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3" /> Pending
              </span>
            )}
            {profile.status === "approved" && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                <CheckCircle className="w-3 h-3" /> Approved
              </span>
            )}
            {profile.status === "rejected" && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                <XCircle className="w-3 h-3" /> Rejected
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{email}</p>
          <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">
            Submitted {new Date(profile.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-3 flex flex-col gap-3">
        {/* Bio */}
        <div>
          <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide mb-1">Bio</p>
          <p className="text-sm text-[var(--color-ink)] line-clamp-3">{profile.bio}</p>
        </div>

        {/* Project type + description */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">Campaign</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-brand-crust)]/10 text-[var(--color-brand-crust)] font-medium">
              {profile.project_type}
            </span>
          </div>
          <p className="text-sm text-[var(--color-ink)] line-clamp-3">{profile.project_description}</p>
        </div>

        {/* Links row */}
        <div className="flex flex-wrap gap-3">
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[var(--color-brand-crust)] hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              LinkedIn
            </a>
          )}
          {profile.company_name && (
            <span className="text-xs text-[var(--color-ink-muted)]">
              {profile.company_name}
              {profile.company_website && (
                <>
                  {" "}
                  <a
                    href={profile.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-brand-crust)] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </>
              )}
            </span>
          )}
        </div>

        {/* ID document + Singpass row */}
        <div className="flex items-center gap-4 flex-wrap">
          {profile.id_document_url ? (
            <a
              href={profile.id_document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--color-brand-crust)] hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              View ID document
            </a>
          ) : (
            <span className="text-xs text-[var(--color-ink-subtle)]">No ID document uploaded</span>
          )}
          <span className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)] bg-[var(--color-border)]/50 px-2 py-0.5 rounded-full">
            🇸🇬 Singpass:{" "}
            <span className={profile.singpass_verified ? "text-green-600" : "text-[var(--color-ink-subtle)]"}>
              {profile.singpass_verified ? "Verified" : "Not verified"}
            </span>
          </span>
        </div>

        {/* Rejection reason (for rejected) */}
        {profile.status === "rejected" && profile.rejection_reason && (
          <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection reason</p>
            <p className="text-xs text-red-600">{profile.rejection_reason}</p>
          </div>
        )}

        {/* Actions (pending only) */}
        {profile.status === "pending_review" && (
          <div className="flex flex-col gap-2 pt-1 border-t border-[var(--color-border)]">
            {!rejectOpen ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  loading={loading === "approve"}
                  disabled={loading !== null}
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={loading !== null}
                  onClick={() => setRejectOpen(true)}
                  className="flex-1 text-red-600 hover:bg-red-50 border border-red-200"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => { setRejectOpen(false); setRejectionReason(""); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    loading={loading === "reject"}
                    disabled={!rejectionReason.trim() || loading !== null}
                    onClick={handleReject}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                  >
                    Confirm rejection
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CreatorApprovalList({ creatorProfiles, activeTab }: CreatorApprovalListProps) {
  const [profiles, setProfiles] = useState(creatorProfiles);

  const filtered = profiles.filter((p) => p.status === activeTab);

  async function handleApprove(id: string) {
    const res = await fetch(`/api/admin/creator/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (res.ok) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "approved" as const } : p))
      );
    }
  }

  async function handleReject(id: string, reason: string) {
    const res = await fetch(`/api/admin/creator/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", rejection_reason: reason }),
    });
    if (res.ok) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "rejected" as const, rejection_reason: reason } : p
        )
      );
    }
  }

  if (filtered.length === 0) {
    const emptyMessages: Record<string, string> = {
      pending_review: "No applications pending review.",
      approved: "No approved applications yet.",
      rejected: "No rejected applications.",
    };
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-ink-muted)] text-sm">{emptyMessages[activeTab]}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {filtered.map((profile) => (
        <CreatorCard
          key={profile.id}
          profile={profile}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}
