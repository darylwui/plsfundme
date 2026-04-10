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
      <div className="py-24 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-[var(--color-ink-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
