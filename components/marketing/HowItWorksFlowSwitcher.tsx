"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";
import {
  BACKER_JOURNEY_STEPS,
  CREATOR_JOURNEY_STEPS,
  JourneyTimeline,
} from "./JourneyTimeline";
import { PlatformComparisonTable } from "./PlatformComparisonTable";
import { RewardArchetypes } from "./RewardArchetypes";
import { ScrollReveal } from "./ScrollReveal";

type Audience = "backer" | "creator";

export function HowItWorksFlowSwitcher() {
  const [audience, setAudience] = useState<Audience>("backer");

  return (
    <>
      {/* ── Toggle + flow timeline (constrained width) ─────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-16 md:pb-24">
        <div className="flex justify-center">
          <div
            role="tablist"
            aria-label="Choose audience"
            className="inline-flex p-1 gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-overlay)]"
          >
            <ToggleButton
              active={audience === "backer"}
              onClick={() => setAudience("backer")}
              label="I'm backing a project"
            />
            <ToggleButton
              active={audience === "creator"}
              onClick={() => setAudience("creator")}
              label="I'm creating a project"
            />
          </div>
        </div>

        <div className="mt-12 md:mt-16">
          <JourneyTimeline
            steps={
              audience === "backer"
                ? BACKER_JOURNEY_STEPS
                : CREATOR_JOURNEY_STEPS
            }
          />
        </div>
      </section>

      {/* ── Backer-only sections ────────────────────────────────────── */}
      {audience === "backer" && (
        <>
          {/* If something goes wrong — dark ribbon */}
          <ScrollReveal>
            <section className="bg-[var(--color-ink-deep)]">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-golden)] mb-3">
                    If something goes wrong
                  </div>
                  <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-white">
                    Three ways to get your money back.
                  </h2>
                  <p className="mt-4 text-base leading-[1.55] text-white/70 max-w-xl mx-auto">
                    Crowdfunding is a promise, not a purchase. We&apos;ve built the
                    platform to honour the promise — or unwind it.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                  <DarkScenarioCard
                    eye="Scenario A"
                    title="Goal not reached."
                    body="The creator misses the goal by deadline. We void all card auths and reverse PayNow holds the same day."
                    timing="Refund: instant"
                  />
                  <DarkScenarioCard
                    eye="Scenario B"
                    title="Creator cancels mid-campaign."
                    body="Sometimes life gets in the way. The creator can pull a campaign any time before the deadline. All pledges revert."
                    timing="Refund: instant"
                  />
                  <DarkScenarioCard
                    eye="Scenario C"
                    title="Creator stalls post-funding."
                    body="After 90 days without milestone progress and no comms, we refund undisbursed tranches pro-rata to backers."
                    timing="Refund: within 14 days"
                  />
                </div>
                <p className="mt-10 text-center text-sm text-white/50">
                  Full rules, refund amounts, and dispute timelines live in our{" "}
                  <Link
                    href="/terms?tab=refund"
                    className="font-semibold text-[var(--color-brand-golden)] hover:underline"
                  >
                    Refund &amp; Dispute Policy
                  </Link>
                  .
                </p>
              </div>
            </section>
          </ScrollReveal>

          {/* Reward archetypes */}
          <ScrollReveal>
            <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="max-w-2xl mb-10 md:mb-14">
                  <Eyebrow variant="crust-dark" className="mb-3 inline-flex items-center gap-2">
                    <Gift className="w-3.5 h-3.5" />
                    What you get back
                  </Eyebrow>
                  <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                    Backer rewards are the whole point — not a thank-you note.
                  </h2>
                  <p className="mt-3 text-base leading-[1.55] text-[var(--color-ink-muted)]">
                    Every campaign sets its own reward tiers. Here are the four
                    kinds you&apos;ll see most often, with real-feel examples of
                    how creators use them.
                  </p>
                </div>
                <RewardArchetypes />
              </div>
            </section>
          </ScrollReveal>
        </>
      )}

      {/* ── Creator-only: comparison table ──────────────────────────── */}
      {audience === "creator" && (
        <>
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

                <PlatformComparisonTable />
              </div>
            </section>
          </ScrollReveal>

          {/* ── Find out more CTA ─────────────────────────────────────── */}
          <ScrollReveal>
            <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <Eyebrow variant="crust-dark" className="mb-2">
                    Creator guide
                  </Eyebrow>
                  <h2 className="font-black tracking-[-0.025em] leading-[1.1] text-xl sm:text-2xl m-0 text-[var(--color-ink)]">
                    Want the full picture?
                  </h2>
                  <p className="mt-2 text-sm sm:text-base leading-[1.55] text-[var(--color-ink-muted)] max-w-md">
                    The creator guide covers the full campaign journey — timeline, what happens if you miss your goal, and the launch checklist.
                  </p>
                </div>
                <Link
                  href="/for-creators"
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white text-sm font-bold hover:bg-[var(--color-brand-crust-dark)] transition-colors duration-[160ms] whitespace-nowrap"
                >
                  Find out more
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          </ScrollReveal>
        </>
      )}
    </>
  );
}

// ─── Toggle button ──────────────────────────────────────────────────────────
function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "px-5 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
        active
          ? // Filled brand-crust pill with the same CTA shadow we use on
            // primary buttons. Reads clearly in light AND dark mode and
            // makes the selected audience unmistakable.
            "bg-[var(--color-brand-crust)] text-white shadow-[var(--shadow-cta)]"
          : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      )}
    >
      {label}
    </button>
  );
}

// ─── Dark scenario card (used inside the backer dark ribbon) ───────────────
function DarkScenarioCard({
  eye,
  title,
  body,
  timing,
}: {
  eye: string;
  title: string;
  body: string;
  timing: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-white/[0.04] border border-white/10 p-6 sm:p-7 flex flex-col">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand-golden)] mb-3">
        {eye}
      </div>
      <h3 className="font-black tracking-[-0.02em] text-lg sm:text-xl m-0 text-white">
        {title}
      </h3>
      <p className="mt-2.5 text-sm leading-[1.55] text-white/70 m-0 flex-1">
        {body}
      </p>
      <div className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-golden)]">
        {timing}
      </div>
    </div>
  );
}
