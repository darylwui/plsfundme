"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

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
      {/* ── Toggle ─────────────────────────────────────────── */}
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
            label="I'm launching one"
          />
        </div>
      </div>

      {/* ── Flow ───────────────────────────────────────────── */}
      <div className="mt-12 md:mt-16">
        <FlowTimeline
          steps={audience === "backer" ? BACKER_STEPS : CREATOR_STEPS}
        />
      </div>
    </>
  );
}

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
          ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-card)]"
          : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      )}
    >
      {label}
    </button>
  );
}

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
          {/* Numbered node */}
          <span
            className="absolute -left-[44px] sm:-left-[60px] top-3 inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-brand-crust)] text-[var(--color-brand-crust)] font-mono text-sm sm:text-base font-black tabular-nums z-10"
          >
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
                {step.chips.map(([label, kind]) => (
                  <Chip key={label} kind={kind}>
                    {label}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Chip({
  kind,
  children,
}: {
  kind: "ok" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full",
        kind === "ok"
          ? "text-[var(--color-brand-success)] bg-[var(--color-brand-success)]/10 ring-1 ring-[var(--color-brand-success)]/25"
          : "text-[var(--color-brand-crust-dark)] bg-[var(--color-brand-crumb)]"
      )}
    >
      {children}
    </span>
  );
}
