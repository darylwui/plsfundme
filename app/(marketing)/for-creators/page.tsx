import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorTimelineScrub } from "@/components/marketing/CreatorTimelineScrubDynamic";
import { CreatorReassurance } from "@/components/marketing/CreatorReassurance";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { ScrollDownCue } from "@/components/marketing/ScrollDownCueDynamic";

export const metadata = {
  title: "For creators — get that bread",
  description:
    "Launch a campaign on get that bread. Raise capital from your Singapore community, keep 95% of what you raise, and only pay a fee if you hit your goal.",
};

const FEES = [
  { label: "Platform fee", value: "5% of funds raised", highlight: false },
  { label: "Payment processing", value: "Included", highlight: false },
  {
    label: "If goal not reached",
    value: "Free — backers refunded in full",
    highlight: true,
  },
];

export default function ForCreatorsPage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111] border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-xs uppercase tracking-[0.12em] font-medium mb-6">
            For creators
          </div>
          <h1 className="text-[40px] md:text-[56px] font-black tracking-tight leading-[1.05] mb-5 max-w-4xl">
            Launch a campaign.{" "}
            <span className="text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)]">
              Fund your idea.
            </span>
          </h1>
          <p className="text-lg text-[var(--color-ink-muted)] leading-relaxed max-w-2xl">
            Raise capital from your community and bring your idea to life.
            Singapore-first, all-or-nothing, and you only pay a fee if you hit
            your goal.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/projects/create">
              <Button size="lg" variant="inverse">
                Start your campaign
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              Or see the backer side →
            </Link>
          </div>
          <ScrollDownCue />
        </div>
      </section>

      {/* ── 1. How a campaign works ──────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <ScrollReveal>
            <div className="max-w-2xl mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-[11px] uppercase tracking-[0.15em] font-medium mb-4">
                <Rocket className="w-3.5 h-3.5" />
                How a campaign works
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.1] text-[var(--color-ink)]">
                From first draft to funded.
              </h2>
              <p className="mt-4 text-[var(--color-ink-muted)] leading-relaxed">
                Scroll through the timeline to see each stage of a campaign —
                from launch day to delivering rewards.
              </p>
            </div>
          </ScrollReveal>

          <CreatorTimelineScrub />

          <ScrollReveal>
            <div className="mt-10">
              <Link href="/projects/create">
                <Button size="lg">
                  Start your campaign
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 2. What if I don't hit my goal? ──────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-[11px] uppercase tracking-[0.15em] font-medium mb-4">
                <HelpCircle className="w-3.5 h-3.5" />
                The worst case
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.1] text-[var(--color-ink)]">
                What if I don&apos;t hit my goal?
              </h2>
            </div>
            <CreatorReassurance />
          </div>
        </section>
      </ScrollReveal>

      {/* ── 3. Fees ──────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-golden)] flex items-center justify-center shadow-[0_4px_20px_0_rgba(217,119,6,0.35)]">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-subtle)]">
                  Transparent
                </p>
                <h2 className="text-2xl font-black text-[var(--color-ink)]">
                  Simple, honest fees
                </h2>
              </div>
            </div>

            <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] max-w-lg">
              <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] overflow-hidden">
                {FEES.map(({ label, value, highlight }, i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-6 py-4 ${
                      i < FEES.length - 1
                        ? "border-b border-[var(--color-border)]"
                        : ""
                    }`}
                  >
                    <span className="text-sm text-[var(--color-ink-muted)]">
                      {label}
                    </span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        highlight
                          ? "text-[var(--color-brand-golden)]"
                          : "text-[var(--color-ink)]"
                      }`}
                    >
                      {highlight && (
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-[var(--color-brand-golden)]" />
                      )}
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── 4. Final CTA ─────────────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--color-ink)]">
                Ready to launch?
              </h2>
              <p className="text-[var(--color-ink-muted)] mt-1">
                Start for free. No upfront costs, no risk to your backers.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/projects/create">
                <Button size="lg" variant="inverse">
                  Start your campaign
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
