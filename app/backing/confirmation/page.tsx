import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatSgd } from "@/lib/utils/currency";

interface ConfirmationPageProps {
  searchParams: Promise<{ pledge?: string; payment_intent?: string }>;
}

export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const { pledge: pledgeId } = await searchParams;

  let projectSlug = "/explore";
  let projectTitle = "the project";
  let amount = 0;

  if (pledgeId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pledges")
      .select("amount_sgd, project:projects!project_id(slug, title)")
      .eq("id", pledgeId)
      .single();

    if (data) {
      amount = data.amount_sgd;
      const project = data.project as unknown as { slug: string; title: string } | null;
      if (project) {
        projectSlug = `/projects/${project.slug}`;
        projectTitle = project.title;
      }
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-[var(--color-surface-raised)] px-4 py-16">
      <div className="max-w-md w-full bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-lime-100 dark:bg-lime-900/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-[var(--color-brand-lime)]" />
        </div>

        <h1 className="text-2xl font-black text-[var(--color-ink)]">
          You&apos;re in! 🎉
        </h1>

        {amount > 0 && (
          <p className="mt-2 text-[var(--color-brand-violet)] font-black text-lg">
            {formatSgd(amount)} pledged
          </p>
        )}

        <p className="mt-3 text-[var(--color-ink-muted)] text-sm leading-relaxed">
          Your pledge to <strong>{projectTitle}</strong> is confirmed. You&apos;ll
          only be charged if the campaign reaches its funding goal. We&apos;ll
          email you with updates.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href={projectSlug}>
            <Button size="lg" fullWidth>
              Back to project
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary" size="lg" fullWidth>
              Discover more projects
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
