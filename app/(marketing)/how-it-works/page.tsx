import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";
import { HowItWorksFlowSwitcher } from "@/components/marketing/HowItWorksFlowSwitcher";
import { PledgeTimelineDemo } from "@/components/marketing/PledgeTimelineDemo";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { PlayCircle } from "lucide-react";

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

      {/* ── Audience switcher + flow timeline ────────────────── */}
      <ScrollReveal>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-16 md:pb-24">
          <HowItWorksFlowSwitcher />
        </section>
      </ScrollReveal>

      {/* ── Fees, in plain English ───────────────────────────── */}
      <ScrollReveal>
        <section className="border-y border-[var(--color-border)] bg-[var(--color-brand-crumb-light)] dark:bg-[var(--color-surface-raised)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <Eyebrow variant="crust-dark" className="mb-3">
              Fees, in plain English
            </Eyebrow>
            <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
              Five percent. That&apos;s the whole deal.
            </h2>
            <p className="mt-4 text-base leading-[1.55] text-[var(--color-ink-muted)] max-w-xl mx-auto">
              If your campaign succeeds, we take 5% — payment processing
              included. No application fee, no monthly fee, no hidden recurring
              charge. If your goal isn&apos;t hit, you owe nothing.
            </p>
          </div>

          {/* Receipt-style sample */}
          <div className="mt-10 max-w-md mx-auto rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-7 sm:p-8 font-mono text-sm text-[var(--color-ink)]">
            <Eyebrow variant="muted" size="sm" className="text-center mb-1">
              Sample
            </Eyebrow>
            <h3 className="text-center font-black font-sans text-lg sm:text-xl tracking-[-0.02em] text-[var(--color-ink)] m-0 mb-5">
              If you raise S$60,000
            </h3>

            <Row label="Goal raised" value="S$60,000.00" />
            <Row label="Platform fee · 5%" value="− S$3,000.00" />

            <div className="flex justify-between items-baseline pt-4 mt-2 border-t-2 border-[var(--color-ink)]">
              <span className="font-sans font-bold tracking-[-0.01em] text-base">
                You receive
              </span>
              <span className="font-sans font-black text-2xl tracking-[-0.02em] text-[var(--color-brand-crust)] tabular-nums">
                S$57,000
              </span>
            </div>

            <div className="mt-5 text-center text-[10px] text-[var(--color-ink-subtle)] tracking-[0.16em]">
              · · · ·  released in milestone tranches  · · · ·
            </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── So why us — comparison table ─────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
              <Eyebrow variant="brand" className="mb-3">
                So why us?
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                What you get here that you don&apos;t get elsewhere.
              </h2>
            </div>

            <ComparisonTable />
          </div>
        </section>
      </ScrollReveal>

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

// ─── Receipt row ────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-dashed border-[var(--color-border)]">
      <span className="text-[var(--color-ink-muted)]">{label}</span>
      <span className="text-[var(--color-ink)] tabular-nums">{value}</span>
    </div>
  );
}

// ─── Comparison table ───────────────────────────────────────────────────────
const COMPARISON_ROWS: ReadonlyArray<readonly [string, string, string]> = [
  ["Funding model", "All-or-nothing", "All-or-nothing or flexible"],
  [
    "Milestone escrow",
    "Yes — funds release as you ship",
    "Lump sum on close",
  ],
  ["Platform fee", "5% (processing included)", "5% + ~3% processing"],
  ["Local payment (PayNow)", "Yes", "No"],
  [
    "Singapore creator support",
    "Singapore-based humans, business hours",
    "Email queue, US/EU hours",
  ],
  [
    "Refund on missed milestones",
    "Auto at 45 days overdue",
    "Backer files dispute manually",
  ],
];

function ComparisonTable() {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[var(--color-ink)]">
            <th className="text-left py-3.5 px-3 sm:px-4 font-bold w-2/5 text-[var(--color-ink-muted)]">
              {/* empty corner */}
            </th>
            <th className="text-left py-3.5 px-3 sm:px-4 font-bold text-[var(--color-brand-crust)]">
              get that bread
            </th>
            <th className="text-left py-3.5 px-3 sm:px-4 font-bold text-[var(--color-ink)]">
              Other platforms
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map(([label, ours, theirs]) => (
            <tr key={label} className="border-b border-[var(--color-border)]">
              <td className="py-3.5 px-3 sm:px-4 font-semibold text-[var(--color-ink)] align-top leading-[1.5]">
                {label}
              </td>
              <td className="py-3.5 px-3 sm:px-4 font-semibold text-[var(--color-ink)] bg-[var(--color-brand-crust)]/8 dark:bg-[var(--color-brand-crust)]/15 align-top leading-[1.5]">
                {ours}
              </td>
              <td className="py-3.5 px-3 sm:px-4 text-[var(--color-ink-muted)] align-top leading-[1.5]">
                {theirs}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
