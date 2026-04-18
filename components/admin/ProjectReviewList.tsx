"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSgd } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { REJECTION_REASONS } from "@/types/admin";

interface ProjectRow {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  funding_goal_sgd: number;
  amount_pledged_sgd?: number;
  backer_count?: number;
  deadline: string;
  created_at: string;
  cover_image_url: string | null;
  status?: string;
  is_featured?: boolean;
  category: { name: string } | null;
  creator: { id: string; display_name: string } | null;
}

interface ProjectReviewListProps {
  pendingProjects: ProjectRow[];
  allProjects: ProjectRow[];
}

const STATUS_VARIANT: Record<string, "violet" | "lime" | "coral" | "neutral" | "amber"> = {
  pending_review: "amber",
  active: "violet",
  funded: "lime",
  failed: "coral",
  cancelled: "neutral",
  removed: "coral",
};

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pending review",
  active: "Live",
  funded: "Funded",
  failed: "Failed",
  cancelled: "Rejected",
  removed: "Removed",
};

export function ProjectReviewList({ pendingProjects, allProjects }: ProjectReviewListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Optimistic featured state: map of project id → is_featured
  const initialFeatured = Object.fromEntries(
    [...pendingProjects, ...allProjects].map((p) => [p.id, p.is_featured ?? false])
  );
  const [featuredMap, setFeaturedMap] = useState<Record<string, boolean>>(initialFeatured);
  const [featureLoading, setFeatureLoading] = useState<string | null>(null);

  async function toggleFeatured(projectId: string) {
    const current = featuredMap[projectId] ?? false;
    setFeaturedMap((prev) => ({ ...prev, [projectId]: !current }));
    setFeatureLoading(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/feature`, { method: "PATCH" });
      if (res.ok) {
        const body = await res.json() as { is_featured: boolean };
        setFeaturedMap((prev) => ({ ...prev, [projectId]: body.is_featured }));
      } else {
        // Revert on failure
        setFeaturedMap((prev) => ({ ...prev, [projectId]: current }));
        alert("Failed to update featured status.");
      }
    } catch {
      setFeaturedMap((prev) => ({ ...prev, [projectId]: current }));
    } finally {
      setFeatureLoading(null);
    }
  }

  // Per-card open state for rejection/removal reason inputs
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReasonCode, setRejectReasonCode] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState("");

  // Merge: pending first, then the rest (all except pending already in allProjects)
  const pendingIds = new Set(pendingProjects.map((p) => p.id));
  const otherProjects = allProjects.filter((p) => !pendingIds.has(p.id));
  const projects = [...pendingProjects, ...otherProjects];

  async function callAction(projectId: string, action: string, reasonCode?: string, message?: string) {
    setLoading(projectId + action);
    const res = await fetch(`/api/admin/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reasonCode, message }),
    });
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({ error: "Unknown error" }));
      alert(body.error ?? "Action failed. Please try again.");
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Permanently delete this project? This cannot be undone.")) return;
    setLoading(projectId + "delete");
    const res = await fetch(`/api/admin/projects/${projectId}`, { method: "DELETE" });
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({ error: "Delete failed." }));
      alert(body.error ?? "Delete failed.");
    }
  }

  async function handleForceDelete(projectId: string, title: string) {
    const first = confirm(
      `FORCE DELETE "${title}"?\n\n` +
        `This will:\n` +
        `  • Cancel every card hold on Stripe\n` +
        `  • Refund every captured pledge to the backer\n` +
        `  • Reverse any processed creator payouts\n` +
        `  • Hard-delete the project and all its pledges/payouts\n\n` +
        `Only use this for test projects or an agreed cancellation. Continue?`
    );
    if (!first) return;
    const confirmText = prompt(
      `Type the project title exactly to confirm:\n\n${title}`
    );
    if (confirmText !== title) {
      if (confirmText !== null) alert("Title did not match. Aborted.");
      return;
    }
    setLoading(projectId + "force-delete");
    const res = await fetch(`/api/admin/projects/${projectId}?force=true`, {
      method: "DELETE",
    });
    setLoading(null);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      const warn = body.stripeErrors?.length
        ? `\n\nSome Stripe reversals failed — check server logs:\n${body.stripeErrors.join("\n")}`
        : "";
      alert(
        `Deleted. Reversed ${body.pledgesReversed ?? 0} pledge(s) and ${body.payoutsReversed ?? 0} payout(s).${warn}`
      );
      router.refresh();
    } else {
      alert(body.error ?? "Force delete failed.");
    }
  }

  if (projects.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-16 text-center">
        <div className="text-4xl mb-3">🚀</div>
        <p className="font-bold text-[var(--color-ink)]">No campaigns yet</p>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Campaigns will appear here once creators submit them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <p className="text-xs text-[var(--color-ink-subtle)]">
        {pendingProjects.length > 0
          ? `${pendingProjects.length} campaign${pendingProjects.length !== 1 ? "s" : ""} waiting for your approval · ${projects.length} total`
          : `${projects.length} campaign${projects.length !== 1 ? "s" : ""} total`}
      </p>

      {projects.map((project) => {
        const isPending = project.status === "pending_review";
        const isActive = project.status === "active";
        const isDeletable = (project.backer_count ?? 0) === 0;
        const isRejectingThis = rejectingId === project.id;
        const isRemovingThis = removingId === project.id;

        return (
          <div
            key={project.id}
            className={`bg-[var(--color-surface)] rounded-[var(--radius-card)] border overflow-hidden ${
              isPending
                ? "border-amber-300 shadow-[0_0_0_3px_rgba(251,191,36,0.15)]"
                : "border-[var(--color-border)]"
            }`}
          >
            {/* Pending banner */}
            {isPending && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 px-5 py-2 flex items-center gap-2">
                <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  ⏳ Awaiting your approval
                </span>
              </div>
            )}

            <div className="p-5 flex flex-col sm:flex-row gap-4">
              {/* Cover thumbnail */}
              <div className="w-full sm:w-24 h-16 rounded-lg bg-[var(--color-surface-overlay)] shrink-0 overflow-hidden">
                {project.cover_image_url ? (
                  <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍞</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--color-ink)]">{project.title}</span>
                      <Badge variant={STATUS_VARIANT[project.status ?? ""] ?? "neutral"}>
                        {STATUS_LABEL[project.status ?? ""] ?? project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">
                      by {project.creator?.display_name ?? "Unknown"} ·{" "}
                      {project.category?.name ?? "Uncategorised"} ·{" "}
                      Submitted {formatDate(project.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/projects/${project.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-crust)] hover:underline shrink-0"
                  >
                    Preview <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {project.short_description && (
                  <p className="text-sm text-[var(--color-ink-muted)] mt-2 line-clamp-2">
                    {project.short_description}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--color-ink-subtle)]">
                  <span>Goal: <strong className="text-[var(--color-ink)]">{formatSgd(project.funding_goal_sgd)}</strong></span>
                  <span>Deadline: <strong className="text-[var(--color-ink)]">{formatDate(project.deadline)}</strong></span>
                  {project.amount_pledged_sgd !== undefined && (
                    <span>Raised: <strong className="text-[var(--color-ink)]">{formatSgd(project.amount_pledged_sgd)}</strong></span>
                  )}
                  {project.backer_count !== undefined && (
                    <span>Backers: <strong className="text-[var(--color-ink)]">{project.backer_count}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Actions ─────────────────────────────────── */}
            <div className="px-5 py-3 bg-[var(--color-surface-raised)] border-t border-[var(--color-border)] flex flex-col gap-3">
              {/* Featured toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={featureLoading === project.id}
                  onClick={() => toggleFeatured(project.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-btn)] text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    featuredMap[project.id]
                      ? "bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-amber-400 hover:text-amber-700"
                  }`}
                >
                  🍞 {featuredMap[project.id] ? "Featured" : "Mark as featured"}
                </button>
              </div>

              {/* APPROVE / REJECT — for pending_review */}
              {isPending && (
                <div className="flex flex-wrap items-start gap-3">
                  <Button
                    size="sm"
                    loading={loading === project.id + "approve"}
                    onClick={() => callAction(project.id, "approve")}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve — go live
                  </Button>

                  {isRejectingThis ? (
                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--color-ink-muted)] uppercase">
                          Rejection category
                        </label>
                        <select
                          autoFocus
                          value={rejectReasonCode}
                          onChange={(e) => setRejectReasonCode(e.target.value)}
                          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-danger)]"
                        >
                          <option value="">Select a reason…</option>
                          {Object.entries(REJECTION_REASONS).map(([key, { code, label }]) => (
                            <option key={code} value={code}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {rejectReasonCode && Object.values(REJECTION_REASONS).find((r) => r.code === rejectReasonCode) && (
                        <div className="rounded-[var(--radius-btn)] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-sm text-amber-800 dark:text-amber-300">
                          <p className="font-semibold mb-1">💡 How to give constructive feedback:</p>
                          <p>
                            {Object.values(REJECTION_REASONS).find((r) => r.code === rejectReasonCode)?.tip}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--color-ink-muted)] uppercase">
                          Message to creator
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Be constructive. Suggest what to improve and how they can resubmit."
                          value={rejectMessage}
                          onChange={(e) => setRejectMessage(e.target.value)}
                          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-danger)] resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          loading={loading === project.id + "reject"}
                          disabled={!rejectReasonCode.trim() || !rejectMessage.trim()}
                          onClick={async () => {
                            await callAction(project.id, "reject", rejectReasonCode, rejectMessage);
                            setRejectingId(null);
                            setRejectReasonCode("");
                            setRejectMessage("");
                          }}
                        >
                          Send rejection
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReasonCode("");
                            setRejectMessage("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setRejectingId(project.id);
                        setRemovingId(null);
                        setRejectReasonCode("");
                        setRejectMessage("");
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject with reason
                    </Button>
                  )}
                </div>
              )}

              {/* REMOVE / DELETE — for live campaigns */}
              {(isActive || (!isPending && project.status !== "cancelled" && project.status !== "removed")) && (
                <div className="flex flex-wrap items-start gap-3">
                  {isRemovingThis ? (
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <textarea
                        autoFocus
                        rows={2}
                        placeholder="Reason for removal (sent to creator by email)…"
                        value={removeReason}
                        onChange={(e) => setRemoveReason(e.target.value)}
                        className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-danger)] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          loading={loading === project.id + "remove"}
                          disabled={!removeReason.trim()}
                          onClick={async () => {
                            await callAction(project.id, "remove", removeReason);
                            setRemovingId(null);
                            setRemoveReason("");
                          }}
                        >
                          Confirm removal
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setRemovingId(null); setRemoveReason(""); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setRemovingId(project.id);
                        setRejectingId(null);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove campaign
                    </Button>
                  )}

                  {isDeletable && !isRemovingThis && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={loading === project.id + "delete"}
                      onClick={() => handleDelete(project.id)}
                      className="text-[var(--color-brand-danger)] hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete permanently
                    </Button>
                  )}

                  {!isDeletable && !isRemovingThis && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={loading === project.id + "force-delete"}
                      onClick={() => handleForceDelete(project.id, project.title)}
                      className="text-[var(--color-brand-danger)] hover:text-red-700 hover:bg-red-50 border border-red-200 border-dashed"
                      title="Refunds every pledge on Stripe and hard-deletes. Use for test projects or agreed cancellations."
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Force delete (refund + wipe)
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
