import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock, CheckCircle2, Circle, CalendarDays } from "lucide-react";
import { ShareButtons } from "@/components/sharing/ShareButtons";

const BASE_URL = "https://getthatbread.vercel.app";
import { createClient } from "@/lib/supabase/server";
import { FundingWidget } from "@/components/projects/FundingWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/dates";
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
      url: `https://getthatbread.vercel.app/projects/${slug}`,
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

  // Check if current user is the creator so we can show Edit button
  const { data: { user } } = await supabase.auth.getUser();
  const isCreator = user?.id === project.creator.id;

  // Block non-public statuses
  if (project.status === "draft" && !isCreator) notFound();
  if (project.status === "removed") notFound();

  // Show a pending review banner for creator; block public
  const isPendingReview = project.status === "pending_review";
  if (isPendingReview && !isCreator) notFound();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
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

      {/* Pending review banner */}
      {isPendingReview && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span><strong>Under review</strong> — Your campaign is pending admin approval and is not yet visible to the public.</span>
        </div>
      )}

      {/* Hero image */}
      {project.cover_image_url && (
        <div className="relative w-full aspect-[21/9] mt-4 bg-[var(--color-surface-overlay)] overflow-hidden">
          <Image
            src={project.cover_image_url}
            alt={project.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
      )}

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* Left: content */}
          <div className="flex flex-col gap-8 min-w-0">
            {/* Header */}
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

              {/* Creator info */}
              <div className="mt-6 inline-flex items-center gap-3 px-4 py-3 rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                <div className="w-10 h-10 rounded-full bg-[var(--color-brand-violet)]/15 ring-1 ring-[var(--color-border)] flex items-center justify-center font-bold text-[var(--color-brand-violet)] shrink-0">
                  {project.creator.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-[var(--color-ink-subtle)] uppercase tracking-[0.1em] font-medium">Campaign by</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {project.creator.display_name}
                  </p>
                </div>
                <div className="w-px h-8 bg-[var(--color-border)] mx-1" />
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Ends {formatDate(project.deadline)}
                </div>
              </div>
            </div>

            {/* Description */}
            <div
              className="prose prose-sm max-w-none text-[var(--color-ink)] prose-headings:text-[var(--color-ink)] prose-a:text-[var(--color-brand-violet)]"
              dangerouslySetInnerHTML={{ __html: project.full_description }}
            />

            {/* Stretch goals */}
            {project.stretch_goals.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[var(--color-ink)] mb-4 tracking-tight">
                  Stretch Goals
                </h2>
                <div className="flex flex-col gap-3">
                  {project.stretch_goals
                    .sort((a, b) => a.goal_amount_sgd - b.goal_amount_sgd)
                    .map((goal) => (
                      <div
                        key={goal.id}
                        className={`rounded-[var(--radius-card)] border-2 p-5 flex items-start gap-4 ${
                          goal.reached_at
                            ? "border-[var(--color-brand-lime)] bg-lime-50/50 dark:bg-lime-900/10"
                            : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
                        }`}
                      >
                        {goal.reached_at ? (
                          <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-lime)] shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-[var(--color-ink-subtle)] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-[var(--color-ink)]">
                            {goal.title}
                          </p>
                          {goal.description && (
                            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                              {goal.description}
                            </p>
                          )}
                          <p className="text-xs font-semibold font-mono text-[var(--color-brand-violet)] mt-1.5">
                            Unlocks at S${goal.goal_amount_sgd.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky funding widget */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <FundingWidget project={project} />
          </div>
        </div>
      </div>
    </div>
  );
}
