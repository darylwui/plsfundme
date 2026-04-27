"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Star, Clock, Sparkles } from "lucide-react";
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

        {/* Projects grid with fade transition. Empty state on the homepage
            is rendered inline as a creator-conversion moment rather than
            falling through to ProjectGrid's generic search-icon empty state
            — every visitor who lands here without active campaigns is a
            recruitment opportunity for the founding cohort. */}
        <div
          className={`transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}
        >
          {projects.length === 0 ? (
            <FoundingCohortEmptyState />
          ) : (
            <ProjectGrid projects={projects} />
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Homepage empty state — shown when there are no active projects yet.
 * Pre-launch this is the default view, so we lean into "founding cohort"
 * framing: visitors see opportunity, not absence. Primary CTA pushes
 * creators toward applying; secondary link gives backers a path to learn
 * more without feeling pitched at.
 */
function FoundingCohortEmptyState() {
  return (
    <div className="py-20 sm:py-28 flex flex-col items-center text-center px-4">
      <div className="w-14 h-14 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 border border-[var(--color-brand-crust)]/30 flex items-center justify-center mb-5">
        <Sparkles className="w-6 h-6 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-ink)] mb-3 max-w-xl">
        Be one of our first creators
      </h2>
      <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-md mb-6">
        We&apos;re handpicking Singapore&apos;s founding cohort right now. Apply
        to launch your campaign and get featured at the top of the homepage on
        day one.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
        <Link
          href="/apply/creator"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Apply to launch <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/for-creators"
          className="text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline-offset-4 hover:underline transition-colors"
        >
          or learn how it works
        </Link>
      </div>
    </div>
  );
}
