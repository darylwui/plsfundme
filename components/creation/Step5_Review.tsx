"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Eye, CalendarDays, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FundingWidget } from "@/components/projects/FundingWidget";
import { formatDate } from "@/lib/utils/dates";
import { formatSgd } from "@/lib/utils/currency";
import { CAMPAIGN_PROSE_CLASSES, processCampaignHtml } from "@/lib/utils/campaignHtml";
import type { ProjectDraft, ProjectWithRelations, Category } from "@/types/project";
import type { RewardFormData, Reward } from "@/types/reward";

// Display-only; the split is enforced in lib/milestones/escrow.ts.
const PAYOUT_PERCENTAGES: [number, number, number] = [40, 40, 20];

interface Step5Props {
  draft: ProjectDraft;
  rewards: RewardFormData[];
  categories: Category[];
  onBack: () => void;
  onSuccess?: () => void;
}

/** Build a fake ProjectWithRelations so we can pass it to real display components. */
function buildPreviewProject(
  draft: ProjectDraft,
  rewards: RewardFormData[],
  category: Category | undefined
): ProjectWithRelations {
  const fakeRewards: Reward[] = rewards.map((r, i) => ({
    id: `preview-${i}`,
    project_id: "preview",
    title: r.title,
    description: r.description,
    minimum_pledge_sgd: r.minimum_pledge_sgd,
    estimated_delivery_date: r.estimated_delivery_date || null,
    max_backers: r.max_backers,
    claimed_count: 0,
    includes_physical_item: r.includes_physical_item,
    image_url: r.image_url,
    is_active: true,
    display_order: i,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return {
    id: "preview",
    creator_id: "preview",
    category_id: draft.category_id,
    title: draft.title || "Your project title",
    slug: "preview",
    short_description: draft.short_description || "Your short description will appear here.",
    full_description: draft.full_description || "",
    cover_image_url: draft.cover_image_url,
    video_url: draft.video_url,
    funding_goal_sgd: draft.funding_goal_sgd || 1000,
    amount_pledged_sgd: 0,
    backer_count: 0,
    payout_mode: draft.payout_mode,
    start_date: draft.start_date,
    deadline: draft.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
    status: "active",
    launched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: category ?? null,
    creator: { id: "preview", display_name: "You", avatar_url: null },
    rewards: fakeRewards,
    stretch_goals: [],
  } as unknown as ProjectWithRelations;
}

export function Step5_Review({ draft, rewards, categories, onBack, onSuccess }: Step5Props) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = categories.find((c) => c.id === draft.category_id);
  const previewProject = buildPreviewProject(draft, rewards, category);
  const creatorReceives = draft.funding_goal_sgd * 0.95;

  // Check submission readiness
  const isReady = {
    title: draft.title && draft.title.length >= 5 && draft.title.length <= 100,
    category: !!draft.category_id,
    shortDescription: draft.short_description && draft.short_description.length >= 20 && draft.short_description.length <= 200,
    fullDescription: draft.full_description && draft.full_description.length >= 50,
    goal: draft.funding_goal_sgd && draft.funding_goal_sgd >= 500 && draft.funding_goal_sgd <= 10_000_000,
    deadline: draft.deadline && new Date(draft.deadline) > new Date(),
    milestones: draft.milestones.every(
      (m) =>
        m.title.trim().length >= 5 &&
        m.description.trim().length >= 20 &&
        !!m.target_date &&
        new Date(m.target_date) > new Date(),
    ),
    rewards: rewards.length > 0 && rewards.every((r) => r.title && r.title.trim().length > 0),
  };

  const allReady = Object.values(isReady).every(Boolean);
  const readyCount = Object.values(isReady).filter(Boolean).length;
  const readyPercent = Math.round((readyCount / Object.keys(isReady).length) * 100);

  async function handleLaunch() {
    setLaunching(true);
    setError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: draft.category_id,
        title: draft.title,
        short_description: draft.short_description,
        full_description: draft.full_description,
        cover_image_url: draft.cover_image_url,
        video_url: draft.video_url,
        funding_goal_sgd: draft.funding_goal_sgd,
        payout_mode: draft.payout_mode,
        start_date: draft.start_date,
        deadline: draft.deadline,
        milestones: draft.milestones,
        rewards,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Failed to create project.");
      setLaunching(false);
      return;
    }

    onSuccess?.();
    router.push(`/dashboard/projects?submitted=1&slug=${json.slug}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-4 h-4 text-[var(--color-brand-crust)]" />
          <h2 className="text-2xl font-black text-[var(--color-ink)]">
            Preview &amp; submit
          </h2>
        </div>
        <p className="text-sm text-[var(--color-ink-muted)]">
          This is exactly how your campaign will appear to backers. Check everything before submitting for review.
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-[var(--color-brand-danger)]">
          {error}
        </div>
      )}

      {/* Campaign preview */}
      <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] overflow-hidden">
        {/* Preview label */}
        <div className="bg-[var(--color-surface-overlay)] border-b border-[var(--color-border)] px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
          </div>
          <span className="text-xs text-[var(--color-ink-subtle)] font-medium mx-auto">
            Campaign preview
          </span>
        </div>

        <div className="bg-[var(--color-surface)]">
          {/* Cover image */}
          {draft.cover_image_url ? (
            <div className="relative w-full aspect-[21/9] bg-[var(--color-surface-overlay)] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.cover_image_url}
                alt={draft.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </div>
          ) : (
            <div className="w-full aspect-[21/9] bg-gradient-to-br from-[var(--color-surface-overlay)] to-[var(--color-surface-raised)] flex items-center justify-center">
              <p className="text-xs text-[var(--color-ink-subtle)]">No cover image</p>
            </div>
          )}

          <div className="p-6 flex flex-col gap-6">
            {/* Title + meta */}
            <div>
              {category && (
                <Badge variant="violet" className="mb-3">
                  {category.name}
                </Badge>
              )}
              <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight leading-tight">
                {draft.title || <span className="text-[var(--color-ink-subtle)]">Your project title</span>}
              </h1>
              <p className="mt-2 text-base text-[var(--color-ink-muted)] leading-relaxed">
                {draft.short_description || <span className="text-[var(--color-ink-subtle)] italic">Short description…</span>}
              </p>

              {/* Creator chip */}
              <div className="mt-4 inline-flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand-crust)]/15 ring-1 ring-[var(--color-border)] flex items-center justify-center font-bold text-[var(--color-brand-crust)] text-sm shrink-0">
                  Y
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">Campaign by</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">You</p>
                </div>
                {draft.deadline && (
                  <>
                    <div className="w-px h-7 bg-[var(--color-border)] mx-1" />
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Ends {formatDate(draft.deadline)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Funding widget */}
            <FundingWidget project={previewProject} />

            {/* Milestones — shown to backers so they know what they're funding. */}
            {draft.milestones.some((m) => m.title.trim().length > 0) && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[var(--color-brand-crust)]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                    Milestones
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {draft.milestones.map((m, i) => {
                    const pct = PAYOUT_PERCENTAGES[i];
                    const payout =
                      draft.funding_goal_sgd > 0
                        ? (creatorReceives * pct) / 100
                        : 0;
                    return (
                      <div
                        key={i}
                        className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 flex flex-col gap-1"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-bold text-[var(--color-ink)]">
                            {m.title || (
                              <span className="text-[var(--color-ink-subtle)] italic font-normal">
                                Milestone {i + 1}
                              </span>
                            )}
                          </p>
                          <p className="text-xs font-semibold text-[var(--color-brand-crust)] shrink-0">
                            {pct}%
                            {payout > 0 && (
                              <span className="text-[var(--color-ink-muted)] font-normal">
                                {" "}
                                · {formatSgd(payout)}
                              </span>
                            )}
                          </p>
                        </div>
                        {m.description && (
                          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                            {m.description}
                          </p>
                        )}
                        {m.target_date && (
                          <p className="text-xs text-[var(--color-ink-subtle)] flex items-center gap-1.5 mt-0.5">
                            <CalendarDays className="w-3 h-3" />
                            Target: {formatDate(m.target_date)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description — runs through the same pipeline as the public page
                (sanitize + faux-heading promotion + prose classes) so this
                preview matches the published view exactly. */}
            {draft.full_description && (
              <div
                className={CAMPAIGN_PROSE_CLASSES}
                dangerouslySetInnerHTML={{
                  __html: processCampaignHtml(draft.full_description).html,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Readiness check */}
      {!allReady && (
        <div className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
            📋 {readyPercent}% ready to submit
          </p>
          <div className="flex flex-col gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            {!isReady.title && <p>• Project title needs work (5–100 characters)</p>}
            {!isReady.category && <p>• Select a category</p>}
            {!isReady.shortDescription && <p>• Short description needs work (20–200 characters)</p>}
            {!isReady.fullDescription && <p>• Campaign story needs work (50+ characters)</p>}
            {!isReady.goal && <p>• Funding goal must be S$500–S$10M</p>}
            {!isReady.deadline && <p>• Deadline must be in the future</p>}
            {!isReady.milestones && <p>• Fill in all 3 milestones with future target dates</p>}
            {!isReady.rewards && <p>• Add at least 1 reward with a title</p>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button
          size="lg"
          loading={launching}
          disabled={!allReady || launching}
          onClick={handleLaunch}
          title={!allReady ? "Complete all required fields to submit" : ""}
        >
          <Rocket className="w-4 h-4" />
          Submit for review
        </Button>
      </div>
    </div>
  );
}
