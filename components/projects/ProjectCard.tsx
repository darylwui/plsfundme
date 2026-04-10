import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FundingProgressBar } from "./FundingProgressBar";
import { daysRemaining } from "@/lib/utils/dates";
import type { ProjectWithRelations } from "@/types/project";

interface ProjectCardProps {
  project: ProjectWithRelations;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const days = daysRemaining(project.deadline);
  const isEndingSoon = days <= 5 && days > 0;

  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <article className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Cover image */}
        <div className="relative aspect-video bg-[var(--color-surface-overlay)] overflow-hidden">
          {project.cover_image_url ? (
            <Image
              src={project.cover_image_url}
              alt={project.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-30">🚀</span>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {project.category && (
              <Badge variant="violet">{project.category.name}</Badge>
            )}
            {isEndingSoon && (
              <Badge variant="coral">
                <Clock className="w-3 h-3" />
                Ending soon
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3 flex-1">
          {/* Creator */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-brand-violet)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-brand-violet)] shrink-0">
              {project.creator.display_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-[var(--color-ink-muted)] truncate">
              {project.creator.display_name}
            </span>
          </div>

          {/* Title + description */}
          <div className="flex-1">
            <h3 className="font-bold text-[var(--color-ink)] leading-snug line-clamp-2 group-hover:text-[var(--color-brand-violet)] transition-colors">
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
    </Link>
  );
}
