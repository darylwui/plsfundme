import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSgd } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";

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
    project: {
      id: string; title: string; slug: string; status: string;
      funding_goal_sgd: number; amount_pledged_sgd: number;
      backer_count: number; deadline: string; cover_image_url: string | null;
    } | null;
  };

  const pledges = (pledgesRaw ?? []) as unknown as PledgeRow[];
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

  function PledgeCard({ pledge }: { pledge: PledgeRow }) {
    const project = pledge.project;
    if (!project) return null;
    return (
      <div className="flex items-center gap-4 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-4">
        <div className="w-16 h-16 rounded-lg bg-[var(--color-surface-overlay)] shrink-0 overflow-hidden">
          {project.cover_image_url ? (
            <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍞</div>
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
            {formatSgd(pledge.amount_sgd)} via {pledge.payment_method === "paynow" ? "PayNow" : "Card"} · {formatDate(pledge.created_at)}
          </p>
        </div>
        <Link
          href={`/projects/${project.slug}`}
          className="text-sm font-semibold text-[var(--color-brand-violet)] hover:underline flex items-center gap-1 shrink-0"
        >
          View <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">My pledges</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
            All the projects you&apos;ve backed on get that bread.
          </p>
        </div>
        {activePledges.length > 0 && (
          <div className="text-sm text-[var(--color-ink-muted)]">
            <span className="font-bold text-[var(--color-ink)]">{activePledges.length}</span> active pledge{activePledges.length !== 1 ? "s" : ""} ·{" "}
            <span className="font-bold text-[var(--color-brand-violet)]">{formatSgd(totalActive)}</span> pledged
          </div>
        )}
      </div>

      {pledges.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="text-4xl mb-4">🍞</p>
          <h2 className="text-lg font-bold text-[var(--color-ink)]">No pledges yet</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-6">
            Find a project you believe in and back it.
          </p>
          <Link href="/explore">
            <Button size="lg"><Heart className="w-4 h-4" /> Explore projects</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activePledges.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-[var(--color-ink)]">Active pledges</h2>
              {activePledges.map((p) => <PledgeCard key={p.id} pledge={p} />)}
            </div>
          )}
          {pastPledges.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-[var(--color-ink-muted)]">Past pledges</h2>
              {pastPledges.map((p) => <PledgeCard key={p.id} pledge={p} />)}
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <Link href="/explore" className="text-sm font-semibold text-[var(--color-brand-violet)] hover:underline">
          Discover more projects →
        </Link>
      </div>
    </div>
  );
}
