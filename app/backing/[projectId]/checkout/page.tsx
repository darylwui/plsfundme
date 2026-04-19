import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CheckoutWrapper } from "@/components/backing/CheckoutWrapper";
import type { ProjectWithRelations } from "@/types/project";
import type { Reward } from "@/types/reward";

interface CheckoutPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ reward?: string; amount?: string }>;
}

export const metadata = { title: "Checkout" };

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

  const initialAmount = amountParam
    ? parseFloat(amountParam)
    : selectedReward?.minimum_pledge_sgd ?? 25;

  return (
    <main className="flex-1 bg-[var(--color-surface-raised)]">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/projects/${typedProject.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {typedProject.title}
        </Link>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)] mb-6">
            Complete your pledge
          </h1>
          <CheckoutWrapper
            project={typedProject}
            selectedReward={selectedReward}
            initialAmount={initialAmount}
          />
        </div>
      </div>
    </main>
  );
}
