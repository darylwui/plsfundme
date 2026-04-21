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
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  return (
    <div
      ref={ref}
      className="relative"
      style={{ height: `${STEPS.length * 80}vh` }}
    >
      <div className="sticky top-0 h-screen flex items-center">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr] gap-8 sm:gap-12 items-start">
            <Rail progress={progress} />
            <div className="relative h-[56vh] sm:h-[50vh]">
              {STEPS.map((step, i) => (
                <ScrubbedCard
                  key={step.step}
                  step={step}
                  progress={progress}
                  index={i}
                  total={STEPS.length}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Rail({ progress }: { progress: MotionValue<number> }) {
  const fillHeight = useTransform(progress, [0, 1], ["0%", "100%"]);
  return (
    <div className="relative w-1 rounded-full bg-[var(--color-border)] h-[56vh] sm:h-[50vh]">
      <motion.div
        style={{ height: fillHeight }}
        className="absolute top-0 left-0 w-full rounded-full bg-[var(--color-brand-crust)]"
      />
      {STEPS.map((_, i) => (
        <RailNode
          key={i}
          progress={progress}
          index={i}
          total={STEPS.length}
        />
      ))}
    </div>
  );
}

function RailNode({
  progress,
  index,
  total,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const threshold = index / Math.max(1, total - 1);
  const fillOpacity = useTransform(
    progress,
    [Math.max(0, threshold - 0.04), threshold],
    [0, 1]
  );
  const scale = useTransform(
    progress,
    [Math.max(0, threshold - 0.08), threshold, Math.min(1, threshold + 0.08)],
    [1, 1.25, 1]
  );
  const top = `${threshold * 100}%`;
  return (
    <motion.div
      style={{ top, scale }}
      className="absolute -left-[14px] -translate-y-1/2 w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-black ring-4 ring-[var(--color-surface)]"
    >
      <div className="absolute inset-0 rounded-full border-2 border-[var(--color-brand-crust)] bg-[var(--color-surface)]" />
      <motion.div
        style={{ opacity: fillOpacity }}
        className="absolute inset-0 rounded-full bg-[var(--color-brand-crust)]"
      />
      <span className="relative text-[11px] font-black text-[var(--color-brand-crust)] mix-blend-difference">
        {index + 1}
      </span>
    </motion.div>
  );
}

function ScrubbedCard({
  step,
  progress,
  index,
  total,
}: {
  step: Step;
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const slot = 1 / total;
  const start = index * slot;
  const end = (index + 1) * slot;
  const enter = Math.max(0, start - 0.06);
  const exit = Math.min(1, end + 0.06);
  const isLast = index === total - 1;
  const isFirst = index === 0;

  const opacity = useTransform(
    progress,
    [
      enter,
      start + 0.01,
      isLast ? 1 : end - 0.01,
      isLast ? 1 : exit,
    ],
    [isFirst ? 1 : 0, 1, 1, isLast ? 1 : 0]
  );
  const y = useTransform(
    progress,
    [enter, start + 0.01],
    [isFirst ? 0 : 40, 0]
  );
  const Icon = step.Icon;

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex items-center"
    >
      <div className="w-full rounded-[var(--radius-card)] border border-[var(--color-brand-crust)]/30 bg-[var(--color-surface)] p-6 sm:p-10 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[var(--color-brand-crust)]" />
          </div>
          <span className="font-mono text-[11px] font-bold text-[var(--color-brand-crust)] uppercase tracking-[0.2em]">
            Step {step.step}
          </span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)] leading-tight">
          {step.title}
        </h3>
        <p className="mt-3 text-[var(--color-ink-muted)] leading-relaxed text-base sm:text-lg">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}
