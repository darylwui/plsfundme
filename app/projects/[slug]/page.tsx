import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Clock, CalendarDays, Building2, Globe, Link2 } from "lucide-react";
import { ShareButtons } from "@/components/sharing/ShareButtons";
import { BackLink } from "@/components/ui/back-link";
import { MilestoneTimeline } from "@/components/milestones/MilestoneTimeline";
import { ReportCampaignButton } from "@/components/dispute/ReportCampaignButton";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { FundingWidget } from "@/components/projects/FundingWidget";
import { BackerEducationSection } from "@/components/backer/BackerEducationSection";
import { FeaturedSticker } from "@/components/projects/FeaturedSticker";
import { ProjectPageSections } from "@/components/projects/ProjectPageSections";
import { CampaignToc } from "@/components/projects/CampaignToc";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysRemaining, formatDate } from "@/lib/utils/dates";
import { toEmbedUrl } from "@/lib/utils/video-embed";
import { processCampaignHtml } from "@/lib/utils/campaignHtml";
import { resolveMilestonesForBacker } from "@/lib/milestones/backer-view";
import type { ProjectWithRelations } from "@/types/project";
import type { Metadata } from "next";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

async function getProject(slug: string): Promise<ProjectWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(
      `
      *,
      category:categories(*),
      creator:profiles!creator_id(id, display_name, avatar_url),
      rewards(*),
      stretch_goals(*)
    `
    )
    .eq("slug", slug)
    .single();

  if (data?.rewards) {
    (data as any).rewards = data.rewards.filter((r: any) => r.is_active);
  }

  return (data as unknown as ProjectWithRelations) ?? null;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  const seoTitle = `${project.title} — Crowdfunding campaign in Singapore`;

  // og:image / twitter:image are injected automatically from the
  // co-located opengraph-image.tsx file convention — don't set them
  // here or the manual value will override the generated card.
  return {
    title: seoTitle,
    description: project.short_description,
    alternates: { canonical: `${BASE_URL}/projects/${slug}` },
    openGraph: {
      title: `${project.title} — get that bread`,
      description: project.short_description,
      url: `${BASE_URL}/projects/${slug}`,
      type: "website",
      locale: "en_SG",
      siteName: "get that bread",
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.short_description,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const project = await getProject(slug);

  if (!project) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCreator = user?.id === project.creator.id;

  // Parallel fetches
  const [{ data: updatesRaw }, { data: feedbackRaw }, userPledgeRows, milestoneView] = await Promise.all([
    supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("project_feedback")
      .select("id, project_id, author_id, parent_id, message, created_at, updated_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(100),
    // Fetch the user's most recent active pledge id (was a count-only check
    // before; we need the actual id now to wire the Stage 1 dispute concern
    // form). "cancelled" intentionally omitted — not a valid pledge_status
    // enum value; the remaining filter covers every terminal/inactive state.
    user
      ? supabase
          .from("pledges")
          .select("id")
          .eq("project_id", project.id)
          .eq("backer_id", user.id)
          .not("status", "in", "(failed,released,refunded)")
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [] as { id: string }[] }),
    resolveMilestonesForBacker(supabase, project.id),
  ]);

  const userPledgeId = (userPledgeRows.data ?? [])[0]?.id ?? null;
  const { data: openConcernRows } = userPledgeId
    ? await supabase
        .from("dispute_concerns")
        .select("created_at")
        .eq("pledge_id", userPledgeId)
        .in("status", ["open", "responded"])
        .order("created_at", { ascending: false })
        .limit(1)
    : { data: [] as { created_at: string }[] };
  const openConcernCreatedAt = openConcernRows?.[0]?.created_at ?? null;

  const service = createServiceClient();
  const { data: creatorPmProfile } = await service
    .from("creator_profiles")
    .select("bio, linkedin_url, company_name, company_website, project_type, project_description")
    .eq("id", project.creator.id)
    .maybeSingle();

  const updates = (updatesRaw ?? []) as import("@/types/project").ProjectUpdatePost[];

  const feedbackRows = (feedbackRaw ?? []) as {
    id: string;
    project_id: string;
    author_id: string;
    parent_id: string | null;
    message: string;
    created_at: string;
    updated_at: string;
  }[];

  const authorIds = [...new Set(feedbackRows.map((f) => f.author_id))];
  const { data: authorsRaw } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", authorIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };

  const authors = new Map((authorsRaw ?? []).map((a) => [a.id, a]));
  const feedback = feedbackRows.map((item) => ({
    ...item,
    author: authors.get(item.author_id)
      ? {
          display_name: authors.get(item.author_id)!.display_name,
          avatar_url: authors.get(item.author_id)!.avatar_url,
        }
      : null,
  }));

  const isBacker = isCreator || userPledgeId !== null;
  const daysLeft = daysRemaining(project.deadline);

  const { data: similarRaw } = await supabase
    .from("projects")
    .select(
      "*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)"
    )
    .eq("category_id", project.category_id)
    .neq("id", project.id)
    .in("status", ["active", "funded"])
    .order("created_at", { ascending: false })
    .limit(3);

  const similarProjects = (similarRaw ?? []) as unknown as ProjectWithRelations[];

  // Status guards
  if (project.status === "draft" && !isCreator) notFound();
  if (project.status === "removed") notFound();

  const isPendingReview = project.status === "pending_review";
  if (isPendingReview && !isCreator) notFound();

  const campaign = processCampaignHtml(project.full_description);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Pending review banner */}
      {isPendingReview && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            <strong>Under review</strong> — Your campaign is pending admin approval and is not yet
            visible to the public.
          </span>
        </div>
      )}

      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
        <BackLink href="/explore">Back to explore</BackLink>
        {isCreator && (
          <div className="flex items-center gap-2">
            {project.status === "active" && (
              <ShareButtons
                url={`${BASE_URL}/projects/${slug}`}
                title={project.title}
                compact
              />
            )}
            <Button asChild variant="secondary" size="sm">
              <Link href={`/projects/${slug}/edit`}>
                <Pencil className="w-3.5 h-3.5" />
                Edit campaign
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* ── Two-column layout: left = full story, right = sticky widget ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-10 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-6 min-w-0">

            {/* Hero */}
            <div>
              {project.category && (
                <Badge variant="violet" className="mb-3">
                  {project.category.name}
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-black text-[var(--color-ink)] tracking-tight leading-tight">
                {project.title}
              </h1>
              <p className="mt-3 text-lg text-[var(--color-ink-muted)] leading-relaxed">
                {project.short_description}
              </p>

              <div className="mt-5 inline-flex items-center gap-3 px-4 py-3 rounded-[var(--radius-card)] bg-amber-100/40 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <div className="w-10 h-10 rounded-full bg-amber-200/70 dark:bg-amber-800/40 ring-1 ring-amber-300 dark:ring-amber-700 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 shrink-0 overflow-hidden">
                  {project.creator.avatar_url ? (
                    <Image
                      src={project.creator.avatar_url}
                      alt={project.creator.display_name}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover"
                    />
                  ) : (
                    project.creator.display_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs text-[var(--color-ink-subtle)] uppercase tracking-[0.1em] font-medium">
                    Campaign by
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {project.creator.display_name}
                  </p>
                </div>
                <div className="w-px h-8 bg-[var(--color-border)] mx-1" />
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {daysLeft > 0 ? `${daysLeft} days left` : `Ended ${formatDate(project.deadline)}`}
                </div>
              </div>
            </div>

            {/* Pitch video (if provided), else cover image */}
            {(() => {
              const embedUrl = toEmbedUrl(project.video_url);
              if (embedUrl) {
                return (
                  <div className="relative w-full aspect-[16/9] rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-800/50 bg-black overflow-hidden">
                    <iframe
                      src={embedUrl}
                      title={`${project.title} pitch video`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    {project.is_featured && (
                      <FeaturedSticker className="absolute bottom-4 left-4 z-10 w-[14%] min-w-[70px] max-w-[120px] aspect-square" />
                    )}
                  </div>
                );
              }
              if (project.cover_image_url) {
                return (
                  <div className="relative w-full aspect-[16/9] rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-800/50 bg-[var(--color-surface-overlay)] overflow-hidden">
                    <Image
                      src={project.cover_image_url}
                      alt={project.title}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                    {project.is_featured && (
                      <FeaturedSticker className="absolute bottom-4 left-4 z-10 w-[14%] min-w-[70px] max-w-[120px] aspect-square" />
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Creator PM profile card */}
            {creatorPmProfile && (
              <div className="rounded-[var(--radius-card)] border-2 border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-200/70 dark:bg-amber-800/40 ring-1 ring-amber-300 dark:ring-amber-700 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 shrink-0 overflow-hidden">
                    {project.creator.avatar_url ? (
                      <Image
                        src={project.creator.avatar_url}
                        alt={project.creator.display_name}
                        width={44}
                        height={44}
                        className="w-11 h-11 object-cover"
                      />
                    ) : (
                      project.creator.display_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-[var(--color-ink)]">About the creator</h2>
                      <Badge variant="amber">{creatorPmProfile.project_type}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)] mt-0.5">
                      {project.creator.display_name}
                    </p>
                    <p className="mt-3 text-sm text-[var(--color-ink-muted)] whitespace-pre-line leading-relaxed">
                      {creatorPmProfile.bio}
                    </p>

                    {(creatorPmProfile.company_name ||
                      creatorPmProfile.company_website ||
                      creatorPmProfile.linkedin_url) && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--color-ink-subtle)]">
                        {creatorPmProfile.company_name && (
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {creatorPmProfile.company_name}
                          </span>
                        )}
                        {creatorPmProfile.company_website && (
                          <a
                            href={creatorPmProfile.company_website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-amber-700 dark:hover:text-amber-300"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Website
                          </a>
                        )}
                        {creatorPmProfile.linkedin_url && (
                          <a
                            href={creatorPmProfile.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 hover:text-amber-700 dark:hover:text-amber-300"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    )}

                    <div className="mt-4 rounded-[var(--radius-btn)] border border-amber-200 dark:border-amber-700/60 bg-amber-100/50 dark:bg-amber-900/20 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)] mb-1">
                        What they are building
                      </p>
                      <p className="text-sm text-[var(--color-ink-muted)] whitespace-pre-line leading-relaxed">
                        {creatorPmProfile.project_description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Funding widget — inline on mobile only */}
            <div className="lg:hidden">
              <section className="max-w-2xl">
                <BackerEducationSection />
              </section>
              <FundingWidget project={project} />
            </div>

            {/* ── Milestones ── */}
            {milestoneView.milestones.length > 0 && (
              <MilestoneTimeline
                milestones={milestoneView.milestones}
                hasOpenDispute={milestoneView.hasOpenDispute}
                projectTitle={project.title}
                pledgeId={isCreator ? null : userPledgeId}
                openConcernCreatedAt={openConcernCreatedAt}
              />
            )}

            {/* ── Anchored sections (nav + Campaign, Rewards, FAQ, Updates, Comments) ── */}
            <ProjectPageSections
              projectId={project.id}
              projectStatus={project.status}
              creatorId={project.creator.id}
              creatorDisplayName={project.creator.display_name}
              currentUserId={user?.id ?? null}
              currentUserDisplayName={
                (user?.user_metadata?.full_name as string | undefined) ?? null
              }
              loginRedirectTo={`/projects/${slug}`}
              updates={updates}
              isBacker={isBacker}
              initialFeedback={feedback}
              descriptionHtml={campaign.html}
              descriptionHeadings={campaign.headings}
              rewards={project.rewards}
            />
          </div>

          {/* ── RIGHT COLUMN — sticky funding widget (desktop only) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-[calc(4rem+3.5rem)] self-start">
              <section className="max-w-2xl">
                <BackerEducationSection />
              </section>
              <FundingWidget project={project} />

              {/* Share below widget on desktop */}
              {project.status === "active" && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                  <ShareButtons
                    url={`${BASE_URL}/projects/${slug}`}
                    title={project.title}
                    compact
                  />
                </div>
              )}

              {/* Campaign section jumps */}
              <CampaignToc headings={campaign.headings} />
            </div>
          </div>
        </div>

        {/* Similar projects — reuse the same card as /explore so hover, progress
            bar, category pill, and ending-soon stamp all match. */}
        {similarProjects.length > 0 && (
          <section className="mt-16">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
                Similar projects
              </h2>
              {project.category && (
                <Link
                  href={`/explore?category=${project.category.slug}`}
                  className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline shrink-0"
                >
                  See all in {project.category.name} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProjects.map((item) => (
                <ProjectCard key={item.id} project={item} />
              ))}
            </div>
          </section>
        )}

        {/* Tail-of-page report affordance. Hidden for the creator (no
            self-reporting) and for anonymous viewers (logged-in only per
            policy — anonymous reports are mostly noise). */}
        {user && !isCreator && (
          <div className="mt-16 pt-6 border-t border-[var(--color-border)] flex justify-end">
            <ReportCampaignButton
              projectId={project.id}
              projectTitle={project.title}
            />
          </div>
        )}
      </div>
    </div>
  );
}
