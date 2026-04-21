import { Rocket, Shield } from "lucide-react";
import { PledgeTimelineDemo } from "@/components/marketing/PledgeTimelineDemo";
import { CreatorTimelineScrub } from "@/components/marketing/CreatorTimelineScrub";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export const metadata = {
  title: "Drafts — how it works",
  description: "Preview of new interactive widgets for /how-it-works.",
  robots: { index: false, follow: false },
};

export default function HowItWorksDraftsPage() {
  return (
    <div>
      {/* Draft banner */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-brand-golden)]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 text-xs">
          <span className="font-bold uppercase tracking-[0.2em] text-[var(--color-brand-golden)]">
            Draft preview
          </span>
          <span className="text-[var(--color-ink-muted)]">
            Not indexed · not linked from navigation
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111] border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-xs uppercase tracking-[0.12em] font-medium mb-5">
            Draft: interactive + scroll effects
          </div>
          <h1 className="text-[36px] md:text-[44px] font-black tracking-tight leading-[1.1] mb-3">
            /how-it-works preview
          </h1>
          <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-2xl">
            Two concepts stacked: the live-clock pledge widget (click-driven) and a
            scroll-scrubbed creator timeline (scroll-driven). Scroll through slowly
            — both are visible on this page.
          </p>
        </div>
      </section>

      {/* ── 1. Live-clock pledge widget ──────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] flex items-center justify-center shadow-[var(--shadow-cta)]">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-subtle)]">
                  The safety net
                </p>
                <h2 className="text-2xl font-black text-[var(--color-ink)]">
                  All-or-nothing funding
                </h2>
              </div>
            </div>
            <p className="text-[var(--color-ink-muted)] leading-relaxed mb-8 max-w-2xl">
              Backers are only charged if a campaign reaches its full funding goal by
              the deadline. If the goal isn&apos;t met, no one pays a cent. Try
              pledging below — or let the clock run out — to see both outcomes.
            </p>

            <PledgeTimelineDemo />
          </div>
        </section>
      </ScrollReveal>

      {/* ── 2. Scroll-scrubbed creator timeline ──────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] flex items-center justify-center shadow-[var(--shadow-cta)]">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-subtle)]">
                  For creators
                </p>
                <h2 className="text-2xl font-black text-[var(--color-ink)]">
                  Launch your campaign
                </h2>
              </div>
            </div>
            <p className="text-[var(--color-ink-muted)] leading-relaxed max-w-2xl">
              The section below pins while you scroll. The rail fills, the numbered
              bubble activates, and each step card fades in smoothly — all tied to
              your scroll position, not just a threshold.
            </p>
          </ScrollReveal>
        </div>

        <CreatorTimelineScrub />
      </section>

      {/* ── 3. Scroll-reveal filler (to show the pattern repeats cleanly) ── */}
      <ScrollReveal>
        <section className="bg-[var(--color-surface)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <h2 className="text-2xl font-black text-[var(--color-ink)]">
              Sections land as you scroll in
            </h2>
            <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed max-w-2xl">
              Every block on this draft is wrapped in a scroll-reveal that scrubs
              opacity and vertical offset from the moment it enters the viewport
              until it&apos;s about halfway up the screen. Scroll back up and the
              effect re-plays in reverse.
            </p>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
