"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";
import { PlatformComparisonTable } from "./PlatformComparisonTable";
import { RewardArchetypes } from "./RewardArchetypes";
import { ScrollReveal } from "./ScrollReveal";

type Audience = "backer" | "creator";

type Step = {
  n: string;
  when: string;
  title: string;
  body: string;
  /** Each chip is [label, kind]; "ok" gets the success palette. */
  chips: ReadonlyArray<readonly [string, "ok" | "neutral"]>;
};

const BACKER_STEPS: ReadonlyArray<Step> = [
  {
    n: "01",
    when: "Day 0",
    title: "You browse and pledge.",
    body: "Find a campaign you believe in. Pick a reward tier. Pay via PayNow or card — your card is authorised but not charged yet.",
    chips: [["No charge yet", "neutral"]],
  },
  {
    n: "02",
    when: "Days 1 → deadline",
    title: "The campaign runs.",
    body: "Cancel or change your pledge any time before the campaign closes. We'll email you when the campaign hits a milestone or the creator posts an update.",
    chips: [["Cancel anytime", "ok"]],
  },
  {
    n: "03",
    when: "Deadline",
    title: "Goal hit, or every dollar back.",
    body: "If the campaign reaches 100%, your pledge collects on the last day. If it falls short, your card auth is voided and PayNow funds release. You pay nothing.",
    chips: [["All-or-nothing", "ok"]],
  },
  {
    n: "04",
    when: "Post-funding",
    title: "Funds release in tranches.",
    body: "Money sits in escrow and releases as the creator hits milestones — typically 40/40/20. You'll see live status on the campaign page.",
    chips: [["Milestone escrow", "neutral"]],
  },
  {
    n: "05",
    when: "Delivery window",
    title: "Reward arrives. Or we step in.",
    body: "Most campaigns ship on time. If a creator goes silent or misrepresents the project, you can open a dispute — milestones 45+ days overdue auto-trigger one on your behalf.",
    chips: [["Auto-dispute at 45 days", "ok"]],
  },
];

const CREATOR_STEPS: ReadonlyArray<Step> = [
  {
    n: "01",
    when: "Application",
    title: "Apply with your idea.",
    body: "Tell us what you're building, your goal, and your timeline. We come back within 1–2 business days — green-light, a few questions, or honest feedback on what to sharpen first.",
    chips: [["48h response", "neutral"]],
  },
  {
    n: "02",
    when: "Build phase",
    title: "Build the campaign with us.",
    body: "You write the story. We help with budget breakdown, milestone definitions, reward pricing, and the launch trailer. First-time creators get hands-on review with the founding team.",
    chips: [
      ["Hands-on review", "neutral"],
      ["Story doctor", "neutral"],
    ],
  },
  {
    n: "03",
    when: "Launch day",
    title: "Go live.",
    body: "Pre-launch warmup goes to your network. We help line up press where it makes sense — local outlets, relevant subreddits, founder communities. No spray-and-pray.",
    chips: [["Pre-launch list", "neutral"]],
  },
  {
    n: "04",
    when: "Live (typically 30 days)",
    title: "Run the campaign.",
    body: "Post updates, reply to backer questions, and watch the goal climb. We watch payment health and fraud signals — and run a weekly creator standup if you want one.",
    chips: [["Weekly standup", "neutral"]],
  },
  {
    n: "05",
    when: "Post-funding",
    title: "Get paid as you ship.",
    body: "Goal hit? Funds release in tranches as you hit milestones (40/40/20 by default — adjustable in your campaign settings). 5% platform fee, payment processing included, only billed on success.",
    chips: [["5% all-in", "ok"]],
  },
];

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
          <FlowTimeline
            steps={audience === "backer" ? BACKER_STEPS : CREATOR_STEPS}
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

      {/* ── Creator-only: fees + comparison table ──────────────────── */}
      {audience === "creator" && (
        <>
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
                    included. No application fee, no monthly fee, no hidden
                    recurring charge. If your goal isn&apos;t hit, you owe
                    nothing.
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

                  <ReceiptRow label="Goal raised" value="S$60,000.00" />
                  <ReceiptRow label="Platform fee · 5%" value="− S$3,000.00" />

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

// ─── Flow timeline ──────────────────────────────────────────────────────────
function FlowTimeline({ steps }: { steps: ReadonlyArray<Step> }) {
  return (
    <ol
      className={cn(
        "relative pl-14 sm:pl-20",
        // Vertical spine
        "before:absolute before:top-6 before:bottom-6 before:left-5 sm:before:left-7 before:w-[2px] before:rounded-full before:bg-[var(--color-border)]"
      )}
    >
      {steps.map((step, i) => (
        <li
          key={step.n}
          className={cn("relative", i < steps.length - 1 && "pb-6 sm:pb-8")}
        >
          {/* Per-step ScrollReveal — each step "lights up" as it scrolls
              into view rather than the whole list revealing at once.
              The absolute-positioned step number sits inside the
              ScrollReveal wrapper, so it slides into place with the
              card.

              `amount={0.35}` requires ~35% of the step to be visible
              before it activates — feels like the step "wakes up" as
              the user reaches it. */}
          <ScrollReveal amount={0.35} offset={28} duration={0.5}>
            {/* Numbered node */}
            <span className="absolute -left-[44px] sm:-left-[60px] top-3 inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-brand-crust)] text-[var(--color-brand-crust)] font-mono text-sm sm:text-base font-black tabular-nums z-10">
              {step.n}
            </span>

            {/* Card */}
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 sm:p-6">
              <Eyebrow variant="brand" size="sm" className="mb-2">
                {step.when}
              </Eyebrow>
              <h3 className="font-black tracking-[-0.02em] text-lg sm:text-xl m-0 text-[var(--color-ink)] leading-[1.25]">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)] m-0">
                {step.body}
              </p>

              {step.chips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {step.chips.map(([label]) => (
                    <Chip key={label}>{label}</Chip>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </li>
      ))}
    </ol>
  );
}

// Chip palette unified to brand-crumb. We previously had a green
// `ok` variant for "reassurance" chips (Cancel anytime / All-or-nothing
// / Auto-dispute), but the green broke the warm palette consistency
// the rest of the page lives in. Crumb-orange across the board reads
// the same theme everywhere.
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full text-[var(--color-brand-crust-dark)] bg-[var(--color-brand-crumb)]">
      {children}
    </span>
  );
}

// ─── Receipt row helper ─────────────────────────────────────────────────────
function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-dashed border-[var(--color-border)]">
      <span className="text-[var(--color-ink-muted)]">{label}</span>
      <span className="text-[var(--color-ink)] tabular-nums">{value}</span>
    </div>
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
    <div className="rounded-[var(--radius-card)] bg-white/5 border border-white/10 p-6 sm:p-7 flex flex-col">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-2">
        {eye}
      </div>
      <h3 className="font-black tracking-[-0.02em] text-lg m-0 text-white">{title}</h3>
      <p className="mt-3 text-sm leading-[1.6] text-white/70 flex-1 m-0">{body}</p>
      <div className="mt-5 inline-flex font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-golden)] bg-[var(--color-brand-golden)]/10 ring-1 ring-[var(--color-brand-golden)]/25 px-3 py-1.5 rounded-md w-fit">
        {timing}
      </div>
    </div>
  );
}
