"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSgd } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";

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
  category: { name: string } | null;
  creator: { id: string; display_name: string } | null;
}

interface ProjectReviewListProps {
  pendingProjects: ProjectRow[];
  allProjects: ProjectRow[];
}

type Tab = "pending" | "all";

const STATUS_VARIANT: Record<string, "violet" | "lime" | "coral" | "neutral" | "amber"> = {
  pending_review: "amber",
  active: "violet",
  funded: "lime",
  failed: "coral",
  cancelled: "neutral",
};

export function ProjectReviewList({ pendingProjects, allProjects }: ProjectReviewListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [removeReason, setRemoveReason] = useState("");

  async function callAction(projectId: string, action: string, reason?: string) {
    setLoading(projectId + action);
    const res = await fetch(`/api/admin/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
      alert(error ?? "Action failed. Please try again.");
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
      alert("Delete failed.");
    }
  }

  const projects = tab === "pending" ? pendingProjects : allProjects;

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-1 w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-[var(--radius-btn)] transition-all ${
            tab === "pending"
              ? "bg-[var(--color-brand-violet)] text-white"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          Pending Review
          {pendingProjects.length > 0 && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === "pending" ? "bg-white/20" : "bg-amber-100 text-amber-700"
            }`}>
              {pendingProjects.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-[var(--radius-btn)] transition-all ${
            tab === "all"
              ? "bg-[var(--color-brand-violet)] text-white"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          All Campaigns
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-16 text-center">
          <div className="text-4xl mb-3">{tab === "pending" ? "✅" : "🚀"}</div>
          <p className="font-bold text-[var(--color-ink)]">
            {tab === "pending" ? "No campaigns pending review" : "No campaigns yet"}
          </p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            {tab === "pending" ? "You're all caught up!" : "Campaigns will appear here once created."}
          </p>
        </div>
      )}

      {/* Project cards */}
      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden"
          >
            <div className="p-5 flex flex-col sm:flex-row gap-4">
              {/* Cover thumbnail */}
              <div className="w-full sm:w-24 h-16 rounded-lg bg-[var(--color-surface-overlay)] shrink-0 overflow-hidden">
                {project.cover_image_url ? (
                  <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🚀</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--color-ink)]">{project.title}</span>
                      {project.status && (
                        <Badge variant={STATUS_VARIANT[project.status] ?? "neutral"}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      )}
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
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-violet)] hover:underline shrink-0"
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

            {/* Actions bar */}
            <div className="px-5 py-3 bg-[var(--color-surface-raised)] border-t border-[var(--color-border)] flex flex-wrap items-center gap-2">
              {tab === "pending" ? (
                <>
                  {/* Approve */}
                  <Button
                    size="sm"
                    loading={loading === project.id + "approve"}
                    onClick={() => callAction(project.id, "approve")}
                    className="bg-[var(--color-brand-lime)] text-[#1a2e1a] hover:opacity-90"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </Button>

                  {/* Reject */}
                  {rejectingId === project.id ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        autoFocus
                        placeholder="Reason for rejection…"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="flex-1 min-w-0 rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)]"
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        loading={loading === project.id + "reject"}
                        disabled={!rejectReason.trim()}
                        onClick={async () => {
                          await callAction(project.id, "reject", rejectReason);
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                      >
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setRejectingId(project.id)}>
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Remove for ToS */}
                  {removingId === project.id ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        autoFocus
                        placeholder="ToS violation reason…"
                        value={removeReason}
                        onChange={(e) => setRemoveReason(e.target.value)}
                        className="flex-1 min-w-0 rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)]"
                      />
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
                        Remove
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRemovingId(null); setRemoveReason(""); }}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRemovingId(project.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove (ToS)
                    </Button>
                  )}

                  {/* Hard delete — only if no pledges */}
                  {(project.backer_count ?? 0) === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={loading === project.id + "delete"}
                      onClick={() => handleDelete(project.id)}
                      className="text-[var(--color-brand-coral)] hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete permanently
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
