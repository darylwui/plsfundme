"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, Pencil, Users, type LucideIcon } from "lucide-react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";

type Step = {
  Icon: LucideIcon;
  num: number;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    Icon: Pencil,
    num: 1,
    title: "Create your campaign",
    description:
      "Set your funding goal, deadline, and reward tiers. Tell your story — our team reviews and approves within 1–2 days.",
  },
  {
    Icon: Users,
    num: 2,
    title: "Backers fund it",
    description:
      "Share your campaign. Backers pledge via PayNow or credit card. All-or-nothing — no one pays unless you hit your goal.",
  },
  {
    Icon: Banknote,
    num: 3,
    title: "Bring it to life",
    description:
      "Hit your goal? Funds are released to you minus our 5% fee. Miss it? Backers are fully refunded, no questions asked.",
  },
];

export function HowItWorksSection() {
  const [hovered, setHovered] = useState<number | null>(null);
  const anyHovered = hovered !== null;

  return (
    <section className="bg-[var(--color-surface-raised)] border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.21, 0.62, 0.35, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14"
        >
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-xs uppercase tracking-[0.12em] font-medium mb-4">
              How it works
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              From idea to funded
              <br />
              in three steps.
            </h2>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-crust)] hover:underline shrink-0"
          >
            Full guide <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Step grid with animated connecting path */}
        <div
          className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-6 items-stretch"
          onMouseLeave={() => setHovered(null)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setHovered(null);
            }
          }}
        >
          {/* Desktop connecting path */}
          <ConnectingPath />

          {STEPS.map((step, i) => {
            const active = hovered === i;
            const dimmed = anyHovered && !active;
            return (
              <StepCard
                key={step.num}
                step={step}
                index={i}
                active={active}
                dimmed={dimmed}
                onHover={() => setHovered(i)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────
function StepCard({
  step,
  index,
  active,
  dimmed,
  onHover,
}: {
  step: Step;
  index: number;
  active: boolean;
  dimmed: boolean;
  onHover: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(step.num);
      return;
    }
    const controls = animate(0, step.num, {
      duration: 0.9,
      delay: index * 0.15 + 0.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, step.num, index, reduceMotion]);

  const Icon = step.Icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.21, 0.62, 0.35, 1],
      }}
      onMouseEnter={onHover}
      onFocus={onHover}
      tabIndex={0}
      className={`relative flex flex-col gap-7 md:gap-8 p-6 md:p-7 rounded-[var(--radius-card)] transition-all duration-300 outline-none ${
        active
          ? "-translate-y-1 bg-[var(--color-surface)] shadow-[var(--shadow-card-hover)] ring-2 ring-[var(--color-brand-golden)]/40"
          : "bg-transparent ring-1 ring-transparent"
      } ${dimmed ? "opacity-55" : "opacity-100"}`}
    >
      {/* Icon (sits on the connector line as a node) */}
      <div className="relative z-10">
        <div
          className={`w-12 h-12 rounded-[var(--radius-card)] flex items-center justify-center transition-all duration-300 ring-[6px] ring-[var(--color-surface-raised)] ${
            active
              ? "bg-[var(--color-brand-golden)] scale-110 shadow-[0_12px_30px_-8px_rgba(217,119,6,0.55)]"
              : "bg-[var(--color-brand-crust)] shadow-[var(--shadow-cta)]"
          }`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Content */}
      <div>
        <span className="block font-mono text-xs md:text-[13px] font-bold text-[var(--color-ink-subtle)] uppercase tracking-[0.2em] tabular-nums mb-2">
          Step {String(display).padStart(2, "0")}
        </span>
        <h3
          className={`font-bold text-lg mb-2 transition-colors ${
            active ? "text-[var(--color-brand-crust)]" : "text-[var(--color-ink)]"
          }`}
        >
          {step.title}
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────
// Animated dashed curve that chains the three cards on desktop.
// Hidden on mobile/tablet where cards stack.
function ConnectingPath() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 80"
      preserveAspectRatio="none"
      className="hidden lg:block absolute left-0 right-0 top-[8px] w-full h-[80px] pointer-events-none z-0"
    >
      <motion.line
        x1="90"
        y1="40"
        x2="910"
        y2="40"
        stroke="var(--color-brand-golden)"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.55 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.21, 0.62, 0.35, 1] }}
      />
      {/* Waypoint dots that pop after the path draws */}
      {[90, 500, 910].map((cx, i) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={40}
          r={5}
          fill="var(--color-brand-golden)"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: 0.35,
            delay: 0.5 + i * 0.4,
            ease: "backOut",
          }}
        />
      ))}
    </svg>
  );
}
