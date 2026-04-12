import Link from "next/link";
import { ArrowRight, Shield, Globe, Lock, TrendingUp, Star, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { Button } from "@/components/ui/button";
import { StatsBar } from "@/components/home/StatsBar";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PreFooterCTA } from "@/components/home/PreFooterCTA";
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
      `*, category:categories(*), creator:profiles!creator_id(id, display_name, avatar_url), rewards(*), stretch_goals(*)`
    )
    .eq("status", "active")
    .limit(12);

  if (filter === "trending") {
    query = query.order("backer_count", { ascending: false });
  } else if (filter === "newest") {
    query = query.order("launched_at", { ascending: false });
  } else if (filter === "ending_soon") {
    query = query.gt("deadline", new Date().toISOString()).order("deadline", { ascending: true });
  }

  const { data } = await query;
  return (data as unknown as ProjectWithRelations[]) ?? [];
}

async function getPlatformStats() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("amount_pledged_sgd, backer_count, status");

  const all = data ?? [];
  const totalRaisedSGD = all.reduce((sum, p) => sum + (p.amount_pledged_sgd ?? 0), 0);
  const totalBackers = all.reduce((sum, p) => sum + (p.backer_count ?? 0), 0);
  const activeCampaigns = all.filter((p) => p.status === "active").length;

  return { totalRaisedSGD, totalBackers, activeCampaigns, totalCampaigns: all.length };
}

function formatStatValue(n: number, prefix = "") {
  if (n === 0) return `${prefix}0`;
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
  return `${prefix}${n.toLocaleString()}`;
}

const TABS: { key: FilterTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "trending", label: "Trending", Icon: TrendingUp },
  { key: "newest", label: "Newest", Icon: Star },
  { key: "ending_soon", label: "Ending soon", Icon: Clock },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const { filter } = await searchParams;
  const activeFilter: FilterTab =
    filter === "newest" || filter === "ending_soon" ? filter : "trending";

  const [projects, platformStats] = await Promise.all([
    getProjects(activeFilter),
    getPlatformStats(),
  ]);

  const stats = [
    {
      value: `S${formatStatValue(platformStats.totalRaisedSGD, "$")}`,
      label: "Total raised",
    },
    {
      value: formatStatValue(platformStats.totalBackers),
      label: "Backers",
    },
    {
      value: String(platformStats.activeCampaigns),
      label: "Live campaigns",
    },
    {
      value: "5%",
      label: "Platform fee",
    },
  ];

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — headline + CTAs */}
            <div className="max-w-xl">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-[0.15em] font-medium mb-6">
                Made for Singapore entrepreneurs
              </div>

              <h1 className="text-[52px] md:text-[60px] font-black tracking-tight leading-[1.05]">
                <span className="block" style={{ color: "#98644F" }}>Empowering founders to</span>
                <span className="block" style={{ color: "#C68C5F" }}>get that bread.</span>
              </h1>

              <p className="mt-6 text-xl text-[var(--color-ink-muted)] max-w-lg leading-relaxed">
                Singapore&apos;s crowdfunding platform for entrepreneurs. Launch your campaign, find your backers, bring your idea to life.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/projects/create">
                  <Button size="lg" variant="inverse">
                    Start for free
                    <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button size="lg">
                    Explore projects
                    <span className="w-7 h-7 rounded-full bg-[var(--color-brand-violet)]/10 flex items-center justify-center shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Button>
                </Link>
              </div>

              {/* Trust bar */}
              <div className="mt-10 pt-8 border-t border-[var(--color-border)] flex flex-wrap gap-6 text-sm text-[var(--color-ink-muted)]">
                <div
                  className="flex items-center gap-2"
                  title="If the project doesn't hit its funding goal, backers are fully refunded. No risk."
                >
                  <Shield className="w-4 h-4 text-[var(--color-brand-violet)] shrink-0" />
                  All-or-nothing funding
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--color-brand-teal)] shrink-0" />
                  PayNow &amp; Credit Card
                </div>
                <div
                  className="flex items-center gap-2"
                  title="Funds are held in escrow and only released to creators once their goal is met."
                >
                  <Lock className="w-4 h-4 text-[var(--color-brand-amber)] shrink-0" />
                  Secured escrow transactions
                </div>
              </div>
            </div>

            {/* Right — platform stats card */}
            <div className="hidden lg:flex justify-end">
              <div className="w-full max-w-sm">
                {/* Outer bezel */}
                <div className="p-[3px] rounded-[calc(var(--radius-card)+4px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card-hover)]">
                  <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] overflow-hidden">

                    {/* Card header */}
                    <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-lime)] animate-pulse" />
                        <span className="text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--color-ink-subtle)]">
                          Platform at a glance
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-ink-subtle)]">Live data · updated in real time</p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 divide-x divide-y divide-[var(--color-border)]">
                      <div className="p-5 flex flex-col gap-1">
                        <span className="font-mono font-black text-2xl text-[var(--color-ink)]">
                          S{formatStatValue(platformStats.totalRaisedSGD, "$")}
                        </span>
                        <span className="text-xs text-[var(--color-ink-muted)]">Total raised</span>
                      </div>
                      <div className="p-5 flex flex-col gap-1">
                        <span className="font-mono font-black text-2xl text-[var(--color-ink)]">
                          {formatStatValue(platformStats.totalBackers)}
                        </span>
                        <span className="text-xs text-[var(--color-ink-muted)]">Backers</span>
                      </div>
                      <div className="p-5 flex flex-col gap-1">
                        <span className="font-mono font-black text-2xl text-[var(--color-ink)]">
                          {platformStats.activeCampaigns}
                        </span>
                        <span className="text-xs text-[var(--color-ink-muted)]">Live campaigns</span>
                      </div>
                      <div className="p-5 flex flex-col gap-1">
                        <span className="font-mono font-black text-2xl text-[var(--color-brand-lime)]">5%</span>
                        <span className="text-xs text-[var(--color-ink-muted)]">Platform fee</span>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-6 py-4 bg-[var(--color-surface-raised)] border-t border-[var(--color-border)] flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[var(--color-brand-violet)] shrink-0" />
                      <span className="text-xs text-[var(--color-ink-muted)]">
                        All-or-nothing · funds held in escrow
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating label below card */}
                <p className="text-center text-xs text-[var(--color-ink-subtle)] mt-4">
                  No risk to backers — ever.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Decorative blob */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[600px] bg-gradient-to-bl from-amber-200/50 to-orange-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"
        />
      </section>

      {/* ── Stats band ───────────────────────────────────────── */}
      <StatsBar stats={stats} />

      {/* ── Discovery section ────────────────────────────────── */}
      <section className="bg-[var(--color-surface-raised)] border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* Filter tabs */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex gap-1 p-1 bg-[var(--color-surface-overlay)] rounded-[var(--radius-btn)] border border-[var(--color-border)]">
              {TABS.map(({ key, label, Icon }) => (
                <Link
                  key={key}
                  href={`/?filter=${key}`}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[calc(var(--radius-btn)-2px)] text-sm font-semibold transition-colors duration-[150ms] ${
                    activeFilter === key
                      ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-ink)]"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
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

      {/* ── How it works ─────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── Pre-footer CTA ───────────────────────────────────── */}
      <PreFooterCTA />
    </div>
  );
}
