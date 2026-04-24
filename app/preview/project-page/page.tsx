"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Lock, Megaphone, MessageCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FundingProgressBar } from "@/components/projects/FundingProgressBar";
import { RewardTierCard } from "@/components/projects/RewardTierCard";
import type { Reward } from "@/types/reward";

// ─── Mock data ───────────────────────────────────────────────────────────────

const DEADLINE = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString();

const MOCK_CAMPAIGN_HTML = `
<h2 id="section-what-is-this">What is Mochi Cloud?</h2>
<p>Mochi Cloud is a smart, compostable packaging solution for hawker centres and food courts. We replace single-use styrofoam and plastic with packaging made from cassava starch and rice bran — 100% certified home-compostable in 90 days.</p>
<p>We've spent two years developing a material that is heat-resistant, leak-proof, and strong enough to handle Singapore's soupiest dishes. Our pilot at Tiong Bahru Market showed a <strong>34% reduction</strong> in plastic waste per stall, per week.</p>

<h2 id="section-the-problem">The problem</h2>
<p>Singapore generates over <strong>900,000 tonnes</strong> of plastic waste annually. Less than 6% is recycled. Hawker centres are a significant contributor — and they have almost no alternatives that are affordable at scale.</p>
<p>Current "eco" alternatives either fall apart in humid climates, can't handle hot liquids, or cost 4–6x more than styrofoam. Hawkers can't absorb that cost. That's the gap we're closing.</p>

<h2 id="section-how-it-works">How it works</h2>
<p>Our packaging is produced locally at a contract facility in Tuas. The cassava base is sourced from regional suppliers with fair-trade agreements. The surface coating uses a water-based barrier layer — no microplastics, no PFAS.</p>
<p>Each box degrades completely in home compost within 90 days. No special industrial facility needed.</p>

<h3 id="section-certifications">Certifications</h3>
<p>We hold the TÜV Austria OK Compost Home certificate, SIRIM Malaysia eco-label, and are currently processing SFA Singapore compliance for food-contact approval.</p>

<h2 id="section-who-is-shipping">When will orders ship?</h2>
<p>We're targeting Q3 2025 for first production run. Backers who pledge by end of campaign receive a <strong>15% founding backer discount</strong> on their first refill order. Sticker packs ship within 14 days of campaign close.</p>

<h2 id="section-how-is-my-money-used">How is my money used?</h2>
<p>Every dollar goes directly toward our first 500,000-unit production run. This gets our per-unit cost below what hawkers pay for styrofoam today. We need the volume to make unit economics work — that's why the campaign goal is what it is.</p>

<h3 id="section-breakdown">Breakdown</h3>
<p>Production tooling and setup: 45% · Raw material inventory: 30% · QA testing and certification: 15% · Logistics and cold storage: 10%</p>

<h2 id="section-are-you-profitable">Are you profitable?</h2>
<p>Not yet — we're pre-revenue. This campaign is our first public fundraise. We have letters of intent from three hawker centre operators covering 12 stalls. Once we clear SFA approval, those convert to purchase orders.</p>
`;

const MOCK_REWARDS: Reward[] = [
  {
    id: "reward-1",
    project_id: "project-1",
    title: "Founding Supporter",
    description:
      "Your name in the wall of thanks on our website, a digital certificate, and first access to our newsletter on compostable innovation.",
    minimum_pledge_sgd: 10,
    is_active: true,
    max_backers: null,
    claimed_count: 47,
    image_url: null,
    estimated_delivery_date: null,
    includes_physical_item: false,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    display_order: 0,
  },
  {
    id: "reward-2",
    project_id: "project-1",
    title: "Starter Pack",
    description:
      "50 Mochi Cloud containers (mixed sizes) shipped to your door, plus exclusive founding backer sticker set and digital certificate.",
    minimum_pledge_sgd: 35,
    is_active: true,
    max_backers: 200,
    claimed_count: 63,
    image_url: null,
    estimated_delivery_date: "2025-09-01T00:00:00Z",
    includes_physical_item: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    display_order: 1,
  },
  {
    id: "reward-3",
    project_id: "project-1",
    title: "Hawker Hero Bundle",
    description:
      "500 containers + priority delivery + your business name featured on our case study page. Great for eco-conscious F&B operators.",
    minimum_pledge_sgd: 120,
    is_active: true,
    max_backers: 50,
    claimed_count: 12,
    image_url: null,
    estimated_delivery_date: "2025-09-15T00:00:00Z",
    includes_physical_item: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    display_order: 2,
  },
];

