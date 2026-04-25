import Link from "next/link";
import { PlusCircle, ArrowRight, Pencil, Heart, Clock, XCircle, MessageCircleQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FundingProgressCard } from "@/components/dashboard/FundingProgressCard";
import { BackerTable } from "@/components/dashboard/BackerTable";
import { SingpassVerifiedBadge } from "@/components/dashboard/SingpassVerificationCard";
import { CreatorOnboardingStepper } from "@/components/dashboard/CreatorOnboardingStepper";
import { DraftContinuationCard } from "@/components/dashboard/DraftContinuationCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/dates";
import { formatSgd } from "@/lib/utils/currency";
import { getProjectStatusLabel, getProjectStatusVariant } from "@/lib/utils/project-status";
import { extractDraftTitle } from "@/lib/dashboard/wizard-draft";
import type { ProjectWithRelations } from "@/types/project";
import type { PledgeWithBacker } from "@/types/pledge";

// ─── Backer Dashboard ────────────────────────────────────────────────────────

async function BackerDashboard({ userId, displayName, email }: { userId: string; displayName: string; email: string }) {
  const supabase = await createClient();

  const { data: pledgesRaw } = await supabase
    .from("pledges")
    .select("*, project:projects(id, title, slug, status, funding_goal_sgd, amount_pledged_sgd, backer_count, deadline, cover_image_url)")
    .eq("backer_id", userId)
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

// ─── Creator Dashboard ───────────────────────────────────────────────────────

async function CreatorDashboard({ userId, displayName, email }: { userId: string; displayName: string; email: string }) {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)")
    .eq("creator_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const typedProjects = (projects as unknown as ProjectWithRelations[]) ?? [];
  const activeProject = typedProjects.find((p) => p.status === "active") ?? typedProjects[0];
  const onlyProjectIsDraft =
    typedProjects.length > 0 && typedProjects.every((p) => p.status === "draft");

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("singpass_verified, status, rejection_reason")
    .eq("id", userId)
    .single();
  const singpassVerified = Boolean(creatorProfile?.singpass_verified);
  const creatorStatus = creatorProfile?.status ?? "pending_review";
  const rejectionReason = creatorProfile?.rejection_reason ?? null;

  // Surface in-progress wizard work on the dashboard.
  // The wizard auto-saves to `campaign_drafts` (one row per user via
  // UNIQUE(user_id)). We only surface this when the creator has zero
  // projects — projects.status='draft' takes priority when both exist.
  const { data: wizardDraftRow } = await supabase
    .from("campaign_drafts")
    .select("draft_data, step, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  const wizardDraft = wizardDraftRow
    ? {
        title: extractDraftTitle(wizardDraftRow.draft_data),
        step: wizardDraftRow.step,
        updated_at: wizardDraftRow.updated_at,
      }
    : null;

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

  // Subtitle varies by application status
  const subtitle =
    creatorStatus === "pending_review"
      ? "Your creator application is under review."
      : creatorStatus === "needs_info"
        ? "Your reviewer is waiting on more info."
        : creatorStatus === "rejected"
          ? "Your creator application needs attention."
          : "Here\u2019s what\u2019s happening with your campaigns.";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-[var(--color-ink)]">
              Hey, {displayName.split(" ")[0]} 👋
            </h1>
            {singpassVerified && <SingpassVerifiedBadge />}
          </div>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{subtitle}</p>
          <p className="text-xs text-[var(--color-ink-subtle)] mt-1">{email}</p>
        </div>
        {creatorStatus === "approved" && (
          <div className="flex items-center gap-2">
            <Link href="/projects/create">
              <Button>
                <PlusCircle className="w-4 h-4" />
                New campaign
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Needs info ── */}
      {creatorStatus === "needs_info" && (
        <div className="rounded-[var(--radius-card)] border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
            <MessageCircleQuestion className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-[var(--color-ink)]">Your reviewer has a question</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">
              Head to your application thread to see what they asked and reply.
            </p>
            <Link href="/dashboard/application" className="inline-block mt-3">
              <Button size="sm">Open application</Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Application pending ── */}
      {creatorStatus === "pending_review" && (
        <div className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-8 text-center flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-ink)]">Your application is under review</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
              Our team reviews all creator applications within{" "}
              <strong className="text-[var(--color-ink)]">1–2 business days</strong>. We&apos;ll
              email you once a decision has been made.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-700 bg-white dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            Once approved, you&apos;ll be able to create and publish your first campaign.
          </div>
        </div>
      )}

      {/* ── Application rejected ── */}
      {creatorStatus === "rejected" && (
        <div className="rounded-[var(--radius-card)] border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 overflow-hidden">
          <div className="px-5 py-4 flex items-start gap-3 border-b border-red-200 dark:border-red-800">
            <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 dark:text-red-300">Application not approved</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                Unfortunately, your creator application was not approved at this time.
              </p>
            </div>
          </div>
          {rejectionReason && (
            <div className="px-5 py-4 border-b border-red-200 dark:border-red-800">
              <p className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-1.5">
                Feedback from reviewer
              </p>
              <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">{rejectionReason}</p>
            </div>
          )}
          <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
            <Link href="/apply/creator">
              <Button size="sm">Re-apply as Creator</Button>
            </Link>
            <a
              href="mailto:hello@getthatbread.sg"
              className="text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              Contact support
            </a>
          </div>
        </div>
      )}

      {/* ── Approved: show campaigns ── */}
      {creatorStatus === "approved" && (
        typedProjects.length === 0 ? (
          // No projects yet. If the wizard has in-progress work, surface
          // the draft-continuation card pointing back to /projects/create
          // (which auto-restores from campaign_drafts). Otherwise show the
          // 4-step onboarding stepper.
          wizardDraft ? (
            <DraftContinuationCard
              source="campaign-draft"
              draft={{
                title: wizardDraft.title,
                step: wizardDraft.step,
                updated_at: wizardDraft.updated_at,
              }}
            />
          ) : (
            <CreatorOnboardingStepper singpassVerified={singpassVerified} />
          )
        ) : onlyProjectIsDraft && activeProject ? (
          <div className="flex flex-col gap-8">
            <DraftContinuationCard
              source="project"
              project={{
                id: activeProject.id,
                title: activeProject.title,
                slug: activeProject.slug,
                updated_at: activeProject.updated_at,
              }}
            />
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
        )
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
