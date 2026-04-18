import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock, CalendarDays, Building2, Globe, Link2 } from "lucide-react";
import { ShareButtons } from "@/components/sharing/ShareButtons";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { FundingWidget } from "@/components/projects/FundingWidget";
import { FeaturedSticker } from "@/components/projects/FeaturedSticker";
import { ProjectPageSections } from "@/components/projects/ProjectPageSections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysRemaining, formatDate } from "@/lib/utils/dates";
import { toEmbedUrl } from "@/lib/utils/video-embed";
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

  return (data as unknown as ProjectWithRelations) ?? null;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  const ogImages = project.cover_image_url
    ? [{ url: project.cover_image_url, width: 1200, height: 630, alt: project.title }]
    : [{ url: "/og-default.png", width: 1200, height: 630, alt: "get that bread" }];

  return {
    title: project.title,
    description: project.short_description,
    openGraph: {
      title: `${project.title} — get that bread`,
      description: project.short_description,
      url: `${BASE_URL}/projects/${slug}`,
      type: "website",
      locale: "en_SG",
      siteName: "get that bread",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.short_description,
      images: ogImages.map((img) => img.url),
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
  const [{ data: updatesRaw }, { data: feedbackRaw }, backerCheck] = await Promise.all([
    supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_feedback")
      .select("id, project_id, author_id, parent_id, message, created_at, updated_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    user
      ? supabase
          .from("pledges")
          .select("id", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("backer_id", user.id)
          .not("status", "in", "(cancelled,failed,released,refunded)")
      : Promise.resolve({ count: 0 }),
  ]);

  const service = createServiceClient();
  const { data: creatorPmProfile } = await service
    .from("project_manager_profiles")
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

  const isBacker = isCreator || ((backerCheck as { count: number | null }).count ?? 0) > 0;
  const daysLeft = daysRemaining(project.deadline);

  const { data: similarRaw } = await supabase
    .from("projects")
    .select(
      "id, title, slug, short_description, cover_image_url, amount_pledged_sgd, funding_goal_sgd, backer_count, deadline"
    )
    .eq("category_id", project.category_id)
    .neq("id", project.id)
    .in("status", ["active", "funded"])
    .order("created_at", { ascending: false })
    .limit(3);

  const similarProjects = (similarRaw ?? []) as {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    cover_image_url: string | null;
    amount_pledged_sgd: number;
    funding_goal_sgd: number;
    backer_count: number;
    deadline: string;
  }[];

  // Status guards
  if (project.status === "draft" && !isCreator) notFound();
  if (project.status === "removed") notFound();

  const isPendingReview = project.status === "pending_review";
  if (isPendingReview && !isCreator) notFound();

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
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to explore
        </Link>
        {isCreator && (
          <div className="flex items-center gap-2">
            {project.status === "active" && (
              <ShareButtons
                url={`${BASE_URL}/projects/${slug}`}
                title={project.title}
                compact
              />
            )}
            <Link href={`/projects/${slug}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="w-3.5 h-3.5" />
                Edit campaign
              </Button>
            </Link>
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
                      <FeaturedSticker className="absolute bottom-4 left-4 z-10" size={112} />
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
                      <FeaturedSticker className="absolute bottom-4 left-4 z-10" size={112} />
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
              <FundingWidget project={project} />
            </div>

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
              descriptionHtml={project.full_description}
              rewards={project.rewards}
            />
          </div>

          {/* ── RIGHT COLUMN — sticky funding widget (desktop only) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-[calc(4rem+3.5rem)] self-start">
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
            </div>
          </div>
        </div>

        {/* Similar projects */}
        {similarProjects.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight mb-4">
              Similar projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarProjects.map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.slug}`}
                  className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:shadow-[var(--shadow-card)] transition-shadow"
                >
                  <div className="relative aspect-[16/10] bg-[var(--color-surface-overlay)]">
                    {item.cover_image_url ? (
                      <Image
                        src={item.cover_image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-[var(--color-ink)] line-clamp-1">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-ink-muted)] line-clamp-2">
                      {item.short_description}
                    </p>
                    <div className="mt-2 text-xs text-[var(--color-ink-subtle)]">
                      {item.backer_count} backers · {daysRemaining(item.deadline)}d left
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
