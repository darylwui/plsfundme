"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Star, Clock } from "lucide-react";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import type { ProjectWithRelations } from "@/types/project";

type FilterTab = "trending" | "newest" | "ending_soon";

interface DiscoverySectionProps {
  trending: ProjectWithRelations[];
  newest: ProjectWithRelations[];
  endingSoon: ProjectWithRelations[];
  initialFilter: FilterTab;
}

const TABS: { key: FilterTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "trending", label: "Trending", Icon: TrendingUp },
  { key: "newest", label: "Newest", Icon: Star },
  { key: "ending_soon", label: "Ending soon", Icon: Clock },
];

const FILTER_MAP: Record<FilterTab, ProjectWithRelations[]> = {};

export function DiscoverySection({
  trending,
  newest,
  endingSoon,
  initialFilter,
}: DiscoverySectionProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>(initialFilter);
  const [isPending, startTransition] = useTransition();

  const filterMap: Record<FilterTab, ProjectWithRelations[]> = {
    trending,
    newest,
    ending_soon: endingSoon,
  };

  const handleFilterChange = (newFilter: FilterTab) => {
    startTransition(() => {
      setActiveFilter(newFilter);
    });
  };

  const projects = filterMap[activeFilter];

  return (
    <section className="bg-[var(--color-surface-raised)] border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-14">
        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex gap-1 p-1 bg-[var(--color-surface-overlay)] rounded-[var(--radius-btn)] border border-[var(--color-border)]">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[calc(var(--radius-btn)-2px)] text-sm font-semibold transition-colors duration-[150ms] ${
                  activeFilter === key
                    ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <Link
            href="/explore"
            className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Projects grid with fade transition */}
        <div
          className={`transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}
        >
          <ProjectGrid
            projects={projects}
            emptyMessage="No active projects yet — be the first to launch one!"
          />
        </div>
      </div>
    </section>
  );
}
