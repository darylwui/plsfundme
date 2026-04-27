import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CheckoutWrapper } from "@/components/backing/CheckoutWrapper";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import type { ProjectWithRelations } from "@/types/project";

interface CheckoutPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ reward?: string; amount?: string }>;
}

export const metadata = { title: "Checkout" };

/**
 * Why a reward might no longer be selectable, mapped to copy.
 * Returned from `rewardUnavailableReason` and consumed by the
 * inline error UI below.
 */
type RewardUnavailable =
  | { kind: "sold_out"; rewardTitle: string }
  | { kind: "inactive"; rewardTitle: string };

function rewardUnavailableReason(
  reward: ProjectWithRelations["rewards"][number] | null,
): RewardUnavailable | null {
  if (!reward) return null;
  if (!reward.is_active) {
    return { kind: "inactive", rewardTitle: reward.title };
  }
  if (
    reward.max_backers !== null &&
    reward.claimed_count >= reward.max_backers
  ) {
    return { kind: "sold_out", rewardTitle: reward.title };
  }
  return null;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { projectId } = await params;
  const { reward: rewardId, amount: amountParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/backing/${projectId}/checkout`);

  // Fetch project with rewards
  const { data: project } = await supabase
    .from("projects")
    .select(
      `*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)`
    )
    .eq("id", projectId)
    .eq("status", "active")
    .single();

  if (!project) notFound();

  const typedProject = project as unknown as ProjectWithRelations;
  const selectedReward = rewardId
    ? (typedProject.rewards.find((r) => r.id === rewardId) ?? null)
    : null;

  // Catch the case where the URL still references a reward that has
  // since been deactivated or sold out. Without this guard the
  // backer would be allowed to fill in payment details and only see
  // the "reward not available" / "sold out" 400 from the API after
  // hitting Pay. Surface it up front instead so they can pick another
  // reward (or pledge without one) without wasting the click.
  const unavailable = rewardUnavailableReason(selectedReward);

  const initialAmount = amountParam
    ? parseFloat(amountParam)
    : selectedReward?.minimum_pledge_sgd ?? 25;

  return (
    <main className="flex-1 bg-[var(--color-surface-raised)]">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <BackLink href={`/projects/${typedProject.slug}`}>
            Back to {typedProject.title}
          </BackLink>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)] mb-6">
            Complete your pledge
          </h1>

          {unavailable ? (
            <RewardUnavailableNotice
              unavailable={unavailable}
              projectSlug={typedProject.slug}
              projectId={typedProject.id}
            />
          ) : (
            <CheckoutWrapper
              project={typedProject}
              selectedReward={selectedReward}
              initialAmount={initialAmount}
            />
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Inline error UI for an URL-selected reward that's no longer
 * available. Two CTAs: "Choose another reward" sends them back to
 * the project page reward grid, and "Pledge without a reward"
 * drops the `?reward=` param so they can keep going if they just
 * want to back the campaign.
 */
function RewardUnavailableNotice({
  unavailable,
  projectSlug,
  projectId,
}: {
  unavailable: RewardUnavailable;
  projectSlug: string;
  projectId: string;
}) {
  const headline =
    unavailable.kind === "sold_out"
      ? "This reward is sold out"
      : "This reward is no longer available";
  const body =
    unavailable.kind === "sold_out"
      ? `“${unavailable.rewardTitle}” reached its backer limit. Pick another reward, or pledge without one — the campaign is still open.`
      : `“${unavailable.rewardTitle}” was removed by the creator. Pick another reward, or pledge without one — the campaign is still open.`;

  return (
    <div className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-bold text-amber-900 dark:text-amber-200">{headline}</p>
          <p className="text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
            {body}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Back to project page → reward grid lets them re-select */}
        <Button asChild>
          <Link href={`/projects/${projectSlug}`}>Choose another reward</Link>
        </Button>
        {/* Drops the `?reward=` query param so they fall through to the
            no-reward checkout path. Project page route uses UUID id, not slug. */}
        <Button asChild variant="secondary">
          <Link href={`/backing/${projectId}/checkout`}>Pledge without a reward</Link>
        </Button>
      </div>
    </div>
  );
}
