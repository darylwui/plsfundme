"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle, Megaphone, Send, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { RewardTierCard } from "@/components/projects/RewardTierCard";
import { PostUpdateForm } from "@/components/project/PostUpdateForm";
import { ProjectSectionNav } from "@/components/projects/ProjectSectionNav";
import type { ProjectUpdatePost } from "@/types/project";
import type { Reward } from "@/types/reward";
import { formatDate } from "@/lib/utils/dates";
import type { CampaignHeading } from "@/lib/utils/campaignHtml";

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

interface ProjectPageSectionsProps {
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
  descriptionHtml: string;
  descriptionHeadings: CampaignHeading[];
  rewards: Reward[];
}

export function ProjectPageSections({
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
  descriptionHtml,
  descriptionHeadings,
  rewards,
}: ProjectPageSectionsProps) {
  const [feedback, setFeedback] = useState<ProjectFeedback[]>(initialFeedback);
  const [message, setMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRewards = useMemo(
    () =>
      rewards
        .filter((r) => r.is_active)
        .sort((a, b) => a.minimum_pledge_sgd - b.minimum_pledge_sgd),
    [rewards]
  );

  const selectedReward = useMemo(
    () => activeRewards.find((r) => r.id === selectedRewardId) ?? null,
    [activeRewards, selectedRewardId]
  );

  const faqItems = useMemo(
    () =>
      descriptionHeadings.filter((h) => {
        const lower = h.text.toLowerCase();
        return h.text.includes("?") || lower.startsWith("faq") || lower.includes("question");
      }),
    [descriptionHeadings]
  );

  const canPostFeedback = useMemo(
    () => Boolean(currentUserId) && currentUserId !== creatorId && projectStatus === "active",
    [currentUserId, creatorId, projectStatus]
  );

  const canCreatorReply = useMemo(
    () => Boolean(currentUserId) && currentUserId === creatorId,
    [currentUserId, creatorId]
  );

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
      value.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
    return grouped;
  }, [feedback]);

  const sections = useMemo(
    () => [
      { id: "campaign", label: "Campaign" },
      { id: "rewards", label: `Rewards (${activeRewards.length})` },
      { id: "faq", label: "FAQ" },
      { id: "updates", label: `Updates (${updates.length})` },
      { id: "comments", label: `Comments (${feedback.length})` },
    ],
    [activeRewards.length, updates.length, feedback.length]
  );

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

  const visibleUpdates = updates.filter((u) => !u.is_backers_only || isBacker);
  const lockedCount = updates.filter((u) => u.is_backers_only && !isBacker).length;

  return (
    <>
      {/* ── Sticky section nav ── */}
      <ProjectSectionNav sections={sections} />

      {/* ── Campaign ── */}
      <section id="campaign" className="scroll-mt-32 flex flex-col gap-5">
        <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3">
          Campaign
        </h2>

        {/* Subsection chips — mobile only; desktop shows CampaignToc in the right rail. */}
        {descriptionHeadings.length > 0 && (
          <div className="flex flex-wrap gap-2 lg:hidden">
            {descriptionHeadings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className={
                  h.level === 2
                    ? "text-sm font-semibold rounded-full px-4 py-1.5 border border-[var(--color-brand-crust)]/40 bg-[var(--color-brand-crust)]/10 text-[var(--color-brand-crust)] hover:bg-[var(--color-brand-crust)]/20 hover:border-[var(--color-brand-crust)] transition-colors"
                    : "text-xs font-medium rounded-full px-3 py-1 border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand-crust)]/40 transition-colors"
                }
              >
                {h.text}
              </a>
            ))}
          </div>
        )}

        {descriptionHtml ? (
          <div
            className="prose prose-base max-w-none text-[var(--color-ink)]
              prose-headings:text-[var(--color-ink)] prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-[var(--color-border)] prose-h2:pb-2
              prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-[var(--color-ink-muted)]
              prose-p:text-[var(--color-ink-muted)] prose-p:leading-relaxed
              prose-a:text-[var(--color-brand-crust)] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[var(--color-ink)] prose-strong:font-semibold
              prose-ul:text-[var(--color-ink-muted)] prose-li:my-1
              prose-img:rounded-[var(--radius-card)] prose-img:border prose-img:border-[var(--color-border)]
              prose-blockquote:border-l-[var(--color-brand-crust)] prose-blockquote:text-[var(--color-ink-muted)]"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        ) : (
          <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-ink-muted)]">
            No campaign description yet.
          </div>
        )}
      </section>

      {/* ── Rewards ── */}
      <section id="rewards" className="scroll-mt-32 flex flex-col gap-5">
        <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3">
          Rewards
        </h2>

        {activeRewards.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-ink-muted)]">
            No rewards published yet.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-[var(--color-ink-muted)]">
                Select a reward tier to continue backing.
              </p>
              <Link
                href={`/backing/${projectId}/checkout${selectedReward ? `?reward=${selectedReward.id}` : ""}`}
              >
                <Button size="sm">
                  {selectedReward ? `Back with ${selectedReward.title}` : "Back this project"}
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeRewards.map((reward) => (
                <RewardTierCard
                  key={reward.id}
                  reward={reward}
                  selected={selectedReward?.id === reward.id}
                  onSelect={
                    projectStatus === "active"
                      ? () =>
                          setSelectedRewardId(
                            reward.id === selectedRewardId ? null : reward.id
                          )
                      : undefined
                  }
                  disabled={projectStatus !== "active"}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-32 flex flex-col gap-5">
        <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3">
          FAQ
        </h2>

        {faqItems.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 text-sm text-[var(--color-ink-muted)]">
            No FAQ entries yet. Creators can add question-style headings (ending in "?") in the
            campaign body — they'll automatically appear here.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {faqItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4 text-sm text-[var(--color-ink)] hover:border-[var(--color-brand-crust)]/60 hover:bg-[var(--color-surface-overlay)] transition-colors"
              >
                <span className="font-medium">{item.text}</span>
                <span className="text-[var(--color-brand-crust)] text-xs font-semibold shrink-0 group-hover:underline">
                  See answer →
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ── Updates ── */}
      <section id="updates" className="scroll-mt-32 flex flex-col gap-5">
        <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[var(--color-brand-crust)]" />
          Updates
          <span className="font-mono text-sm font-semibold text-[var(--color-ink-muted)]">
            ({updates.length})
          </span>
        </h2>

        {currentUserId === creatorId && projectStatus === "active" && (
          <PostUpdateForm projectId={projectId} creatorId={creatorId} />
        )}

        {visibleUpdates.length === 0 && lockedCount === 0 ? (
          <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-ink-muted)]">
            No campaign updates yet.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {visibleUpdates.map((update) => (
              <article key={update.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-[var(--color-ink)]">{update.title}</h3>
                    {update.is_backers_only && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-crust)] bg-[var(--color-brand-crust)]/10 px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        Backers only
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-[var(--color-ink-subtle)] shrink-0">
                    {formatDate(update.created_at)}
                  </time>
                </div>
                <p className="text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-line">
                  {update.body}
                </p>
                <div className="h-px bg-[var(--color-border)]" />
              </article>
            ))}

            {lockedCount > 0 && (
              <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-5 flex items-center gap-3 text-[var(--color-ink-muted)]">
                <Lock className="w-4 h-4 shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold text-[var(--color-ink)]">
                    {lockedCount} backer-only update{lockedCount !== 1 ? "s" : ""}
                  </span>{" "}
                  — back this project to unlock them.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Comments ── */}
      <section id="comments" className="scroll-mt-32 flex flex-col gap-5">
        <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[var(--color-brand-crust)]" />
          Questions &amp; feedback
          <span className="font-mono text-sm font-semibold text-[var(--color-ink-muted)]">
            ({feedback.length})
          </span>
        </h2>

        <p className="text-sm text-[var(--color-ink-muted)]">
          Ask the creator questions or share feedback to help improve the campaign.
        </p>

        {/* Auth / status notices */}
        {!currentUserId && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-sm text-[var(--color-ink-muted)]">
            <Link
              href={`/login?redirectTo=${encodeURIComponent(loginRedirectTo)}`}
              className="font-semibold text-[var(--color-brand-crust)] hover:underline"
            >
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

        {/* Post feedback form */}
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

        {/* Thread list */}
        {topLevelFeedback.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border-2 border-dashed border-amber-300 dark:border-amber-700/60 p-6 text-sm text-amber-700 dark:text-amber-400 text-center">
            No questions or feedback yet. Be the first to contribute.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {topLevelFeedback.map((item) => (
              <div
                key={item.id}
                className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-700/50 bg-white/60 dark:bg-amber-950/30 p-5"
              >
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
                    <p className="text-sm text-[var(--color-ink-muted)] mt-1 whitespace-pre-line leading-relaxed">
                      {item.message}
                    </p>

                    {/* Creator reply form */}
                    {canCreatorReply && (
                      <div className="mt-3">
                        {openReplyId === item.id ? (
                          <form
                            onSubmit={(e) => submitFeedback(e, item.id)}
                            className="flex flex-col gap-2"
                          >
                            <textarea
                              rows={3}
                              value={replyMessage[item.id] ?? ""}
                              onChange={(e) =>
                                setReplyMessage((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              placeholder="Reply as creator..."
                              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] resize-none"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenReplyId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                loading={loading}
                                disabled={!(replyMessage[item.id] ?? "").trim()}
                              >
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

                    {/* Existing replies */}
                    {(repliesByParent.get(item.id) ?? []).length > 0 && (
                      <div className="mt-3 pl-3 border-l-2 border-amber-300 dark:border-amber-700 flex flex-col gap-2">
                        {(repliesByParent.get(item.id) ?? []).map((reply) => (
                          <div
                            key={reply.id}
                            className="rounded-[var(--radius-btn)] bg-amber-100/70 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                                {reply.author?.display_name ?? "Creator"}
                                {reply.author_id === creatorId && (
                                  <span className="text-[10px] uppercase tracking-wide text-[var(--color-brand-crust)] font-bold">
                                    · Creator
                                  </span>
                                )}
                              </p>
                              <span className="text-[11px] text-[var(--color-ink-subtle)] shrink-0">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--color-ink-muted)] mt-1 whitespace-pre-line leading-relaxed">
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
      </section>
    </>
  );
}
