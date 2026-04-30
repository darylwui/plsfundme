import { createClient } from "@/lib/supabase/server";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Search, TrendingUp, Star, Clock, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";
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

  // Branch the empty-state CTA on the viewer's creator status. Showing
  // "Apply to launch" to a creator who already applied (or got approved)
  // is the kind of paper-cut that breaks platform-trust on day one. Falls
  // back to the original "Apply" CTA for unauthed visitors and anyone
  // who hasn't applied yet.
  const { data: { user } } = await supabase.auth.getUser();
  type CreatorStatus = "approved" | "pending_review" | "needs_info" | "rejected";
  let creatorStatus: CreatorStatus | null = null;
  if (user) {
    const { data: cp } = await supabase
      .from("creator_profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();
    const raw = cp?.status;
    if (
      raw === "approved" ||
      raw === "pending_review" ||
      raw === "needs_info" ||
      raw === "rejected"
    ) {
      creatorStatus = raw;
    }
  }

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
    <div className="bg-[var(--color-surface)]">
      {/* Page hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="top-left" intensity={0.16} size="600px 300px" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Eyebrow variant="brand" className="mb-3">
            Explore
          </Eyebrow>
          <h1 className="font-black tracking-[-0.03em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
            Explore projects
          </h1>
          <p className="text-[var(--color-ink-muted)] mt-1.5">
            <span className="font-mono font-bold text-[var(--color-brand-crust)]">{typedProjects.length}</span> active campaign{typedProjects.length !== 1 ? "s" : ""} live right now
          </p>
        </div>
      </section>

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
          {creatorStatus === "approved" ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-ink)] mb-3 max-w-xl">
                You&apos;re cleared to launch
              </h2>
              <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-md mb-6">
                There aren&apos;t any campaigns live yet — yours could be the
                first. Featured spot on this page goes to early creators on
                day one.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
                <Link
                  href="/projects/create"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Start your campaign <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/for-creators/launch-guide"
                  className="text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline-offset-4 hover:underline transition-colors"
                >
                  or read the launch checklist
                </Link>
              </div>
            </>
          ) : creatorStatus === "pending_review" || creatorStatus === "needs_info" ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-ink)] mb-3 max-w-xl">
                Your application is in review
              </h2>
              <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-md mb-6">
                {creatorStatus === "needs_info"
                  ? "A reviewer asked a follow-up question — answer it on your application page to keep things moving."
                  : "We're reviewing your creator application — usually 1–2 business days. You'll get an email when there's an update."}
              </p>
              <Link
                href="/dashboard/application"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                View application status <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-ink)] mb-3 max-w-xl">
                Be one of our first creators
              </h2>
              <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-md mb-6">
                We&apos;re handpicking Singapore&apos;s first founders right now. Apply
                to launch your campaign and get featured here on day one.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
                <Link
                  href={creatorStatus === "rejected" ? "/dashboard/application" : "/apply/creator"}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  {creatorStatus === "rejected" ? "View feedback & re-apply" : "Apply to launch"} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/for-creators"
                  className="text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline-offset-4 hover:underline transition-colors"
                >
                  or learn how it works
                </Link>
              </div>
            </>
          )}
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