const MOCK_UPDATES = [
  {
    id: "u1",
    title: "We hit 40% in week one!",
    body: "Absolutely blown away by the response. 40% funded in 7 days. We're doubling our outreach this week. Thank you so much to every backer — this is real.",
    is_backers_only: false,
    created_at: "2025-05-22T08:00:00Z",
  },
  {
    id: "u2",
    title: "Exclusive: factory visit photos and material samples",
    body: "We just got back from Tuas — the production line is taking shape. Sharing photos and a short video of the material stress tests (yes, we tried to fill them with bak kut teh). Results were excellent.",
    is_backers_only: true,
    created_at: "2025-06-01T10:30:00Z",
  },
  {
    id: "u3",
    title: "Campaign launch!",
    body: "We are officially live on get that bread. Two years of prototyping, testing, and very many failed containers later — we're ready to bring Mochi Cloud to Singapore's hawker centres. Let's go.",
    is_backers_only: false,
    created_at: "2025-05-15T09:00:00Z",
  },
];

const MOCK_COMMENTS = [
  {
    id: "c1",
    author: "Priya S.",
    isCreator: false,
    message: "Huge fan of this. Any plans to include bowl formats for soups like laksa? That's where most plastic goes in my opinion.",
    created_at: "2025-05-18T14:00:00Z",
    replies: [
      {
        id: "c1r1",
        author: "Mochi Cloud Team",
        isCreator: true,
        message: "Yes! Bowl format is in our Q4 roadmap. The soup-leak challenge is real — we've been testing a double-wall design for exactly this use case.",
        created_at: "2025-05-19T09:00:00Z",
      },
    ],
  },
  {
    id: "c2",
    author: "Wei Liang",
    isCreator: false,
    message: "What's the cost per unit for a hawker stall? And do you have plans to get NEA on board with a subsidy scheme?",
    created_at: "2025-05-20T11:00:00Z",
    replies: [],
  },
  {
    id: "c3",
    author: "Nur Aisyah",
    isCreator: false,
    message: "Already backed! Shared this with my neighbourhood RC — they run a monthly hawker night and are always looking for sustainable options.",
    created_at: "2025-05-23T16:30:00Z",
    replies: [],
  },
];

// ─── Section nav ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "campaign", label: "Campaign" },
  { id: "rewards", label: `Rewards (${MOCK_REWARDS.length})` },
  { id: "faq", label: "FAQ" },
  { id: "updates", label: `Updates (${MOCK_UPDATES.length})` },
  { id: "comments", label: `Comments (${MOCK_COMMENTS.length})` },
] as const;

