"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  FileText,
  Search,
  Target,
  Package,
  type LucideIcon,
} from "lucide-react";

type Step = {
  Icon: LucideIcon;
  step: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    Icon: FileText,
    step: "01",
    title: "Create your campaign",
    description:
      "Set your funding goal, deadline, and reward tiers. Tell your story with a compelling description and cover image.",
  },
  {
    Icon: Search,
    step: "02",
    title: "Submit for review",
    description:
      "Our team reviews your campaign within 1–2 business days. Once approved, you go live — then share with your network!",
  },
  {
    Icon: Target,
    step: "03",
    title: "Hit your goal",
    description:
      "If your campaign reaches its funding goal by the deadline, you receive the funds minus our 5% platform fee.",
  },
  {
    Icon: Package,
    step: "04",
    title: "Deliver your rewards",
    description:
      "Fulfill your promises to backers. Keep them updated with campaign posts along the way.",
  },
];

export function CreatorTimelineScrub() {
  const ref = useRef<HTMLDivElement>(null);
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
    <div ref={ref} className="relative pl-14 sm:pl-20">
      {/* Rail */}
      <div className="absolute left-4 sm:left-6 top-3 bottom-3 w-[2px] rounded-full bg-[var(--color-border)]">
        <motion.div
          style={{ height: railHeight }}
          className="absolute top-0 left-0 w-full rounded-full bg-[var(--color-brand-crust)]"
        />
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-10 sm:gap-14">
        {STEPS.map((step, i) => (
          <Step
            key={step.step}
            step={step}
            index={i}
            total={STEPS.length}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
}

function Step({
  step,
  index,
  total,
  progress,
}: {
  step: Step;
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
    [1, 1.15, 1]
  );
  const Icon = step.Icon;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.21, 0.62, 0.35, 1] }}
    >
      {/* Bubble on rail */}
      <motion.div
        style={{ scale: bubbleScale }}
        className="absolute -left-[54px] sm:-left-[74px] top-1 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center ring-4 ring-[var(--color-surface-raised)]"
      >
        <div className="absolute inset-0 rounded-full border-2 border-[var(--color-brand-crust)] bg-[var(--color-surface)]" />
        <motion.div
          style={{ opacity: bubbleFill }}
          className="absolute inset-0 rounded-full bg-[var(--color-brand-crust)]"
        />
        <span className="relative font-mono text-xs font-black text-[var(--color-brand-crust)] mix-blend-difference">
          {step.step}
        </span>
      </motion.div>

      {/* Card */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-5 h-5 text-[var(--color-brand-crust)]" />
          <h3 className="text-xl font-black text-[var(--color-ink)]">
            {step.title}
          </h3>
        </div>
        <p className="text-[var(--color-ink-muted)] leading-relaxed">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}
