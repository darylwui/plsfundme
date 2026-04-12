import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditProjectForm } from "@/components/project/EditProjectForm";
import { ResubmitButton } from "@/components/project/ResubmitButton";
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
      `*, rejection_reason, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)`
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

  // Count all non-cancelled pledges for this project (catches authorized/pre-auth too)
  const { count: pledgeCount } = await supabase
    .from("pledges")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id)
    .not("status", "in", "(cancelled,failed)");

  const hasPledges = (pledgeCount ?? 0) > 0;
  const isRejected = project.status === "cancelled";
  const rejectionReason = (raw as any).rejection_reason as string | null;

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

        {/* Rejection banner */}
        {isRejected && (
          <div className="mb-8 rounded-[var(--radius-card)] border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3 border-b border-red-200 dark:border-red-800">
              <XCircle className="w-5 h-5 text-[var(--color-brand-coral)] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 dark:text-red-300">Your campaign was not approved</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                  Address the feedback below, then resubmit. Our team will review again within 1–2 business days.
                </p>
              </div>
            </div>
            {rejectionReason && (
              <div className="px-5 py-4 border-b border-red-200 dark:border-red-800">
                <p className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-1.5">
                  Feedback from reviewer
                </p>
                <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                  {rejectionReason}
                </p>
              </div>
            )}
            <div className="px-5 py-4">
              <ResubmitButton projectId={project.id} />
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--color-ink)] tracking-tight">
            {isRejected ? "Edit & resubmit campaign" : "Edit campaign"}
          </h1>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            {isRejected
              ? "Make your changes below, then hit Resubmit above."
              : "Changes are saved immediately and reflected on your public page."}
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