function SectionNav({ activeId }: { activeId: string }) {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 112; // navbar (64) + nav bar height (~48)
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="sticky top-16 z-20 border-b border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
      <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={`px-3.5 py-1.5 text-sm rounded-full border whitespace-nowrap transition-colors shrink-0 ${
              activeId === id
                ? "bg-[var(--color-brand-crust)]/10 border-[var(--color-brand-crust)] text-[var(--color-brand-crust)] font-semibold"
                : "bg-transparent border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ: infer from question-like headings ───────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function extractHeadings(html: string) {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  const re = /<h([23])[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const level = m[1] === "2" ? 2 : 3;
    const id = m[2];
    const text = m[3].replace(/<[^>]*>/g, "").trim();
    if (text) headings.push({ id, text, level });
  }
  return headings;
}

// ─── Funding widget (self-contained preview version) ─────────────────────────

function FundingWidgetPreview() {
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const selectedReward = MOCK_REWARDS.find((r) => r.id === selectedRewardId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)]">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] p-5">
          <FundingProgressBar
            pledged={18200}
            goal={30000}
            deadline={DEADLINE}
            backerCount={122}
          />

          <div className="mt-5">
            <Button size="lg" fullWidth>
              {selectedReward ? `Back with ${selectedReward.title}` : "Back this project"}
            </Button>
          </div>

          <p className="mt-3 text-xs text-center text-[var(--color-ink-subtle)] flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Milestone-protected escrow
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-subtle)]">
          Choose a reward
        </p>
        {MOCK_REWARDS.map((reward) => (
          <RewardTierCard
            key={reward.id}
            reward={reward}
            selected={selectedReward?.id === reward.id}
            onSelect={(r) => setSelectedRewardId(r.id === selectedRewardId ? null : r.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreviewProjectPage() {
  const [activeSection, setActiveSection] = useState("campaign");
  const [isBacker] = useState(true); // toggle to test locked updates
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const headings = useMemo(() => extractHeadings(MOCK_CAMPAIGN_HTML), []);
  const faqItems = useMemo(
    () =>
      headings.filter((h) => {
        const lower = h.text.toLowerCase();
        return h.text.includes("?") || lower.startsWith("faq") || lower.includes("question");
      }),
    [headings]
  );

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionIds = SECTIONS.map((s) => s.id);

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      sectionRefs.current.set(id, el);

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
            history.replaceState(null, "", `#${id}`);
          }
        },
        { rootMargin: "-15% 0px -80% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const visibleUpdates = MOCK_UPDATES.filter((u) => !u.is_backers_only || isBacker);
  const lockedCount = MOCK_UPDATES.filter((u) => u.is_backers_only && !isBacker).length;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Preview badge */}
      <div className="bg-[var(--color-brand-crust)]/10 border-b border-[var(--color-brand-crust)]/20 px-4 py-2 text-center text-xs text-[var(--color-brand-crust)] font-semibold tracking-wide">
        Preview — redesigned project page layout · no live data
      </div>

      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to explore
        </button>
      </div>

      {/* Two-column grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-6 min-w-0">

            {/* Hero */}
            <div>
              <Badge variant="violet" className="mb-3">Sustainability</Badge>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--color-ink)] tracking-tight leading-tight">
                Mochi Cloud — compostable packaging for Singapore's hawker centres
              </h1>
              <p className="mt-3 text-lg text-[var(--color-ink-muted)] leading-relaxed">
                We replace styrofoam and plastic with cassava-based packaging that degrades in 90 days — made for humid climates, priced for hawkers.
              </p>

              <div className="mt-5 inline-flex items-center gap-3 px-4 py-3 rounded-[var(--radius-card)] bg-amber-100/40 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <div className="w-10 h-10 rounded-full bg-amber-200/70 dark:bg-amber-800/40 ring-1 ring-amber-300 dark:ring-amber-700 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 shrink-0 text-sm">
                  M
                </div>
                <div>
                  <p className="text-xs text-[var(--color-ink-subtle)] uppercase tracking-[0.1em] font-medium">Campaign by</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">Mochi Cloud Team</p>
                </div>
                <div className="w-px h-8 bg-[var(--color-border)] mx-1" />
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Ends in 18 days
                </div>
              </div>
            </div>

            {/* Cover image placeholder */}
            <div className="relative w-full aspect-[16/9] rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-900/20 overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-3">🌿</div>
                <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Cover image</p>
                <p className="text-xs text-teal-600/70 dark:text-teal-400/60 mt-1">16:9 · campaign hero photo</p>
              </div>
            </div>

            {/* Funding widget – inline on mobile */}
            <div className="lg:hidden">
              <FundingWidgetPreview />
            </div>

            {/* ── Sticky section nav ── */}
            <SectionNav activeId={activeSection} />

            {/* ── Campaign section ── */}
            <section id="campaign" className="scroll-mt-32 flex flex-col gap-5">
              <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3">
                Campaign
              </h2>

              {/* Subsection chips from H2 headings */}
              {headings.filter((h) => h.level === 2).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {headings
                    .filter((h) => h.level === 2)
                    .map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className="text-xs rounded-full px-3 py-1 border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-brand-crust)]/50 transition-colors"
                      >
                        {h.text}
                      </a>
                    ))}
                </div>
              )}

              <div
                className="prose prose-base max-w-none text-[var(--color-ink)]
                  prose-headings:text-[var(--color-ink)] prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-[var(--color-border)] prose-h2:pb-2
                  prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-[var(--color-ink-muted)]
                  prose-p:text-[var(--color-ink-muted)] prose-p:leading-relaxed
                  prose-a:text-[var(--color-brand-crust)] prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-[var(--color-ink)] prose-strong:font-semibold
                  prose-ul:text-[var(--color-ink-muted)] prose-li:my-1
                  prose-blockquote:border-[var(--color-brand-crust)] prose-blockquote:text-[var(--color-ink-muted)]"
                dangerouslySetInnerHTML={{ __html: MOCK_CAMPAIGN_HTML }}
              />
            </section>

            {/* ── Rewards section ── */}
            <section id="rewards" className="scroll-mt-32 flex flex-col gap-5">
              <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3">
                Rewards
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)]">Select a reward to continue backing.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_REWARDS.map((reward) => (
                  <RewardTierCard
                    key={reward.id}
                    reward={reward}
                    onSelect={() => {}}
                  />
                ))}
              </div>
            </section>

            {/* ── FAQ section ── */}
            <section id="faq" className="scroll-mt-32 flex flex-col gap-5">
              <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3">
                FAQ
              </h2>
              {faqItems.length === 0 ? (
                <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 text-sm text-[var(--color-ink-muted)]">
                  No FAQ entries yet. Creators can add question-style headings in the campaign body.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {faqItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (!el) return;
                        const offset = 112;
                        const top = el.getBoundingClientRect().top + window.scrollY - offset;
                        window.scrollTo({ top, behavior: "smooth" });
                        setActiveSection("campaign");
                      }}
                      className="group flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4 text-sm text-[var(--color-ink)] hover:border-[var(--color-brand-crust)]/60 hover:bg-[var(--color-surface-overlay)] transition-colors"
                    >
                      <span className="font-medium">{item.text}</span>
                      <span className="text-[var(--color-brand-crust)] text-xs font-semibold shrink-0 group-hover:underline">
                        See answer →
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </section>

            {/* ── Updates section ── */}
            <section id="updates" className="scroll-mt-32 flex flex-col gap-5">
              <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[var(--color-brand-crust)]" />
                Updates
                <span className="font-mono text-sm font-semibold text-[var(--color-ink-muted)]">
                  ({MOCK_UPDATES.length})
                </span>
              </h2>

              <div className="flex flex-col gap-6">
                {visibleUpdates.map((update) => (
                  <article key={update.id} className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-[var(--color-ink)]">{update.title}</h3>
                        {update.is_backers_only && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-crust)] bg-[var(--color-brand-crust)]/10 px-2 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5" />
                            Backers only
                          </span>
                        )}
                      </div>
                      <time className="text-xs text-[var(--color-ink-subtle)] shrink-0">
                        {new Date(update.created_at).toLocaleDateString("en-SG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <p className="text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-line">
                      {update.body}
                    </p>
                    <div className="h-px bg-[var(--color-border)]" />
                  </article>
                ))}

                {lockedCount > 0 && (
                  <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-5 flex items-center gap-3 text-[var(--color-ink-muted)]">
                    <Lock className="w-4 h-4 shrink-0" />
                    <p className="text-sm">
                      <span className="font-semibold text-[var(--color-ink)]">
                        {lockedCount} backer-only update{lockedCount !== 1 ? "s" : ""}
                      </span>{" "}
                      — back this project to unlock them.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ── Comments section ── */}
            <section id="comments" className="scroll-mt-32 flex flex-col gap-5 pb-16">
              <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[var(--color-brand-crust)]" />
                Questions & feedback
                <span className="font-mono text-sm font-semibold text-[var(--color-ink-muted)]">
                  ({MOCK_COMMENTS.length})
                </span>
              </h2>

              <p className="text-sm text-[var(--color-ink-muted)]">
                Ask the creator a question or share feedback to help improve the campaign.
              </p>

              {/* Comment input */}
              <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                <textarea
                  rows={3}
                  placeholder="Ask a question or share feedback..."
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="secondary">Post feedback</Button>
                </div>
              </div>

              {/* Comment threads */}
              <div className="flex flex-col gap-4">
                {MOCK_COMMENTS.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[var(--radius-card)] border border-amber-200 dark:border-amber-700/50 bg-white/60 dark:bg-amber-950/30 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-200/60 dark:bg-amber-800/40 ring-1 ring-amber-300 dark:ring-amber-700 flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0">
                        {item.author.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--color-ink)]">{item.author}</p>
                          <time className="text-xs text-[var(--color-ink-subtle)] shrink-0">
                            {new Date(item.created_at).toLocaleDateString("en-SG", {
                              day: "numeric",
                              month: "short",
                            })}
                          </time>
                        </div>
                        <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                          {item.message}
                        </p>

                        {item.replies.length > 0 && (
                          <div className="mt-4 pl-3 border-l-2 border-amber-300 dark:border-amber-700 flex flex-col gap-2">
                            {item.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="rounded-[var(--radius-btn)] bg-amber-100/70 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                                    {reply.author}
                                    {reply.isCreator && (
                                      <span className="text-[10px] uppercase tracking-wide text-[var(--color-brand-crust)] font-bold">
                                        · Creator
                                      </span>
                                    )}
                                  </p>
                                  <time className="text-[11px] text-[var(--color-ink-subtle)] shrink-0">
                                    {new Date(reply.created_at).toLocaleDateString("en-SG", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </time>
                                </div>
                                <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                                  {reply.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── RIGHT COLUMN — sticky widget (desktop only) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-[calc(4rem+3.5rem)] self-start">
              <FundingWidgetPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
