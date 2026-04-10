"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSgd } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { createClient } from "@/lib/supabase/client";
import { slugifyUnique } from "@/lib/utils/slugify";
import type { ProjectDraft } from "@/types/project";
import type { RewardFormData } from "@/types/reward";
import type { Category } from "@/types/project";

interface Step4Props {
  draft: ProjectDraft;
  rewards: RewardFormData[];
  categories: Category[];
  onBack: () => void;
}

export function Step4_Review({ draft, rewards, categories, onBack }: Step4Props) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = categories.find((c) => c.id === draft.category_id);

  async function handleLaunch() {
    setLaunching(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to launch a project.");
      setLaunching(false);
      return;
    }

    const slug = slugifyUnique(draft.title);

    // Insert project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        creator_id: user.id,
        category_id: draft.category_id,
        title: draft.title,
        slug,
        short_description: draft.short_description,
        full_description: draft.full_description,
        cover_image_url: draft.cover_image_url,
        video_url: draft.video_url,
        funding_goal_sgd: draft.funding_goal_sgd,
        payout_mode: draft.payout_mode,
        start_date: draft.start_date,
        deadline: draft.deadline,
        status: "active",
        launched_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (projectError || !project) {
      setError(projectError?.message ?? "Failed to create project.");
      setLaunching(false);
      return;
    }

    // Insert rewards
    if (rewards.length > 0) {
      const rewardRows = rewards.map((r, i) => ({
        project_id: project.id,
        title: r.title,
        description: r.description,
        minimum_pledge_sgd: r.minimum_pledge_sgd,
        estimated_delivery_date: r.estimated_delivery_date || null,
        max_backers: r.max_backers,
        includes_physical_item: r.includes_physical_item,
        display_order: i,
      }));

      const { error: rewardError } = await supabase
        .from("rewards")
        .insert(rewardRows);

      if (rewardError) {
        setError("Project created, but some rewards failed to save. Check your dashboard.");
      }
    }

    router.push(`/projects/${slug}?launched=1`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-ink)]">
          Review &amp; launch 🚀
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Double-check everything before going live. You can edit your project
          after launch from your dashboard.
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="flex flex-col gap-4">
        <SummaryBlock title="Project basics">
          <Row label="Title" value={draft.title} />
          <Row label="Category" value={category?.name ?? "—"} />
          <Row label="Summary" value={draft.short_description} />
        </SummaryBlock>

        <SummaryBlock title="Funding">
          <Row label="Goal" value={formatSgd(draft.funding_goal_sgd)} />
          <Row
            label="Deadline"
            value={draft.deadline ? formatDate(draft.deadline) : "—"}
          />
          <Row label="Payout" value={draft.payout_mode === "automatic" ? "Automatic" : "Manual"} />
        </SummaryBlock>

        <SummaryBlock title={`Reward tiers (${rewards.length})`}>
          {rewards.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-subtle)]">
              No reward tiers — backers can pledge any amount.
            </p>
          ) : (
            rewards.map((r, i) => (
              <Row
                key={i}
                label={formatSgd(r.minimum_pledge_sgd) + "+"}
                value={r.title}
              />
            ))
          )}
        </SummaryBlock>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" loading={launching} onClick={handleLaunch}>
          <Rocket className="w-4 h-4" />
          Launch campaign
        </Button>
      </div>
    </div>
  );
}

function SummaryBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-overlay)]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-muted)]">
          {title}
        </h3>
      </div>
      <div className="p-5 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-[var(--color-ink-subtle)] w-28 shrink-0">{label}</span>
      <span className="text-[var(--color-ink)] font-medium">{value}</span>
    </div>
  );
}
