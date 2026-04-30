import Link from "next/link";
import { ArrowRight, BookOpen, Globe, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";
import {
  CREATOR_JOURNEY_STEPS,
  JourneyTimeline,
} from "@/components/marketing/JourneyTimeline";
import { PlatformComparisonTable } from "@/components/marketing/PlatformComparisonTable";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { ScrollDownCue } from "@/components/marketing/ScrollDownCueDynamic";

export const metadata = {
  title: "For creators — get that bread",
  description:
    "Launch a campaign on get that bread. Raise capital from your Singapore community, keep 95% of what you raise, and only pay a fee if you hit your goal.",
};

export default function ForCreatorsPage() {
  return (
    <div className="bg-[var(--color-surface)]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.2} size="700px 400px" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <Eyebrow variant="brand" className="mb-4">
            For creators
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.02] text-[clamp(36px,6vw,72px)] m-0 text-[var(--color-ink)]">
            Be one of the first. Fund your idea.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            We&apos;re handpicking Singapore&apos;s first founders right now. Apply to
            launch a campaign, raise capital from your community, and get featured
            at the top of the homepage on day one. Milestone-based payouts, fee
            only if you hit your goal.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="primary">
              <Link href="/apply/creator">
                Apply to launch
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/for-creators/launch-guide">
                <BookOpen className="w-4 h-4" />
                Get the launch checklist
              </Link>
            </Button>
          </div>
          <div className="mt-5 flex justify-center">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-[var(--color-brand-crust)] hover:text-[var(--color-brand-crust-dark)] hover:bg-[var(--color-brand-crumb)] dark:text-[var(--color-brand-golden)] dark:hover:text-[var(--color-brand-golden)] dark:hover:bg-[var(--color-brand-crust-dark)]/25 border border-[var(--color-brand-crust)]/30 dark:border-[var(--color-brand-golden)]/25 hover:border-[var(--color-brand-crust)]/50 dark:hover:border-[var(--color-brand-golden)]/45"
            >
              <Link href="/for-creators/international">
                <Globe className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Overseas founder? Submit your idea</span>
                <span className="hidden sm:inline">If you&apos;re an overseas founder, submit your idea here</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </Button>
          </div>
          <ScrollDownCue />
        </div>
      </section>

      {/* ── 1. How a campaign works ──────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <ScrollReveal>
            <div className="max-w-2xl mb-10 md:mb-14">
              <Eyebrow variant="crust-dark" className="mb-3 inline-flex items-center gap-2">
                <Rocket className="w-3.5 h-3.5" />
                How a campaign works
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                From idea to milestones.
              </h2>
              <p className="mt-3 text-base leading-[1.55] text-[var(--color-ink-muted)]">
                Scroll through the timeline to see each stage of a campaign —
                from launch day to delivering rewards.
              </p>
            </div>
          </ScrollReveal>

          <JourneyTimeline steps={CREATOR_JOURNEY_STEPS} />

          <ScrollReveal>
            <div className="mt-10">
              <Button asChild size="lg">
                <Link href="/projects/create">
                  Start your campaign
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 2. Why us — comparison table ─────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
              <Eyebrow variant="brand" className="mb-3">
                So why us?
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                What you get here that you don&apos;t get elsewhere.
              </h2>
            </div>
            <PlatformComparisonTable />
          </div>
        </section>
      </ScrollReveal>

      {/* ── 3. Final CTA — dark ribbon ────────────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-ink-deep)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <Eyebrow variant="golden" className="mb-4">
              Let&apos;s go
            </Eyebrow>
            <h2 className="font-black tracking-[-0.03em] leading-[1.05] text-[clamp(32px,5vw,52px)] m-0 text-white mb-4">
              Ready to be one of our first?
            </h2>
            <p className="text-base sm:text-lg leading-[1.55] text-white/70 max-w-md mx-auto mb-10">
              Apply for free. No upfront costs, no risk to your backers — we
              only take a fee if your campaign hits its goal.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="primary">
                <Link href="/apply/creator">
                  Apply to launch
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/for-creators/launch-guide">
                  <BookOpen className="w-4 h-4" />
                  Get the launch checklist
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <div className="flex justify-center py-10 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <BackToTop />
      </div>
    </div>
  );
}
