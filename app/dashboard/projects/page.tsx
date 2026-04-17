import Link from "next/link";
import { PlusCircle, ArrowRight, Pencil, Rocket, PartyPopper, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "@/components/sharing/ShareButtons";
import { formatDate, daysRemaining } from "@/lib/utils/dates";
import { formatSgd, fundingPercent } from "@/lib/utils/currency";
import { REJECTION_REASONS } from "@/types/admin";
import { getProjectStatusLabel, getProjectStatusVariant } from "@/lib/utils/project-status";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";

interface Props {
  searchParams: Promise<{ submitted?: string; slug?: string; resubmitted?: string }>;
}

export default async function DashboardProjectsPage({ searchParams }: Props) {
  const { submitted, slug: submittedSlug, resubmitted } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projects } = await (supabase as any)
    .from("projects")
    .select("id, title, slug, status, rejection_reason, rejection_reason_code, funding_goal_sgd, amount_pledged_sgd, backer_count, deadline, created_at, cover_image_url")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false }) as { data: any[] | null };

  // Only show "New campaign" button when the user is actually able to create.
  const { data: pmProfile } = await supabase
    .from("project_manager_profiles")
    .select("status")
    .eq("id", user.id)
    .single();
  const canCreate = pmProfile?.status === "approved";

  return (
    <div className="flex flex-col gap-6">

      {/* Resubmit confirmation */}
      {resubmitted === "1" && (
        <div className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 flex items-start gap-3">
          <PartyPopper className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200">Campaign resubmitted!</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Our team will review your updated campaign within 1–2 business days.
            </p>
          </div>
        </div>
      )}

      {/* Post-submission share banner */}
      {submitted === "1" && submittedSlug && (
        <div className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 overflow-hidden">
          <div className="px-5 py-4 flex items-start gap-3 border-b border-amber-200 dark:border-amber-800">
            <PartyPopper className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">Campaign submitted for review!</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                Our team will review within 1–2 business days. While you wait — share your campaign link now to build momentum before it goes live.
              </p>
            </div>
          </div>
          <div className="px-5 py-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Share your campaign
            </p>
            <ShareButtons
              url={`${BASE_URL}/projects/${submittedSlug}`}
              title={projects?.find((p) => p.slug === submittedSlug)?.title ?? "My campaign"}
              compact
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--color-ink)]">My projects</h1>
        {canCreate ? (
          <Link href="/projects/create">
            <Button>
              <PlusCircle className="w-4 h-4" />
              New campaign
            </Button>
          </Link>
        ) : pmProfile?.status === "pending_review" ? (
          <span
            title="Your creator application is still under review. You'll be able to launch once approved."
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-btn)] border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-xs font-semibold text-amber-700 dark:text-amber-300"
          >
            <PlusCircle className="w-4 h-4" />
            New campaign · Awaiting approval
          </span>
        ) : (
          <Link href="/apply/pm">
            <Button variant="secondary">
              <PlusCircle className="w-4 h-4" />
              Apply to launch campaigns
            </Button>
          </Link>
        )}
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-violet)]/10 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-[var(--color-brand-violet)]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--color-ink)]">No projects yet</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-sm">
              Ready to raise funds for your idea? Create your first campaign in minutes.
            </p>
          </div>
          <Link href="/projects/create">
            <Button size="lg">
              <PlusCircle className="w-4 h-4" />
              Start your first campaign
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => {
            const percent = fundingPercent(project.amount_pledged_sgd ?? 0, project.funding_goal_sgd);
            const days = daysRemaining(project.deadline);
            const isShareable = project.status === "active" || project.status === "pending_review";
            const isRejected = project.status === "cancelled";
            const rejectionReasonCode = (project as any).rejection_reason_code as string | null;
            const rejectionMessage = (project as any).rejection_reason as string | null;
            const reasonLabel = rejectionReasonCode
              ? Object.values(REJECTION_REASONS).find((r) => r.code === rejectionReasonCode)?.label
              : null;

            return (
              <div
                key={project.id}
                className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow overflow-hidden"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Cover thumbnail */}
                  <div className="w-full sm:w-24 h-16 rounded-lg bg-[var(--color-surface-overlay)] shrink-0 overflow-hidden">
                    {project.cover_image_url ? (
                      <img
                        src={project.cover_image_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-[var(--color-ink-subtle)]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-[var(--color-ink)] truncate">{project.title}</p>
                      <Badge variant={getProjectStatusVariant(project.status)}>
                        {getProjectStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-ink-subtle)]">
                      Created {formatDate(project.created_at)} · Deadline {formatDate(project.deadline)}
                      {project.status === "active" && ` · ${days}d left`}
                    </p>

                    {/* Mini progress bar */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-overlay)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-brand-violet)]"
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold font-mono text-[var(--color-ink)] shrink-0">
                        {formatSgd(project.amount_pledged_sgd ?? 0)} · {percent}% · {project.backer_count ?? 0} backers
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/projects/${project.slug}/edit`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Link>
                    <Link href={`/projects/${project.slug}`}>
                      <ArrowRight className="w-4 h-4 text-[var(--color-ink-subtle)]" />
                    </Link>
                  </div>
                </div>

                {/* Share strip for live / pending campaigns */}
                {isShareable && (
                  <div className="border-t border-[var(--color-border)] px-5 py-3 bg-[var(--color-surface-raised)] flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--color-ink-subtle)] uppercase tracking-wider shrink-0">
                      Share
                    </span>
                    <ShareButtons
                      url={`${BASE_URL}/projects/${project.slug}`}
                      title={project.title}
                      compact
                    />
                  </div>
                )}

                {/* Rejection reason strip */}
                {isRejected && (rejectionMessage || rejectionReasonCode) && (
                  <div className="border-t border-amber-200 dark:border-amber-700 px-5 py-3 bg-amber-50 dark:bg-amber-900/20 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        {reasonLabel && (
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                            📋 {reasonLabel}
                          </p>
                        )}
                        {rejectionMessage && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">{rejectionMessage}</p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/projects/${project.slug}/edit`}
                      className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline self-start"
                    >
                      Edit &amp; resubmit →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
