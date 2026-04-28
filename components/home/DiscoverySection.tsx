"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Star, Clock, Rocket, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { BackerNotifyForm } from "@/components/home/BackerNotifyForm";
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

function FoundingCohortEmptyState() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.65, ease: [0.21, 0.62, 0.35, 1] }}
      className="py-16 sm:py-24"
    >
      {/* Eyebrow */}
      <div className="flex justify-center mb-10">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-crust)]/10 dark:bg-[var(--color-brand-crust-dark)]/20 border border-[var(--color-brand-crust)]/20 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-[11px] font-bold uppercase tracking-[0.16em]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-crust)] animate-pulse shrink-0" />
          First founders · Limited spots
        </span>
      </div>

      {/* Headline */}
      <div className="text-center mb-12 max-w-2xl mx-auto px-4">
        <h2 className="text-3xl sm:text-[42px] font-black tracking-tight text-[var(--color-ink)] leading-[1.08] mb-4">
          Singapore&apos;s first wave of<br className="hidden sm:block" /> campaigns is launching soon.
        </h2>
        <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-md mx-auto">
          We&apos;re handpicking our first founders now. Join before launch
          to get first-mover advantage — as a creator or a backer.
        </p>
      </div>

      {/* Asymmetric bento — 3/5 creator + 2/5 backer */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 max-w-2xl mx-auto px-4 sm:px-0">

        {/* Creator card — gradient border bezel */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.12, ease: [0.21, 0.62, 0.35, 1] }}
          className="sm:col-span-3 p-[2px] rounded-[calc(var(--radius-card)+2px)] bg-gradient-to-br from-[var(--color-brand-golden)] to-[var(--color-brand-crust)]"
        >
          <div className="h-full rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-none p-7 flex flex-col gap-5">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-brand-crust)] shadow-[var(--shadow-cta)] flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-crust)] mb-1.5">
                For creators
              </p>
              <h3 className="font-black text-[var(--color-ink)] text-xl leading-snug">
                Launch your campaign.<br />Get featured on day one.
              </h3>
            </div>
            <Link
              href="/apply/creator"
              className="group mt-auto inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white font-bold text-sm transition-all duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.98]"
            >
              Apply to launch
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Backer card — subtle border bezel */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.22, ease: [0.21, 0.62, 0.35, 1] }}
          className="sm:col-span-2 p-[2px] rounded-[calc(var(--radius-card)+2px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
        >
          <div className="h-full rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-none p-7 flex flex-col gap-5">
            <div className="w-11 h-11 rounded-xl bg-[var(--color-brand-crumb)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[var(--color-brand-crust)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-subtle)] mb-1.5">
                For backers
              </p>
              <h3 className="font-black text-[var(--color-ink)] text-xl leading-snug">
                Be the first to back.
              </h3>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                Get notified when the first campaigns go live.
              </p>
            </div>
            <div className="mt-auto">
              <BackerNotifyForm />
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
