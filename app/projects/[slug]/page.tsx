import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FundingWidget } from "@/components/projects/FundingWidget";
import { Badge } from "@/components/ui/badge";
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
  return {
    title: `${project.title} — plsfundme`,
    description: project.short_description,
    openGraph: {
      title: project.title,
      description: project.short_description,
      images: project.cover_image_url ? [project.cover_image_url] : [],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  // Block draft projects from public view (unless creator — handled by RLS)
  if (project.status === "draft") notFound();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to explore
        </Link>
      </div>

      {/* Hero image */}
      {project.cover_image_url && (
        <div className="relative w-full aspect-[2.5/1] mt-4 bg-[var(--color-surface-overlay)]">
          <Image
            src={project.cover_image_url}
            alt={project.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
              <div className="mt-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-brand-violet)]/20 flex items-center justify-center font-bold text-[var(--color-brand-violet)]">
                  {project.creator.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {project.creator.display_name}
                  </p>
                  <p className="text-xs text-[var(--color-ink-subtle)]">
                    Campaign ends {formatDate(project.deadline)}
                  </p>
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
                <h2 className="text-xl font-bold text-[var(--color-ink)] mb-4">
                  Stretch Goals
                </h2>
                <div className="flex flex-col gap-3">
                  {project.stretch_goals
                    .sort((a, b) => a.goal_amount_sgd - b.goal_amount_sgd)
                    .map((goal) => (
                      <div
                        key={goal.id}
                        className={`rounded-[var(--radius-card)] border-2 p-4 flex items-start gap-4 ${
                          goal.reached_at
                            ? "border-[var(--color-brand-lime)] bg-lime-50/50 dark:bg-lime-900/10"
                            : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
                        }`}
                      >
                        <div className="text-2xl">
                          {goal.reached_at ? "✅" : "🎯"}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-ink)]">
                            {goal.title}
                          </p>
                          {goal.description && (
                            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                              {goal.description}
                            </p>
                          )}
                          <p className="text-xs font-semibold text-[var(--color-brand-violet)] mt-1">
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
