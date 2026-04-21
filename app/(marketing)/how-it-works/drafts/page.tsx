import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Rocket,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackerStepper } from "@/components/marketing/BackerStepper";
import { PledgeTimelineDemo } from "@/components/marketing/PledgeTimelineDemo";
import { CreatorTimelineScrub } from "@/components/marketing/CreatorTimelineScrub";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export const metadata = {
  title: "Drafts — how it works",
  description: "Preview of new interactive widgets for /how-it-works.",
  robots: { index: false, follow: false },
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
            cumulative creator timeline (scroll-driven). Scroll through slowly — each
            step appears as you reach it and stays on the page.
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

      {/* ── 2. Cumulative creator timeline ───────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-10">
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
          </ScrollReveal>

          <CreatorTimelineScrub />

          <ScrollReveal>
            <div className="mt-10">
              <Link href="/projects/create">
                <Button size="lg">
                  Start your campaign
                  <span className="w-7 h-7 rounded-full bg-[var(--color-brand-crust)]/10 flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 3. For backers ───────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-golden)] flex items-center justify-center shadow-[0_4px_20px_0_rgba(217,119,6,0.35)]">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-subtle)]">
                  For backers
                </p>
                <h2 className="text-2xl font-black text-[var(--color-ink)]">
                  Support what you believe in
                </h2>
              </div>
            </div>

            <BackerStepper />

            <div className="mt-8">
              <Link href="/explore">
                <Button variant="secondary" size="lg">
                  Explore projects
                  <span className="w-7 h-7 rounded-full bg-[var(--color-brand-crust)]/10 flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── 4. Fees ──────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
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

      {/* ── 5. CTA ───────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-surface)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">
                Ready to launch?
              </h2>
              <p className="text-[var(--color-ink-muted)] mt-1">
                Start for free — no upfront costs, no risk to backers.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/projects/create">
                <Button size="lg" variant="inverse">
                  Start a project
                  <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="secondary">
                  Explore
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
