import Link from "next/link";
import { CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/sharing/ShareButtons";
import { formatSgd } from "@/lib/utils/currency";
import { TrackPledge } from "./_TrackPledge";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";

interface ConfirmationPageProps {
  searchParams: Promise<{ pledge?: string; payment_intent?: string }>;
}

export const metadata = { title: "Pledge confirmed" };

export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const { pledge: pledgeId } = await searchParams;

  let projectSlug = "/explore";
  let projectShareUrl = "";
  let projectTitle = "the project";
  let amount = 0;
  let backerNumber: number | null = null;
  let isAnonymous = false;

  if (pledgeId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pledges")
      .select("amount_sgd, created_at, is_anonymous, project_id, project:projects!project_id(slug, title)")
      .eq("id", pledgeId)
      .single();

    if (data) {
      amount = data.amount_sgd;
      isAnonymous = data.is_anonymous;
      const project = data.project as unknown as { slug: string; title: string } | null;
      if (project) {
        projectSlug = `/projects/${project.slug}`;
        projectShareUrl = `${BASE_URL}/projects/${project.slug}`;
        projectTitle = project.title;
      }

      // Derive backer number: count pledges on the same project created before
      // this one. We count any non-failed pledge so the number reflects "social
      // order" rather than just successfully-captured pledges (which only
      // settle when the campaign funds, often weeks later).
      const { count } = await supabase
        .from("pledges")
        .select("id", { count: "exact", head: true })
        .eq("project_id", data.project_id)
        .lt("created_at", data.created_at)
        .not("status", "in", "(failed,cancelled,refunded)");

      backerNumber = (count ?? 0) + 1;
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-[var(--color-surface-raised)] px-4 py-16">
      <TrackPledge />
      <div className="max-w-md w-full flex flex-col gap-4">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-lime-100 dark:bg-lime-900/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[var(--color-brand-success)]" />
          </div>

          <h1 className="text-2xl font-black text-[var(--color-ink)]">
            You&apos;re in! 🎉
          </h1>

          {amount > 0 && (
            <p className="mt-2 text-[var(--color-brand-crust)] font-black text-lg">
              {formatSgd(amount)} pledged
            </p>
          )}

          {backerNumber && (
            <div className="mt-5 inline-flex flex-col items-center gap-1 rounded-full bg-[var(--color-brand-crust)]/10 border border-[var(--color-brand-crust)]/30 px-5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-brand-crust)]">
                Founding backer
              </p>
              <p className="text-2xl font-black text-[var(--color-brand-crust)] leading-none">
                #{backerNumber}
              </p>
            </div>
          )}

          <p className="mt-4 text-[var(--color-ink-muted)] text-sm leading-relaxed">
            Your pledge to <strong>{projectTitle}</strong> is confirmed. You&apos;ll
            only be charged if the campaign reaches its funding goal. We&apos;ll
            email you with updates.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild size="lg" fullWidth>
              <Link href={projectSlug}>
                Back to project
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" fullWidth>
              <Link href="/explore">
                Discover more projects
              </Link>
            </Button>
          </div>

          <Link
            href="/backer-protection"
            className="mt-6 inline-flex items-center justify-center gap-1.5 text-xs text-[var(--color-ink-subtle)] hover:text-[var(--color-ink-muted)] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Covered by our backer protection
          </Link>
        </div>

        {/* Share CTA — grows momentum before the campaign closes.
            Non-anonymous backers get a personalized message that name-drops
            their badge number; anonymous backers get a generic "spread the
            word" version that doesn't out them. */}
        {projectShareUrl && (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-dashed border-[var(--color-brand-golden)]/60 p-6">
            <p className="text-sm font-bold text-[var(--color-ink)]">
              {!isAnonymous && backerNumber
                ? `You're backer #${backerNumber} — go tell people`
                : `Help ${projectTitle} get funded`}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 mb-3">
              Share with one person who&apos;d love this. The more backers, the higher the chance it funds.
            </p>
            <ShareButtons
              url={projectShareUrl}
              title={
                !isAnonymous && backerNumber
                  ? `Just became backer #${backerNumber} of ${projectTitle} on @getthatbreadsg 🍞`
                  : projectTitle
              }
              compact
            />
          </div>
        )}
      </div>
    </main>
  );
}
