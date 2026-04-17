import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { FundingProgressBar } from "./FundingProgressBar";
import { daysRemaining } from "@/lib/utils/dates";
import type { ProjectWithRelations } from "@/types/project";

interface ProjectCardProps {
  project: ProjectWithRelations;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const days = daysRemaining(project.deadline);
  const isEndingSoon = days <= 5 && days > 0;

  const initial = project.title.charAt(0).toUpperCase();

  return (
    <Link href={`/projects/${project.slug}`} className="group flex w-full h-full">
      {/* Double-bezel outer shell */}
      <div className="flex-1 h-full p-[3px] bg-[var(--color-surface-overlay)] rounded-[calc(var(--radius-card)+3px)] ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[0_12px_40px_0_rgba(146,64,14,0.2)] hover:-translate-y-1 transition-[box-shadow,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
        {/* Inner card */}
        <article className="h-full bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] overflow-hidden flex flex-col">
          {/* Cover image */}
          <div className="relative aspect-video bg-[var(--color-surface-overlay)] overflow-hidden">
            {project.cover_image_url ? (
              <Image
                src={project.cover_image_url}
                alt={project.title}
                fill
                className="card-img-zoom object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20">
                <span className="text-5xl font-black text-[var(--color-brand-violet)]/30 select-none">
                  {initial}
                </span>
              </div>
            )}

            {/* Bread stamp — featured */}
            {project.is_featured && (
              <span className="absolute top-2 left-2 z-10 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 dark:bg-amber-500 text-amber-900 animate-subtle-pulse">
                🍞 Team pick
              </span>
            )}

            {/* Badges overlay */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              {project.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-[var(--color-brand-violet)] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-0">
                  {project.category.name}
                </span>
              )}
              {isEndingSoon && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                  <Clock className="w-3 h-3" />
                  Ending soon
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col gap-3 flex-1">
            {/* Creator */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-violet)]/15 ring-1 ring-[var(--color-border)] flex items-center justify-center text-xs font-bold text-[var(--color-brand-violet)] shrink-0">
                {project.creator.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm md:text-xs text-[var(--color-ink-muted)] truncate">
                {project.creator.display_name}
              </span>
            </div>

            {/* Title + description */}
            <div className="flex-1 min-h-[5.5rem] sm:min-h-[5rem]">
              <h3 className="font-bold text-[var(--color-ink)] leading-snug line-clamp-2 group-hover:text-[var(--color-brand-violet)] transition-colors duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                {project.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)] line-clamp-2">
                {project.short_description}
              </p>
            </div>

            {/* Progress */}
            <FundingProgressBar
              pledged={project.amount_pledged_sgd}
              goal={project.funding_goal_sgd}
              deadline={project.deadline}
              backerCount={project.backer_count}
              size="sm"
            />
          </div>
        </article>
      </div>
    </Link>
  );
}
