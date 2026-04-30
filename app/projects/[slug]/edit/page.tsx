import { notFound, redirect } from "next/navigation";
import { FileText, XCircle } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { EditProjectForm } from "@/components/project/EditProjectForm";
import { ResubmitButton } from "@/components/project/ResubmitButton";
import type { ProjectWithRelations } from "@/types/project";
import type { Reward } from "@/types/reward";

interface EditProjectPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  const isAdmin = Boolean((viewerProfile as { is_admin?: boolean } | null)?.is_admin);

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

  // Only the creator (or an admin) can edit
  if (project.creator.id !== user.id && !isAdmin) notFound();

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

  // Count all non-terminal pledges for this project (catches authorized/pre-auth too).
  // Note: "cancelled" isn't a valid `pledge_status` enum value in the DB — if
  // it's included here, PostgREST 400s the whole query.
  const { count: pledgeCount } = await supabase
    .from("pledges")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id)
    .not("status", "in", "(failed)");

  const hasPledges = (pledgeCount ?? 0) > 0;
  const isRejected = project.status === "cancelled";
  const isDraft = project.status === "draft";
  const rejectionReason = (raw as any).rejection_reason as string | null;

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back nav */}
        <div className="mb-6">
          <BackLink href={`/projects/${slug}`}>Back to project</BackLink>
        </div>

        {/* Rejection banner */}
        {isRejected && (
          <div className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-brand-danger)]/30 bg-[var(--color-brand-danger)]/10 overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3 border-b border-[var(--color-brand-danger)]/30">
              <XCircle className="w-5 h-5 text-[var(--color-brand-danger)] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--color-ink)]">Your campaign was not approved</p>
                <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                  Address the feedback below, then resubmit. Our team will review again within 1–2 business days.
                </p>
              </div>
            </div>
            {rejectionReason && (
              <div className="px-5 py-4 border-b border-[var(--color-brand-danger)]/30">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-danger)] mb-1.5">
                  Feedback from reviewer
                </p>
                <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                  {rejectionReason}
                </p>
              </div>
            )}
            <div className="px-5 py-4">
              <ResubmitButton projectId={project.id} mode="resubmit" />
            </div>
          </div>
        )}

        {/* Draft banner — happens when admin reverts a campaign back to
            draft (or when one is shelved for relaunch). Without this
            panel a creator has no way to push the campaign forward. */}
        {isDraft && (
          <div className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-brand-crust)]/30 bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/15 overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3 border-b border-[var(--color-brand-crust)]/20">
              <FileText className="w-5 h-5 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
                  This campaign is a draft
                </p>
                <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                  Make any final edits below, then submit for review. Our
                  team gets back to you within 1–2 business days.
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <ResubmitButton projectId={project.id} mode="submit" />
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--color-ink)] tracking-tight">
            {isRejected
              ? "Edit & resubmit campaign"
              : isDraft
                ? "Edit & submit campaign"
                : "Edit campaign"}
          </h1>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            {isRejected
              ? "Make your changes below, then hit Resubmit above."
              : isDraft
                ? "Make your changes below, then hit Submit for review above."
                : "Changes are saved immediately and reflected on your public page."}
          </p>
        </div>

        <EditProjectForm
          project={project}
          categories={categories ?? []}
          rewards={project.rewards as Reward[]}
          pledgeCountByReward={pledgeCountByReward}
          hasPledges={hasPledges}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
