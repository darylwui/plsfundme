import { createClient } from "@/lib/supabase/server";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Search } from "lucide-react";
import Link from "next/link";
import type { ProjectWithRelations } from "@/types/project";
import type { Category } from "@/types/project";

interface ExplorePageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export const metadata = {
  title: "Explore projects — plsfundme",
  description: "Discover exciting campaigns from Singapore entrepreneurs.",
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
    query = query.order("backer_count", { ascending: false });
  }

  const { data: projects } = await query.limit(24);
  const typedProjects = (projects as unknown as ProjectWithRelations[]) ?? [];

  const SORTS = [
    { key: "trending", label: "🔥 Trending" },
    { key: "newest", label: "✨ Newest" },
    { key: "ending_soon", label: "⏰ Ending soon" },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--color-ink)] tracking-tight">
          Explore projects
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-1">
          {typedProjects.length} active campaign{typedProjects.length !== 1 ? "s" : ""} right now
        </p>
      </div>

      {/* Search + filters row */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search */}
        <form method="GET" action="/explore" className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-subtle)]" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search projects…"
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)]"
          />
          {category && <input type="hidden" name="category" value={category} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
        </form>

        {/* Sort tabs */}
        <div className="flex gap-1 p-1 bg-[var(--color-surface-overlay)] rounded-[var(--radius-btn)] w-fit">
          {SORTS.map(({ key, label }) => (
            <Link
              key={key}
              href={buildUrl({ sort: key })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                sort === key
                  ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-ink)]"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildUrl({ category: undefined })}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              !category
                ? "bg-[var(--color-brand-violet)] text-white"
                : "bg-[var(--color-surface-overlay)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            All
          </Link>
          {(categories as Category[])?.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ category: cat.slug })}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                category === cat.slug
                  ? "bg-[var(--color-brand-violet)] text-white"
                  : "bg-[var(--color-surface-overlay)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <ProjectGrid
        projects={typedProjects}
        emptyMessage={
          q
            ? `No projects found for "${q}"`
            : "No active projects in this category yet."
        }
      />
    </div>
  );
}
