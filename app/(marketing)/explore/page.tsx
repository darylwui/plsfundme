import { createClient } from "@/lib/supabase/server";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { FoundingCohortBanner } from "@/components/marketing/FoundingCohortBanner";
import { Search, TrendingUp, Star, Clock, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ProjectWithRelations } from "@/types/project";
import type { Category } from "@/types/project";

interface ExplorePageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export const metadata = {
  title: "Explore projects — get that bread",
  description:
    "Browse crowdfunding campaigns from Singapore entrepreneurs on get that bread. Back ideas, rewards, and makers you believe in.",
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q, category, sort = "trending" } = await searchParams;
  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  // Build projects query
  let query = supabase
    .from("projects")
    .select(
      "*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)"
    )
    .eq("status", "active");

  if (q) {
    query = query.or(`title.ilike.%${q}%,short_description.ilike.%${q}%`);
  }

  if (category) {
    const cat = (categories as Category[])?.find((c) => c.slug === category);
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (sort === "newest") {
    query = query.order("launched_at", { ascending: false });
  } else if (sort === "ending_soon") {
    query = query.gt("deadline", new Date().toISOString()).order("deadline", { ascending: true });
  } else {
    // trending: featured projects float to the top, then by backer_count desc
    query = query
      .order("is_featured", { ascending: false })
      .order("backer_count", { ascending: false });
  }

  const { data: projects } = await query.limit(24);
  const typedProjects = (projects as unknown as ProjectWithRelations[]) ?? [];

  const SORTS = [
    { key: "trending", label: "Trending", Icon: TrendingUp },
    { key: "newest", label: "Newest", Icon: Star },
    { key: "ending_soon", label: "Ending soon", Icon: Clock },
  ];

  function buildUrl(params: Record<string, string | undefined>) {
    const merged = { q, category, sort, ...params };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/explore${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      {/* Page hero */}
      <section className="bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-xs uppercase tracking-[0.12em] font-medium mb-4">
            Singapore campaigns
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--color-ink)]">
                Explore projects
              </h1>
              <p className="text-[var(--color-ink-muted)] mt-1.5">
                <span className="font-mono font-bold text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)]">{typedProjects.length}</span> active campaign{typedProjects.length !== 1 ? "s" : ""} live right now
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founding cohort banner — self-hides until 5+ creators
          have active/funded campaigns. */}
      <FoundingCohortBanner />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Search + filters row */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search */}
        <form method="GET" action="/explore" className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-subtle)]" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search projects…"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
          />
          {category && <input type="hidden" name="category" value={category} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
        </form>

        {/* Sort tabs */}
        <div className="flex flex-wrap gap-2">
          {SORTS.map(({ key, label, Icon }) => (
            <Link
              key={key}
              href={buildUrl({ sort: key })}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-[var(--radius-btn)] text-sm font-semibold transition-colors duration-[150ms] border ${
                sort === key
                  ? "bg-[var(--color-brand-crust)] text-white border-[var(--color-brand-crust)]"
                  : "bg-transparent text-[var(--color-brand-crust-dark)] border-[var(--color-border)] hover:border-[var(--color-brand-crust)] hover:text-[var(--color-brand-crust)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildUrl({ category: undefined })}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-[150ms] border ${
              !category
                ? "bg-[var(--color-brand-crust)] text-white border-[var(--color-brand-crust)]"
                : "bg-transparent text-[var(--color-brand-crust-dark)] border-[var(--color-border)] hover:border-[var(--color-brand-crust)] hover:text-[var(--color-brand-crust)]"
            }`}
          >
            All
          </Link>
          {(categories as Category[])?.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ category: cat.slug })}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-[150ms] border ${
                category === cat.slug
                  ? "bg-[var(--color-brand-crust)] text-white border-[var(--color-brand-crust)]"
                  : "bg-transparent text-[var(--color-brand-crust-dark)] border-[var(--color-border)] hover:border-[var(--color-brand-crust)] hover:text-[var(--color-brand-crust)]"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Empty-state branching:
          - No filter + no projects → founding-cohort recruitment block
            (same theme as the homepage; this is also a landing-page moment
            for visitors who arrive directly at /explore)
          - Active search/category filter + no projects → simple "no results"
            (filtered context where conversion CTA would feel pushy) */}
      {typedProjects.length === 0 && !q && !category ? (
        <div className="py-20 sm:py-28 flex flex-col items-center text-center px-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 border border-[var(--color-brand-crust)]/30 flex items-center justify-center mb-5">
            <Sparkles className="w-6 h-6 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] mb-3">
            Founding cohort
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-ink)] mb-3 max-w-xl">
            Campaigns are coming. Want yours to be one of them?
          </h2>
          <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-md mb-6">
            We&apos;re handpicking Singapore&apos;s founding cohort right now. Apply
            to launch your campaign and get featured here on day one.
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
      ) : (
        <ProjectGrid
          projects={typedProjects}
          emptyMessage={
            q
              ? `No projects found for "${q}"`
              : "No active projects in this category yet."
          }
        />
      )}
    </div>
    </div>
  );
}
