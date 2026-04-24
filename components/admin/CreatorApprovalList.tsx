"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageCircleQuestion,
  ExternalLink,
  FileText,
  X,
  Send,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type CreatorStatus = "pending_review" | "approved" | "rejected" | "needs_info";

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
  status: CreatorStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  info_requested_at: string | null;
  last_contacted_at: string | null;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  email?: string;
}

interface ReviewNote {
  id: string;
  author_id: string;
  author_role: "admin" | "creator";
  visibility: "internal" | "shared";
  body: string;
  created_at: string;
  author: { display_name: string; avatar_url: string | null } | null;
}

interface CreatorApprovalListProps {
  creatorProfiles: CreatorProfile[];
  activeTab: CreatorStatus;
}

const STATUS_META: Record<
  CreatorStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending_review: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: Clock,
  },
  needs_info: {
    label: "Needs info",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    Icon: MessageCircleQuestion,
  },
  approved: {
    label: "Approved",
    className: "bg-green-50 text-green-700 border-green-200",
    Icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    Icon: XCircle,
  },
};

function AvatarInitial({ name, avatarUrl, size = 40 }: { name: string; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <div
        className="relative rounded-full overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        <Image src={avatarUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className="rounded-full bg-[var(--color-brand-crust)] flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function StatusPill({ status }: { status: CreatorStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.className}`}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Card (list view) ─────────────────────────────────────────────────────────

function CreatorCard({
  profile,
  onOpen,
}: {
  profile: CreatorProfile;
  onOpen: (id: string) => void;
}) {
  const displayName = profile.profile?.display_name ?? "Unknown";
  const email = profile.email ?? "";

  return (
    <button
      type="button"
      onClick={() => onOpen(profile.id)}
      className="text-left w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-brand-crust)] hover:shadow-sm transition-all"
    >
      <div className="p-4 flex items-start gap-3">
        <AvatarInitial name={displayName} avatarUrl={profile.profile?.avatar_url ?? null} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-[var(--color-ink)]">{displayName}</p>
            <StatusPill status={profile.status} />
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 truncate">{email}</p>
          <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">
            Submitted {fmtDate(profile.submitted_at)}
            {profile.info_requested_at && profile.status === "needs_info" && (
              <> · info requested {fmtDate(profile.info_requested_at)}</>
            )}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-3">
        <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide mb-1">
          Campaign
        </p>
        <p className="text-sm text-[var(--color-ink)] line-clamp-2">
          {profile.project_description}
        </p>
      </div>
    </button>
  );
}

// ── Drawer ───────────────────────────────────────────────────────────────────

function Drawer({
  profile,
  onClose,
  onUpdate,
}: {
  profile: CreatorProfile;
  onClose: () => void;
  onUpdate: (p: Partial<CreatorProfile> & { id: string }) => void;
}) {
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [composerBody, setComposerBody] = useState("");
  const [composerVisibility, setComposerVisibility] = useState<"internal" | "shared">("shared");
  const [composerLoading, setComposerLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<null | "approve" | "reject" | "request_info">(
    null
  );
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [infoQuestion, setInfoQuestion] = useState("");
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const displayName = profile.profile?.display_name ?? "Unknown";

  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    const res = await fetch(`/api/admin/creator/${profile.id}/notes`);
    if (res.ok) {
      const { notes } = await res.json();
      setNotes(notes);
    }
    setNotesLoading(false);
  }, [profile.id]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function postNote() {
    if (!composerBody.trim()) return;
    setComposerLoading(true);
    const res = await fetch(`/api/admin/creator/${profile.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: composerBody.trim(), visibility: composerVisibility }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [...prev, note]);
      setComposerBody("");
      if (composerVisibility === "shared") {
        onUpdate({ id: profile.id, last_contacted_at: new Date().toISOString() });
        setToast({ kind: "success", message: "Message sent to creator — they'll get an email." });
      } else {
        setToast({ kind: "success", message: "Internal note saved." });
      }
    } else {
      const { error } = await res.json().catch(() => ({ error: "Failed to post message" }));
      setToast({ kind: "error", message: error ?? "Failed to post message" });
    }
    setComposerLoading(false);
  }

  async function decide(
    action: "approve" | "reject" | "request_info",
    extra?: Record<string, string>
  ) {
    setDecisionLoading(action);
    const res = await fetch(`/api/admin/creator/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) {
      const now = new Date().toISOString();
      if (action === "approve") {
        onUpdate({ id: profile.id, status: "approved" });
        setToast({ kind: "success", message: `Approved ${displayName}. They've been emailed.` });
      } else if (action === "reject") {
        onUpdate({
          id: profile.id,
          status: "rejected",
          rejection_reason: extra?.rejection_reason ?? null,
        });
        setToast({ kind: "success", message: `Rejected ${displayName}. They've been emailed with the reason.` });
      } else if (action === "request_info") {
        onUpdate({
          id: profile.id,
          status: "needs_info",
          info_requested_at: now,
          last_contacted_at: now,
        });
        // Reflect the new shared note in the timeline immediately
        await loadNotes();
        setRequestInfoOpen(false);
        setInfoQuestion("");
        setToast({ kind: "success", message: `Info requested from ${displayName}. They've been emailed.` });
      }
    } else {
      const { error } = await res.json().catch(() => ({ error: "Action failed" }));
      setToast({ kind: "error", message: error ?? "Action failed" });
    }
    setDecisionLoading(null);
    setRejectOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-black/40"
      />
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] max-w-sm rounded-[var(--radius-btn)] border px-4 py-3 shadow-lg text-sm font-medium animate-in slide-in-from-top-2 ${
            toast.kind === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}
      <aside className="w-full max-w-xl bg-[var(--color-surface)] h-full overflow-y-auto border-l border-[var(--color-border)] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="flex items-start gap-3 min-w-0">
            <AvatarInitial
              name={displayName}
              avatarUrl={profile.profile?.avatar_url ?? null}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-[var(--color-ink)] truncate">{displayName}</p>
                <StatusPill status={profile.status} />
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] truncate">{profile.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--color-border)] text-[var(--color-ink-muted)]"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Application details */}
        <div className="px-5 py-4 flex flex-col gap-4 border-b border-[var(--color-border)]">
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide mb-1">
              Bio
            </p>
            <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{profile.bio}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
                Campaign
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-brand-crust)]/10 text-[var(--color-brand-crust)] font-medium">
                {profile.project_type}
              </span>
            </div>
            <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">
              {profile.project_description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[var(--color-brand-crust)] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                LinkedIn
              </a>
            )}
            {profile.company_name && (
              <span className="text-[var(--color-ink-muted)]">
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
            {profile.id_document_url ? (
              <a
                href={profile.id_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[var(--color-brand-crust)] hover:underline"
              >
                <FileText className="w-3 h-3" />
                ID document
              </a>
            ) : (
              <span className="text-[var(--color-ink-subtle)]">No ID doc</span>
            )}
            <span className="text-[var(--color-ink-muted)]">
              Singpass:{" "}
              <span
                className={
                  profile.singpass_verified ? "text-green-600" : "text-[var(--color-ink-subtle)]"
                }
              >
                {profile.singpass_verified ? "Verified" : "Not verified"}
              </span>
            </span>
          </div>

          {profile.status === "rejected" && profile.rejection_reason && (
            <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection reason</p>
              <p className="text-xs text-red-600 whitespace-pre-wrap">
                {profile.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="px-5 py-4 flex-1 flex flex-col gap-3">
          <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
            Thread
          </p>
          {notesLoading ? (
            <p className="text-sm text-[var(--color-ink-subtle)]">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-subtle)]">
              No messages yet. Post a shared message to start the conversation, or leave an
              internal note for other reviewers.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-[var(--radius-btn)] border px-3 py-2 ${
                    n.visibility === "internal"
                      ? "bg-amber-50/60 border-amber-200"
                      : n.author_role === "creator"
                        ? "bg-[var(--color-surface-overlay)] border-[var(--color-border)]"
                        : "bg-blue-50/60 border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <AvatarInitial
                      size={20}
                      name={n.author?.display_name ?? "?"}
                      avatarUrl={n.author?.avatar_url ?? null}
                    />
                    <span className="text-xs font-semibold text-[var(--color-ink)]">
                      {n.author?.display_name ?? "Unknown"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-subtle)]">
                      {n.author_role}
                    </span>
                    {n.visibility === "internal" && (
                      <span className="text-[10px] flex items-center gap-1 text-amber-700">
                        <Lock className="w-3 h-3" /> internal
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--color-ink-subtle)] ml-auto">
                      {fmtDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}

          {/* Composer */}
          <div className="border border-[var(--color-border)] rounded-[var(--radius-btn)] p-3 flex flex-col gap-2">
            <textarea
              rows={3}
              placeholder={
                composerVisibility === "internal"
                  ? "Internal note — only other admins can see this."
                  : "Shared message — the creator will see this and get an email."
              }
              value={composerBody}
              onChange={(e) => setComposerBody(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none resize-none"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-full border border-[var(--color-border)] p-0.5 text-xs">
                {(["shared", "internal"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setComposerVisibility(v)}
                    className={`px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      composerVisibility === v
                        ? v === "internal"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                        : "text-[var(--color-ink-muted)]"
                    }`}
                  >
                    {v === "internal" ? "Internal" : "Shared"}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                loading={composerLoading}
                disabled={!composerBody.trim() || composerLoading}
                onClick={postNote}
                className="ml-auto"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </Button>
            </div>
          </div>
        </div>

        {/* Decision bar */}
        <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-5 py-3 flex flex-col gap-2">
          {!rejectOpen && !requestInfoOpen && (
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                loading={decisionLoading === "approve"}
                disabled={decisionLoading !== null || profile.status === "approved"}
                onClick={() => decide("approve")}
                className="bg-green-600 hover:bg-green-700 text-white border-0"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={decisionLoading !== null}
                onClick={() => setRequestInfoOpen(true)}
              >
                <MessageCircleQuestion className="w-3.5 h-3.5" /> Request info
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={decisionLoading !== null || profile.status === "rejected"}
                onClick={() => setRejectOpen(true)}
                className="text-red-600 hover:bg-red-50 border border-red-200"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          )}

          {rejectOpen && (
            <div className="flex flex-col gap-2">
              {profile.status === "approved" && (
                <div className="rounded-[var(--radius-btn)] bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  <p className="font-semibold mb-0.5">Heads up — this creator is already approved</p>
                  <p className="leading-relaxed">
                    Rejecting them will move them back in the creator stages and prevent
                    them from creating new campaigns. Please share a clear reason below —
                    it&apos;s included in the email they receive.
                  </p>
                </div>
              )}
              <textarea
                rows={3}
                placeholder={
                  profile.status === "approved"
                    ? "Why are you reversing this approval? The creator will see this…"
                    : "Reason for rejection (creator will see this)…"
                }
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-[var(--radius-btn)] border border-red-200 bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRejectOpen(false);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  loading={decisionLoading === "reject"}
                  disabled={!rejectReason.trim() || decisionLoading !== null}
                  onClick={() => decide("reject", { rejection_reason: rejectReason.trim() })}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  Confirm rejection
                </Button>
              </div>
            </div>
          )}

          {requestInfoOpen && (
            <div className="flex flex-col gap-2">
              <textarea
                rows={3}
                placeholder="What do you need to know from them? This goes out by email and is posted in the thread."
                value={infoQuestion}
                onChange={(e) => setInfoQuestion(e.target.value)}
                className="w-full rounded-[var(--radius-btn)] border border-blue-200 bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRequestInfoOpen(false);
                    setInfoQuestion("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  loading={decisionLoading === "request_info"}
                  disabled={!infoQuestion.trim() || decisionLoading !== null}
                  onClick={() => decide("request_info", { question: infoQuestion.trim() })}
                  className="flex-1"
                >
                  Send & move to Needs info
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ── List ─────────────────────────────────────────────────────────────────────

export function CreatorApprovalList({ creatorProfiles, activeTab }: CreatorApprovalListProps) {
  const [profiles, setProfiles] = useState(creatorProfiles);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = profiles.filter((p) => p.status === activeTab);
  const openProfile = profiles.find((p) => p.id === openId) ?? null;

  function handleUpdate(update: Partial<CreatorProfile> & { id: string }) {
    setProfiles((prev) => prev.map((p) => (p.id === update.id ? { ...p, ...update } : p)));
  }

  if (filtered.length === 0) {
    const emptyMessages: Record<CreatorStatus, string> = {
      pending_review: "No applications pending review.",
      needs_info: "No applications waiting on info.",
      approved: "No approved applications yet.",
      rejected: "No rejected applications.",
    };
    return (
      <>
        <div className="text-center py-12">
          <p className="text-[var(--color-ink-muted)] text-sm">{emptyMessages[activeTab]}</p>
        </div>
        {openProfile && (
          <Drawer
            profile={openProfile}
            onClose={() => setOpenId(null)}
            onUpdate={handleUpdate}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((profile) => (
          <CreatorCard key={profile.id} profile={profile} onOpen={setOpenId} />
        ))}
      </div>
      {openProfile && (
        <Drawer profile={openProfile} onClose={() => setOpenId(null)} onUpdate={handleUpdate} />
      )}
    </>
  );
}
