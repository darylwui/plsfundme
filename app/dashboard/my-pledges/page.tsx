import Link from "next/link";
import { ArrowRight, Heart, Rocket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSgd, fundingPercent } from "@/lib/utils/currency";
import { formatDate, daysRemaining } from "@/lib/utils/dates";
import { MilestoneSummary } from "@/components/milestones/MilestoneSummary";
import { resolveMilestonesForBacker, type BackerMilestoneView } from "@/lib/milestones/backer-view";

export const metadata = { title: "My pledges" };

export default async function MyPledgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: pledgesRaw } = await supabase
    .from("pledges")
    .select("*, project:projects(id, title, slug, status, funding_goal_sgd, amount_pledged_sgd, backer_count, deadline, cover_image_url)")
    .eq("backer_id", user!.id)
    .order("created_at", { ascending: false });

  type PledgeRow = {
    id: string;
    project_id: string;
    amount_sgd: number;
    payment_method: string;
    status: string;
    created_at: string;
    refunded: boolean;
    refunded_at: string | null;
    project: {
      id: string; title: string; slug: string; status: string;
      funding_goal_sgd: number; amount_pledged_sgd: number;
      backer_count: number; deadline: string; cover_image_url: string | null;
    } | null;
  };

  const pledges = (pledgesRaw ?? []) as unknown as PledgeRow[];

  const fundedPledges = pledges.filter((p) => p.project?.status === "funded");
  const milestoneViewByProjectId = new Map<string, BackerMilestoneView>();
  await Promise.all(
    fundedPledges.map(async (p) => {
      if (!p.project) return;
      const view = await resolveMilestonesForBacker(supabase, p.project.id);
      milestoneViewByProjectId.set(p.project.id, view);
    }),
  );

  const activePledges = pledges.filter((p) => !["cancelled", "failed", "released", "refunded"].includes(p.status));
  const pastPledges = pledges.filter((p) => ["cancelled", "failed", "released", "refunded"].includes(p.status));
  const totalActive = activePledges.reduce((s, p) => s + p.amount_sgd, 0);

  const pledgeStatusLabel: Record<string, string> = {
    authorized: "Pledged", paynow_captured: "Pledged", captured: "Charged",
    released: "Refunded", refunded: "Refunded", cancelled: "Cancelled", failed: "Failed",
  };
  const pledgeStatusVariant: Record<string, "violet" | "lime" | "coral" | "neutral" | "amber"> = {
    authorized: "violet", paynow_captured: "violet", captured: "lime",
    released: "neutral", refunded: "neutral", cancelled: "neutral", failed: "coral",
  };
  const projectStatusVariant: Record<string, "violet" | "lime" | "coral" | "neutral" | "amber"> = {
    active: "violet", funded: "lime", failed: "coral", pending_review: "amber",
    draft: "neutral", cancelled: "neutral", removed: "coral",
  };
  const projectStatusLabel: Record<string, string> = {
    active: "Live", funded: "Funded", failed: "Failed", pending_review: "Under review",
    draft: "Draft", cancelled: "Cancelled",
  };

  function ActivePledgeCard({
    pledge,
    milestoneViewByProjectId,
  }: {
    pledge: PledgeRow;
    milestoneViewByProjectId: Map<string, BackerMilestoneView>;
  }) {
    const project = pledge.project;
    if (!project) return null;
    const percent = fundingPercent(project.amount_pledged_sgd, project.funding_goal_sgd);
    const days = daysRemaining(project.deadline);
    const isActive = project.status === "active";
    const isFunded = project.status === "funded";
    const barColor = isFunded ? "bg-[var(--color-brand-success)]" : "bg-[var(--color-brand-crust)]";

    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center gap-4 p-5">
          <div className="w-16 h-16 rounded-lg bg-[var(--color-surface-overlay)] shrink-0 overflow-hidden">
            {project.cover_image_url ? (
              <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Rocket className="w-6 h-6 text-[var(--color-ink-subtle)]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-ink)] truncate">{project.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <Badge variant={projectStatusVariant[project.status] ?? "neutral"}>
                {projectStatusLabel[project.status] ?? project.status}
              </Badge>
              <Badge variant={pledgeStatusVariant[pledge.status] ?? "neutral"}>
                {pledgeStatusLabel[pledge.status] ?? pledge.status}
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-ink-subtle)] mt-1">
              You pledged <span className="font-mono font-semibold text-[var(--color-ink)]">{formatSgd(pledge.amount_sgd)}</span>
              {" "}via {pledge.payment_method === "paynow" ? "PayNow" : "Card"} · {formatDate(pledge.created_at)}
            </p>
          </div>
          <Link
            href={`/projects/${project.slug}`}
            className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline flex items-center gap-1 shrink-0"
          >
            View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Progress strip: funding bar while funding; milestone summary once funded */}
        {(() => {
          if (project.status === "funded") {
            const view = milestoneViewByProjectId.get(project.id);
            if (view && view.milestones.length === 3) {
              return <MilestoneSummary milestones={view.milestones} hasOpenDispute={view.hasOpenDispute} />;
            }
            // Defensive fallback: funded but no milestones defined (legacy data) — keep funding strip
          }
          return (
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-3 flex flex-col gap-2">
              <div className="h-1.5 rounded-full bg-[var(--color-surface-overlay)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
                <span>
                  <span className="font-mono font-bold text-[var(--color-ink)]">{formatSgd(project.amount_pledged_sgd)}</span>
                  {" "}raised of <span className="font-mono">{formatSgd(project.funding_goal_sgd)}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span><span className="font-mono font-bold text-[var(--color-ink)]">{percent}%</span> funded</span>
                  <span><span className="font-mono font-bold text-[var(--color-ink)]">{project.backer_count}</span> backers</span>
                  {isActive && (
                    <span className={`font-mono font-bold ${days <= 3 ? "text-[var(--color-brand-danger)]" : "text-[var(--color-ink)]"}`}>
                      {days}d left
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  function PastPledgeCard({ pledge }: { pledge: PledgeRow }) {
    const project = pledge.project;
    if (!project) return null;
    const methodLabel = pledge.payment_method === "paynow" ? "PayNow" : "Card";

    // Status-specific refund detail line. Backers' top question on a past
    // pledge is "did the money come back, when, how" — so spell it out.
    let refundDetail: string | null = null;
    if (pledge.status === "refunded" && pledge.refunded_at) {
      refundDetail = `Refunded on ${formatDate(pledge.refunded_at)}`;
    } else if (pledge.status === "refunded") {
      // Refunded flag set without a timestamp (legacy / partial data)
      refundDetail = `Refunded to ${methodLabel}`;
    } else if (pledge.status === "released") {
      refundDetail = "Card hold released — never charged";
    }

    return (
      <div className="flex items-center gap-4 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 opacity-70">
        <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-overlay)] shrink-0 overflow-hidden">
          {project.cover_image_url ? (
            <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Rocket className="w-5 h-5 text-[var(--color-ink-subtle)]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-ink-muted)] truncate text-sm">{project.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <Badge variant={projectStatusVariant[project.status] ?? "neutral"}>
              {projectStatusLabel[project.status] ?? project.status}
            </Badge>
            <Badge variant={pledgeStatusVariant[pledge.status] ?? "neutral"}>
              {pledgeStatusLabel[pledge.status] ?? pledge.status}
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">
            {formatSgd(pledge.amount_sgd)} via {methodLabel} · pledged {formatDate(pledge.created_at)}
          </p>
          {refundDetail && (
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 font-medium">
              {refundDetail}
            </p>
          )}
        </div>
        <Link
          href={`/projects/${project.slug}`}
          className="text-xs font-semibold text-[var(--color-ink-subtle)] hover:text-[var(--color-brand-crust)] flex items-center gap-1 shrink-0 transition-colors"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">My backed projects</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
            All the projects you&apos;ve backed on get that bread.
          </p>
        </div>
        {activePledges.length > 0 && (
          <div className="text-sm text-[var(--color-ink-muted)]">
            <span className="font-mono font-bold text-[var(--color-ink)]">{activePledges.length}</span> active pledge{activePledges.length !== 1 ? "s" : ""}{" · "}
            <span className="font-mono font-bold text-[var(--color-brand-crust)]">{formatSgd(totalActive)}</span> pledged
          </div>
        )}
      </div>

      {pledges.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-crust)]/10 flex items-center justify-center">
            <Heart className="w-8 h-8 text-[var(--color-brand-crust)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-ink)]">No pledges yet</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">
              Find a project you believe in and be the first to back it.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/explore"><Heart className="w-4 h-4" /> Explore projects</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activePledges.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-[var(--color-ink)]">Active pledges</h2>
              {activePledges.map((p) => (
                <ActivePledgeCard key={p.id} pledge={p} milestoneViewByProjectId={milestoneViewByProjectId} />
              ))}
            </div>
          )}
          {pastPledges.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-[var(--color-ink-muted)] text-sm uppercase tracking-wider">Past pledges</h2>
              {pastPledges.map((p) => <PastPledgeCard key={p.id} pledge={p} />)}
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <Link href="/explore" className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline">
          Discover more projects →
        </Link>
      </div>
    </div>
  );
}
