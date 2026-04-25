import Link from "next/link";
import { ArrowRight, Gift, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToTop } from "@/components/ui/back-to-top";
import { PledgeTimelineDemo } from "@/components/marketing/PledgeTimelineDemo";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { ScrollDownCue } from "@/components/marketing/ScrollDownCueDynamic";
import { RewardArchetypes } from "@/components/marketing/RewardArchetypes";
import { CreatorRedirect } from "@/components/marketing/CreatorRedirect";

export const metadata = {
  title: "How it works — for backers",
  description:
    "Back Singapore's next big thing on get that bread. Get exclusive rewards, zero-risk pledges, and only pay if the campaign hits its goal.",
};

export default function HowItWorksPage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111] border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <h1 className="text-[40px] md:text-[56px] font-black tracking-tight leading-[1.05] mb-5 max-w-4xl">
            Back bold ideas.{" "}
            <span className="text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)]">
              Get the rewards.
            </span>{" "}
            No goal, no charge.
          </h1>
          <p className="text-lg text-[var(--color-ink-muted)] leading-relaxed max-w-2xl">
            get that bread is Singapore&apos;s reward-based crowdfunding
            platform. Pledge to creators you love — we only move your money
            if they hit their goal.
          </p>
          <ScrollDownCue />
        </div>
      </section>

      {/* ── 1. Try it yourself ───────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-[11px] uppercase tracking-[0.15em] font-medium mb-4">
                <PlayCircle className="w-3.5 h-3.5" />
                Try it yourself
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.1] text-[var(--color-ink)]">
                See how your pledge works.
              </h2>
              <p className="mt-4 text-[var(--color-ink-muted)] leading-relaxed">
                Don&apos;t take our word for it. Try pledging below, or let
                the clock run out — you&apos;ll see exactly how your money is
                handled either way.
              </p>
            </div>
            <PledgeTimelineDemo />
          </div>
        </section>
      </ScrollReveal>

      {/* ── 3. What you get back ─────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-2xl mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-[11px] uppercase tracking-[0.15em] font-medium mb-4">
                <Gift className="w-3.5 h-3.5" />
                What you get back
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.1] text-[var(--color-ink)]">
                Backer rewards aren&apos;t just a thank-you.
              </h2>
              <p className="mt-4 text-[var(--color-ink-muted)] leading-relaxed">
                They&apos;re the whole point. Every campaign on get that bread
                ships tiered rewards — here&apos;s what you can usually
                expect.
              </p>
            </div>
            <RewardArchetypes />
          </div>
        </section>
      </ScrollReveal>

      {/* ── 4. Creator redirect ──────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
            <CreatorRedirect />
          </div>
        </section>
      </ScrollReveal>

      {/* ── 5. CTA ───────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#1a0f00] dark:via-[#0a0a0a] dark:to-[#1a0800] border-t border-[var(--color-border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-xs uppercase tracking-[0.12em] font-medium mb-6">
              🍞 Let&apos;s go
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] text-[var(--color-ink)] mb-4">
              Find something to back.
            </h2>
            <p className="text-lg text-[var(--color-ink-muted)] max-w-md mx-auto mb-10 leading-relaxed">
              Browse live campaigns and pledge to the ones that move you. No goal, no charge.
            </p>
            <Button asChild size="lg" variant="primary">
              <Link href="/explore">
                Explore projects
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>

      <div className="flex justify-center py-10 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <BackToTop />
      </div>
    </div>
  );
}
