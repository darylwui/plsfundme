import Link from "next/link";
import { ArrowRight, Shield, Globe, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Button } from "@/components/ui/button";
import type { ProjectWithRelations } from "@/types/project";

type FilterTab = "trending" | "newest" | "ending_soon";

interface HomePageProps {
  searchParams: Promise<{ filter?: string }>;
}

async function getProjects(filter: FilterTab): Promise<ProjectWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
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
    .eq("status", "active")
    .limit(12);

  if (filter === "trending") {
    query = query.order("backer_count", { ascending: false });
  } else if (filter === "newest") {
    query = query.order("launched_at", { ascending: false });
  } else if (filter === "ending_soon") {
    query = query
      .gt("deadline", new Date().toISOString())
      .order("deadline", { ascending: true });
  }

  const { data } = await query;
  return (data as unknown as ProjectWithRelations[]) ?? [];
}

const TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: "trending", label: "Trending", emoji: "🔥" },
  { key: "newest", label: "Newest", emoji: "✨" },
  { key: "ending_soon", label: "Ending soon", emoji: "⏰" },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const { filter } = await searchParams;
  const activeFilter: FilterTab =
    filter === "newest" || filter === "ending_soon" ? filter : "trending";

  const projects = await getProjects(activeFilter);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-semibold mb-4">
              🍞 Made for Singapore entrepreneurs
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
              <span className="text-[var(--color-brand-violet)]">
                Fund the future.
              </span>
            </h1>
            <p className="mt-3 text-2xl md:text-3xl font-black tracking-tight" style={{ color: "#F2C480" }}>
              get that bread.
            </p>
            <p className="mt-4 text-xl text-[var(--color-ink-muted)] max-w-xl leading-relaxed">
              Singapore&apos;s crowdfunding platform for entrepreneurs. Launch
              your campaign, find your backers, bring your idea to life.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/projects/create">
                <Button size="lg" variant="inverse">
                  Start your campaign
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg">
                  Explore projects
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-[var(--color-ink-muted)]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--color-brand-violet)]" />
                All-or-nothing funding
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--color-brand-teal)]" />
                PayNow &amp; Credit Card
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--color-brand-amber)]" />
                Secured transactions
              </div>
            </div>
          </div>
        </div>

        {/* Decorative warm gradient blob */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[600px] bg-gradient-to-bl from-amber-200/60 to-orange-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"
        />
      </section>

      {/* Discovery section */}
      <section className="bg-[var(--color-surface-raised)] border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex gap-1 p-1 bg-[var(--color-surface-overlay)] rounded-[var(--radius-btn)]">
            {TABS.map(({ key, label, emoji }) => (
              <Link
                key={key}
                href={`/?filter=${key}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  activeFilter === key
                    ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {emoji} {label}
              </Link>
            ))}
          </div>
          <Link
            href="/explore"
            className="text-sm font-semibold text-[var(--color-brand-violet)] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ProjectGrid
          projects={projects}
          emptyMessage="No active projects yet — be the first to launch one!"
        />
        </div>
      </section>
    </div>
  );
}
