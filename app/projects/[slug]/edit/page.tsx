import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditProjectForm } from "@/components/project/EditProjectForm";
import type { ProjectWithRelations } from "@/types/project";
import type { Reward } from "@/types/reward";

interface EditProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch project with relations
  const { data: raw } = await supabase
    .from("projects")
    .select(
      `*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)`
    )
    .eq("slug", slug)
    .single();

  if (!raw) notFound();

  const project = raw as unknown as ProjectWithRelations;

  // Only the creator can edit
  if (project.creator.id !== user.id) notFound();

  // Fetch categories for the dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Fetch pledge counts per reward so we know which rewards are locked
  const rewardIds = project.rewards.map((r) => r.id);
  let pledgeCountByReward: Record<string, number> = {};
  if (rewardIds.length > 0) {
    const { data: pledgeCounts } = await supabase
      .from("pledges")
      .select("reward_id")
      .in("reward_id", rewardIds)
      .in("status", ["authorized", "paynow_captured", "captured"]);

    (pledgeCounts ?? []).forEach((p) => {
      if (p.reward_id) {
        pledgeCountByReward[p.reward_id] =
          (pledgeCountByReward[p.reward_id] ?? 0) + 1;
      }
    });
  }

  const hasPledges = (project.amount_pledged_sgd ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back nav */}
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to project
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--color-ink)] tracking-tight">
            Edit campaign
          </h1>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            Changes are saved immediately and reflected on your public page.
          </p>
        </div>

        <EditProjectForm
          project={project}
          categories={categories ?? []}
          rewards={project.rewards as Reward[]}
          pledgeCountByReward={pledgeCountByReward}
          hasPledges={hasPledges}
        />
      </div>
    </div>
  );
}
