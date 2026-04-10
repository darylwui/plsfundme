import Link from "next/link";
import { PlusCircle, ArrowRight, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, daysRemaining } from "@/lib/utils/dates";
import { formatSgd, fundingPercent } from "@/lib/utils/currency";

interface Props {
  searchParams: Promise<{ submitted?: string }>;
}

export default async function DashboardProjectsPage({ searchParams }: Props) {
  const { submitted } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, slug, status, funding_goal_sgd, amount_pledged_sgd, backer_count, deadline, created_at, cover_image_url")
    .eq("creator_id", user!.id)
    .order("created_at", { ascending: false });

  const statusVariant: Record<string, "violet" | "lime" | "coral" | "neutral" | "amber"> = {
    draft: "neutral",
    pending_review: "amber",
    active: "violet",
    funded: "lime",
    failed: "coral",
    cancelled: "neutral",
    removed: "coral",
  };

  const statusLabel: Record<string, string> = {
    pending_review: "pending review",
  };

  return (
    <div className="flex flex-col gap-6">
      {submitted === "1" && (
        <div className="rounded-[var(--radius-card)] bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold text-amber-900">Campaign submitted for review!</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Our team will review your campaign within 1–2 business days. You&apos;ll receive an email once it&apos;s approved and live.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--color-ink)]">My projects</h1>
        <Link href="/projects/create">
          <Button>
            <PlusCircle className="w-4 h-4" />
            New campaign
          </Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-16 flex flex-col items-center text-center gap-4">
          <div className="text-5xl">🚀</div>
          <div>
            <h2 className="text-xl font-black text-[var(--color-ink)]">
              No projects yet
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-sm">
              Ready to raise funds for your idea? Create your first campaign in
              minutes.
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
            const percent = fundingPercent(project.amount_pledged_sgd, project.funding_goal_sgd);
            const days = daysRemaining(project.deadline);

            return (
              <div
                key={project.id}
                className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Cover thumbnail */}
                <div className="w-full sm:w-24 h-16 rounded-lg bg-[var(--color-surface-overlay)] shrink-0 overflow-hidden">
                  {project.cover_image_url ? (
                    <img
                      src={project.cover_image_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🚀
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-[var(--color-ink)] truncate">
                      {project.title}
                    </p>
                    <Badge variant={statusVariant[project.status] ?? "neutral"}>
                      {statusLabel[project.status] ?? project.status}
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
                    <span className="text-xs font-semibold text-[var(--color-ink)] shrink-0">
                      {formatSgd(project.amount_pledged_sgd)} · {percent}% · {project.backer_count} backers
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/projects/${project.slug}/edit`}
                    onClick={(e) => e.stopPropagation()}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
