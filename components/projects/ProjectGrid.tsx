import { Search } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import type { ProjectWithRelations } from "@/types/project";

interface ProjectGridProps {
  projects: ProjectWithRelations[];
  emptyMessage?: string;
}

export function ProjectGrid({
  projects,
  emptyMessage = "No projects found.",
}: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="py-24 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center">
          <Search className="w-6 h-6 text-[var(--color-ink-subtle)]" />
        </div>
        <p className="text-[var(--color-ink-muted)] max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, index) => (
        <div
          key={project.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
}
