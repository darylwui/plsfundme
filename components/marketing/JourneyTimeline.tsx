"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Eyebrow } from "./Eyebrow";

export type JourneyStep = {
  n: string;
  when: string;
  title: string;
  body: string;
  chips: ReadonlyArray<readonly [string, "ok" | "neutral"]>;
};

export const BACKER_JOURNEY_STEPS: ReadonlyArray<JourneyStep> = [
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

export const CREATOR_JOURNEY_STEPS: ReadonlyArray<JourneyStep> = [
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

export function JourneyTimeline({
  steps,
}: {
  steps: ReadonlyArray<JourneyStep>;
}) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 60%"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    mass: 0.4,
  });
  const railHeight = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <ol ref={ref} className="relative pl-14 sm:pl-20">
      {/* Two-layer rail — gray base, orange fill grows with scroll */}
      <div
        aria-hidden
        className="absolute left-4 sm:left-6 top-3 bottom-3 w-[2px] rounded-full bg-[var(--color-border)]"
      >
        <motion.div
          style={{ height: railHeight }}
          className="absolute top-0 left-0 w-full rounded-full bg-[var(--color-brand-crust)]"
        />
      </div>

      {steps.map((step, i) => (
        <li
          key={step.n}
          className={i < steps.length - 1 ? "pb-6 sm:pb-8" : undefined}
        >
          <Step
            step={step}
            index={i}
            total={steps.length}
            progress={progress}
          />
        </li>
      ))}
    </ol>
  );
}

function Step({
  step,
  index,
  total,
  progress,
}: {
  step: JourneyStep;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const threshold = index / Math.max(1, total - 1);
  const bubbleFill = useTransform(
    progress,
    [Math.max(0, threshold - 0.04), threshold],
    [0, 1]
  );
  const bubbleScale = useTransform(
    progress,
    [
      Math.max(0, threshold - 0.08),
      threshold,
      Math.min(1, threshold + 0.08),
    ],
    [1, 1.12, 1]
  );

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.5, ease: [0.21, 0.62, 0.35, 1] }}
    >
      {/* Numbered node — outline → solid orange when scroll crosses threshold */}
      <motion.span
        style={{ scale: bubbleScale }}
        className="absolute -left-[54px] sm:-left-[74px] top-1 inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-[var(--color-brand-crust)] bg-[var(--color-surface)] z-10"
      >
        <motion.span
          aria-hidden
          style={{ opacity: bubbleFill }}
          className="absolute inset-0 rounded-full bg-[var(--color-brand-crust)]"
        />
        <span className="relative font-mono text-xs sm:text-sm font-black tabular-nums text-[var(--color-brand-crust)] mix-blend-difference">
          {step.n}
        </span>
      </motion.span>

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
    </motion.div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full text-[var(--color-brand-crust-dark)] bg-[var(--color-brand-crumb)]">
      {children}
    </span>
  );
}
