import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";
import { HowItWorksFlowSwitcher } from "@/components/marketing/HowItWorksFlowSwitcher";
import { PledgeTimelineDemo } from "@/components/marketing/PledgeTimelineDemo";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export const metadata = {
  title: "How it works — get that bread",
  description:
    "Singapore's reward-based crowdfunding platform. Pledge to creators you love — we only move your money if they hit their goal. All-or-nothing, milestone escrow, PayNow native.",
};

export default function HowItWorksPage() {
  return (
    <div className="bg-[var(--color-surface)]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.18} size="700px 360px" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <Eyebrow variant="brand" className="mb-4">
            How it works
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.02] text-[clamp(36px,6vw,72px)] m-0 text-[var(--color-ink)]">
            From idea to funded, no awkward middle.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            Same platform, two stories. Pick the one that matches you and we&apos;ll
            walk through every step — pledge to delivery, application to payout.
          </p>
        </div>
      </section>

      {/* ── Try it yourself — interactive backer-flow demo ─────
          Sits above the audience toggle so visitors get an immediate
          hands-on understanding of how a pledge moves through the
          system before they even pick a perspective. */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="max-w-2xl mb-8 md:mb-10">
              <Eyebrow variant="crust-dark" className="mb-3 inline-flex items-center gap-2">
                <PlayCircle className="w-3.5 h-3.5" />
                Try it yourself
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                See how your pledge works.
              </h2>
              <p className="mt-3 text-base leading-[1.55] text-[var(--color-ink-muted)]">
                Don&apos;t take our word for it. Try pledging below, or let the
                clock run out — you&apos;ll see exactly how your money is handled
                either way.
              </p>
            </div>
            <PledgeTimelineDemo />
          </div>
        </section>
      </ScrollReveal>

      {/* ── Audience switcher + tab-conditional content ────────
          Toggles between backer and creator. The switcher renders its
          own conditional sections internally:
            • Backer view  → 5-step timeline + reward archetypes
            • Creator view → 5-step timeline + fees receipt + comparison
          Each conditional section is independently ScrollReveal-wrapped
          inside the switcher so they fade in cleanly when the audience
          changes (or on initial scroll). */}
      <HowItWorksFlowSwitcher />

      {/* ── Pivot CTA — two-column dark/light ────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            {/* Creator card — dark */}
            <div className="rounded-[var(--radius-card)] bg-[var(--color-ink-deep)] text-white p-8 sm:p-10 md:p-11 flex flex-col">
              <Eyebrow variant="golden" className="mb-3.5">
                For creators
              </Eyebrow>
              <h3 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-white">
                Bring your idea. We&apos;ll help build the campaign.
              </h3>
              <p className="mt-3.5 text-sm sm:text-base leading-[1.55] text-white/70 max-w-md">
                Free 30-minute call before you commit. We tell you honestly if we
                think it&apos;ll fund.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 items-center">
                <Button asChild size="md" variant="primary">
                  <Link href="/apply/creator">
                    Apply to launch
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Link
                  href="/for-creators"
                  className="text-sm font-semibold text-white/85 hover:text-white inline-flex items-center gap-1.5 hover:gap-2 transition-all"
                >
                  Creator guide <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Backer card — light */}
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-8 sm:p-10 md:p-11 flex flex-col">
              <Eyebrow variant="brand" className="mb-3.5">
                For backers
              </Eyebrow>
              <h3 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-[var(--color-ink)]">
                Find something to back.
              </h3>
              <p className="mt-3.5 text-sm sm:text-base leading-[1.55] text-[var(--color-ink-muted)] max-w-md">
                Browse the live campaigns and pick one that moves you. Pledge
                from S$25, your money&apos;s protected at every stage.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 items-center">
                <Button asChild size="md" variant="primary">
                  <Link href="/explore">
                    Explore campaigns
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Link
                  href="/backer-protection"
                  className="text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-1.5 hover:gap-2 transition-all"
                >
                  Backer protection <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
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

