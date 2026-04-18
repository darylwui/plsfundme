"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ProjectUpdatesFeed } from "@/components/projects/ProjectUpdatesFeed";
import type { ProjectUpdatePost } from "@/types/project";

type FeedbackAuthor = {
  display_name: string;
  avatar_url: string | null;
};

type ProjectFeedback = {
  id: string;
  project_id: string;
  author_id: string;
  parent_id: string | null;
  message: string;
  created_at: string;
  updated_at: string;
  author: FeedbackAuthor | null;
};

interface ProjectEngagementTabsProps {
  projectId: string;
  projectStatus: string;
  creatorId: string;
  creatorDisplayName: string;
  currentUserId: string | null;
  currentUserDisplayName: string | null;
  loginRedirectTo: string;
  updates: ProjectUpdatePost[];
  isBacker: boolean;
  initialFeedback: ProjectFeedback[];
}

export function ProjectEngagementTabs({
  projectId,
  projectStatus,
  creatorId,
  creatorDisplayName,
  currentUserId,
  currentUserDisplayName,
  loginRedirectTo,
  updates,
  isBacker,
  initialFeedback,
}: ProjectEngagementTabsProps) {
  const [activeTab, setActiveTab] = useState<"updates" | "feedback">("updates");
  const [feedback, setFeedback] = useState<ProjectFeedback[]>(initialFeedback);
  const [message, setMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPostFeedback = useMemo(() => {
    return Boolean(currentUserId) && currentUserId !== creatorId && projectStatus === "active";
  }, [currentUserId, creatorId, projectStatus]);

  const canCreatorReply = useMemo(() => {
    return Boolean(currentUserId) && currentUserId === creatorId;
  }, [currentUserId, creatorId]);

  const topLevelFeedback = useMemo(
    () => feedback.filter((item) => item.parent_id === null),
    [feedback]
  );

  const repliesByParent = useMemo(() => {
    const grouped = new Map<string, ProjectFeedback[]>();
    for (const item of feedback) {
      if (!item.parent_id) continue;
      const existing = grouped.get(item.parent_id) ?? [];
      existing.push(item);
      grouped.set(item.parent_id, existing);
    }
    for (const value of grouped.values()) {
      value.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return grouped;
  }, [feedback]);

  async function submitFeedback(e: React.FormEvent, parentId?: string) {
    e.preventDefault();
    const isReply = Boolean(parentId);
    const content = isReply ? (replyMessage[parentId!] ?? "") : message;
    const allowed = isReply ? canCreatorReply : canPostFeedback;
    if (!currentUserId || !allowed || !content.trim()) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("project_feedback")
      .insert({
        project_id: projectId,
        author_id: currentUserId,
        parent_id: parentId ?? null,
        message: content.trim(),
      })
      .select("id, project_id, author_id, parent_id, message, created_at, updated_at")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setFeedback((prev) => [
        {
          ...(data as {
            id: string;
            project_id: string;
            author_id: string;
            parent_id: string | null;
            message: string;
            created_at: string;
            updated_at: string;
          }),
          author: {
            display_name: canCreatorReply
              ? creatorDisplayName
              : (currentUserDisplayName ?? "You"),
            avatar_url: null,
          },
        },
        ...prev,
      ]);
    }
    if (isReply) {
      setReplyMessage((prev) => ({ ...prev, [parentId!]: "" }));
      setOpenReplyId(null);
    } else {
      setMessage("");
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border-2 border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 overflow-hidden">
      <div className="border-b-2 border-amber-200 dark:border-amber-800/60 px-3 pt-3 bg-amber-100/60 dark:bg-amber-900/20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("updates")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-2 border-b-0 transition-colors ${
              activeTab === "updates"
                ? "bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                : "bg-transparent text-amber-700/70 dark:text-amber-400/60 border-transparent hover:text-amber-900 dark:hover:text-amber-200"
            }`}
          >
            Updates ({updates.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("feedback")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-2 border-b-0 transition-colors ${
              activeTab === "feedback"
                ? "bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                : "bg-transparent text-amber-700/70 dark:text-amber-400/60 border-transparent hover:text-amber-900 dark:hover:text-amber-200"
            }`}
          >
            Questions & Feedback ({feedback.length})
          </button>
        </div>
      </div>

      <div className="p-4 bg-amber-50/30 dark:bg-amber-950/10">
        {activeTab === "updates" ? (
          updates.length > 0 ? (
            <ProjectUpdatesFeed updates={updates} isBacker={isBacker} />
          ) : (
            <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-ink-muted)]">
              No campaign updates yet.
            </div>
          )
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-ink)] mb-1 tracking-tight flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[var(--color-brand-crust)]" />
                Questions & feedback
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Ask the creator questions or share feedback to help improve the campaign.
              </p>
            </div>

            {!currentUserId && (
              <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-sm text-[var(--color-ink-muted)]">
                <Link href={`/login?redirectTo=${encodeURIComponent(loginRedirectTo)}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">
                  Log in
                </Link>{" "}
                to post a question or feedback.
              </div>
            )}

            {currentUserId === creatorId && (
              <div className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-700/50 bg-amber-100/50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300">
                This is your campaign. Backers can post questions and feedback here.
              </div>
            )}

            {currentUserId && currentUserId !== creatorId && projectStatus !== "active" && (
              <div className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-700/50 bg-amber-100/50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300">
                Feedback is currently closed for this campaign.
              </div>
            )}

            {canPostFeedback && (
              <form onSubmit={submitFeedback} className="flex flex-col gap-3">
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question, suggest an improvement, or share your feedback..."
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] resize-none"
                />
                {error && <p className="text-xs text-[var(--color-brand-danger)]">{error}</p>}
                <div className="flex justify-end">
                  <Button size="sm" loading={loading} disabled={!message.trim()}>
                    <Send className="w-3.5 h-3.5" />
                    Post feedback
                  </Button>
                </div>
              </form>
            )}

            {topLevelFeedback.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border-2 border-dashed border-amber-300 dark:border-amber-700/60 p-6 text-sm text-amber-700 dark:text-amber-400 text-center">
                No questions or feedback yet. Be the first to contribute.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {topLevelFeedback.map((item) => (
                  <div key={item.id} className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-700/50 bg-white/60 dark:bg-amber-950/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-200/60 dark:bg-amber-800/40 ring-1 ring-amber-300 dark:ring-amber-700 flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0">
                        {(item.author?.display_name ?? "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                            {item.author?.display_name ?? "Community member"}
                          </p>
                          <span className="text-xs text-[var(--color-ink-subtle)] shrink-0">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-ink-muted)] mt-1 whitespace-pre-line">
                          {item.message}
                        </p>

                        {canCreatorReply && (
                          <div className="mt-3">
                            {openReplyId === item.id ? (
                              <form onSubmit={(e) => submitFeedback(e, item.id)} className="flex flex-col gap-2">
                                <textarea
                                  rows={3}
                                  value={replyMessage[item.id] ?? ""}
                                  onChange={(e) => setReplyMessage((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                  placeholder="Reply as creator..."
                                  className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] resize-none"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpenReplyId(null)}>
                                    Cancel
                                  </Button>
                                  <Button size="sm" loading={loading} disabled={!(replyMessage[item.id] ?? "").trim()}>
                                    Reply
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setOpenReplyId(item.id)}
                                className="text-xs font-semibold text-[var(--color-brand-crust)] hover:underline"
                              >
                                Reply as creator
                              </button>
                            )}
                          </div>
                        )}

                        {(repliesByParent.get(item.id) ?? []).length > 0 && (
                          <div className="mt-3 pl-3 border-l-2 border-amber-300 dark:border-amber-700 flex flex-col gap-2">
                            {(repliesByParent.get(item.id) ?? []).map((reply) => (
                              <div key={reply.id} className="rounded-[var(--radius-btn)] bg-amber-100/70 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-semibold text-[var(--color-ink)]">
                                    {reply.author?.display_name ?? "Creator"}
                                    {reply.author_id === creatorId && (
                                      <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--color-brand-crust)]">
                                        Creator
                                      </span>
                                    )}
                                  </p>
                                  <span className="text-[11px] text-[var(--color-ink-subtle)] shrink-0">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-[var(--color-ink-muted)] mt-1 whitespace-pre-line">
                                  {reply.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
