import Link from "next/link";
import { PlusCircle, ArrowRight, Pencil, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FundingProgressCard } from "@/components/dashboard/FundingProgressCard";
import { BackerTable } from "@/components/dashboard/BackerTable";
import {
  SingpassVerificationCard,
  SingpassVerifiedBadge,
} from "@/components/dashboard/SingpassVerificationCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/dates";
import { formatSgd } from "@/lib/utils/currency";
import { getProjectStatusLabel, getProjectStatusVariant } from "@/lib/utils/project-status";
import type { ProjectWithRelations } from "@/types/project";
import type { PledgeWithBacker } from "@/types/pledge";

// ─── Backer Dashboard ────────────────────────────────────────────────────────

async function BackerDashboard({ userId, displayName, email }: { userId: string; displayName: string; email: string }) {
  const supabase = await createClient();

  const { data: pledgesRaw } = await supabase
    .from("pledges")
    .select("*, project:projects(id, title, slug, status, funding_goal_sgd, amount_pledged_sgd, backer_count, deadline, cover_image_url)")
    .eq("backer_id", userId)
    // "cancelled" isn't a valid `pledge_status` enum value in the DB — if
    // included here PostgREST 400s the whole query. The remaining statuses
    // cover every terminal state we want excluded from the "active" list.
    .not("status", "in", "(failed,released,refunded)")
    .order("created_at", { ascending: false })
    .limit(20);

  const pledges = (pledgesRaw ?? []) as unknown as (PledgeWithBacker & {
    project: { id: string; title: string; slug: string; status: string; funding_goal_sgd: number; amount_pledged_sgd: number; backer_count: number; deadline: string; cover_image_url: string | null } | null;
  })[];

  const totalPledged = pledges.reduce((s, p) => s + p.amount_sgd, 0);
  const uniqueProjects = new Set(pledges.map((p) => p.project_id)).size;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">
          Hey, {displayName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
          Here are the projects you&apos;re backing.
        </p>
        <p className="text-xs text-[var(--color-ink-subtle)] mt-1">{email}</p>
      </div>

      {/* Apply as Creator CTA */}
      <div className="bg-gradient-to-r from-[var(--color-brand-golden)]/10 to-[var(--color-brand-crust)]/10 rounded-[var(--radius-card)] border border-[var(--color-brand-golden)]/30 p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[var(--color-ink)] mb-1">Ready to launch your own campaign?</h3>
          <p className="text-sm text-[var(--color-ink-muted)]">Become a creator and bring your ideas to life on get that bread.</p>
        </div>
        <Link href="/apply/creator" className="shrink-0">
          <Button variant="primary" size="sm">
            Apply as Creator
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {pledges.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-subtle)] mb-1">Projects backed</p>
            <p className="text-3xl font-black text-[var(--color-ink)]">{uniqueProjects}</p>
          </div>
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-subtle)] mb-1">Total pledged</p>
            <p className="text-3xl font-black text-[var(--color-brand-crust)]">{formatSgd(totalPledged)}</p>
          </div>
        </div>
      )}

      {pledges.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="text-4xl mb-4">🍞</p>
          <h2 className="text-lg font-bold text-[var(--color-ink)]">No pledges yet</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-6">
            Explore campaigns and back the ideas you believe in.
          </p>
          <Link href="/explore">
            <Button size="lg">
              <Heart className="w-4 h-4" />
              Explore projects
            </Button>
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="font-bold text-[var(--color-ink)] mb-4">Backed projects</h2>
          <div className="flex flex-col gap-3">
            {pledges.map((pledge) => {
              const project = pledge.project;
              if (!project) return null;
              return (
                <div key={pledge.id} className="flex items-center gap-4 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
                  {/* Cover thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-[var(--color-surface-overlay)] shrink-0 overflow-hidden">
                    {project.cover_image_url ? (
                      <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🍞</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--color-ink)] truncate">{project.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant={getProjectStatusVariant(project.status)}>
                        {getProjectStatusLabel(project.status)}
                      </Badge>
                      <span className="text-xs text-[var(--color-ink-subtle)]">
                        Pledged {formatSgd(pledge.amount_sgd)} · {formatDate(pledge.created_at)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline flex items-center gap-1 shrink-0"
                  >
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-[var(--color-border)]">
        <Link href="/explore">
          <Button variant="ghost" fullWidth>
            <Heart className="w-4 h-4" />
            Explore all projects
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Creator / PM Dashboard ──────────────────────────────────────────────────

async function CreatorDashboard({ userId, displayName, email }: { userId: string; displayName: string; email: string }) {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const typedProjects = (projects as unknown as ProjectWithRelations[]) ?? [];
  const activeProject = typedProjects.find((p) => p.status === "active") ?? typedProjects[0];

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("singpass_verified")
    .eq("id", userId)
    .single();
  const singpassVerified = Boolean(creatorProfile?.singpass_verified);

  let recentPledges: PledgeWithBacker[] = [];
  if (activeProject) {
    const { data: pledges } = await supabase
      .from("pledges")
      .select("*, backer:profiles!backer_id(id, display_name, avatar_url)")
      .eq("project_id", activeProject.id)
      .in("status", ["authorized", "paynow_captured", "captured"])
      .order("created_at", { ascending: false })
      .limit(50);
    recentPledges = (pledges as unknown as PledgeWithBacker[]) ?? [];
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-[var(--color-ink)]">
              Hey, {displayName.split(" ")[0]} 👋
            </h1>
            {singpassVerified && <SingpassVerifiedBadge />}
          </div>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
            Here&apos;s what&apos;s happening with your campaigns.
          </p>
          <p className="text-xs text-[var(--color-ink-subtle)] mt-1">{email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/creator-profile">
            <Button variant="secondary">
              <Pencil className="w-4 h-4" />
              Edit creator card
            </Button>
          </Link>
          <Link href="/projects/create">
            <Button>
              <PlusCircle className="w-4 h-4" />
              New campaign
            </Button>
          </Link>
        </div>
      </div>

      {!singpassVerified && <SingpassVerificationCard />}

      {typedProjects.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="text-4xl mb-4">🚀</p>
          <h2 className="text-lg font-bold text-[var(--color-ink)]">Launch your first campaign</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-6">
            Create a project, set your goal, and start raising funds.
          </p>
          <Link href="/projects/create">
            <Button size="lg"><PlusCircle className="w-4 h-4" /> Start a project</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {activeProject && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-[var(--color-ink)]">{activeProject.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getProjectStatusVariant(activeProject.status)}>
                      {getProjectStatusLabel(activeProject.status)}
                    </Badge>
                    <span className="text-xs text-[var(--color-ink-subtle)]">Ends {formatDate(activeProject.deadline)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/projects/${activeProject.slug}/edit`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </Link>
                  <Link href={`/projects/${activeProject.slug}`} className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline flex items-center gap-1">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <FundingProgressCard projectId={activeProject.id} goal={activeProject.funding_goal_sgd} deadline={activeProject.deadline} initialPledged={activeProject.amount_pledged_sgd} initialBackers={activeProject.backer_count} />
            </div>
          )}

          {activeProject && (
            <div>
              <h2 className="font-bold text-[var(--color-ink)] mb-4">Recent backers</h2>
              <BackerTable projectId={activeProject.id} initialPledges={recentPledges} />
            </div>
          )}

          {typedProjects.length > 1 && (
            <div>
              <h2 className="font-bold text-[var(--color-ink)] mb-4">All campaigns</h2>
              <div className="flex flex-col gap-3">
                {typedProjects.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--color-ink)] truncate">{p.title}</p>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">Ends {formatDate(p.deadline)}</p>
                    </div>
                    <Badge variant={getProjectStatusVariant(p.status)}>{getProjectStatusLabel(p.status)}</Badge>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/projects/${p.slug}/edit`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] hover:bg-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                        <Pencil className="w-3 h-3" /> Edit
                      </Link>
                      <Link href={`/projects/${p.slug}`}><ArrowRight className="w-4 h-4 text-[var(--color-ink-subtle)]" /></Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Route ───────────────────────────────────────────────────────────────────

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user!.id)
    .single();

  const displayName = profile?.display_name ?? "there";
  const email = user?.email ?? "";
  const role = (profile?.role ?? "backer").toString().trim().toLowerCase();

  // Backer shows backer dashboard for all non-creator roles
  if (role === "creator") {
    return <CreatorDashboard userId={user!.id} displayName={displayName} email={email} />;
  }

  return <BackerDashboard userId={user!.id} displayName={displayName} email={email} />;
}
