"use client";

import { useState } from "react";
import {
  ArrowRight,
  CreditCard,
  Gift,
  Search,
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
    Icon: Search,
    step: "01",
    title: "Discover projects",
    description:
      "Browse trending campaigns from Singapore entrepreneurs across all categories.",
  },
  {
    Icon: CreditCard,
    step: "02",
    title: "Back with confidence",
    description:
      "Pledge via Credit Card (only charged if the campaign hits its goal) or PayNow (charged instantly; refunded in full if it doesn't).",
  },
  {
    Icon: Gift,
    step: "03",
    title: "Receive your rewards",
    description:
      "Get exclusive rewards from creators as a thank-you for your support.",
  },
];

export function BackerStepperDraft() {
  const [hovered, setHovered] = useState<number | null>(null);
  const anyHovered = hovered !== null;

  return (
    <div className="relative">
      {/* Desktop: horizontal connected cards */}
      <div className="hidden md:grid grid-cols-3 gap-0 relative items-stretch">
        <div className="absolute top-[58px] left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-[var(--color-brand-golden)]/30 via-[var(--color-brand-golden)] to-[var(--color-brand-golden)]/30" />

        {STEPS.map(({ Icon, step, title, description }, i) => {
          const active = hovered === i;
          const dimmed = anyHovered && !active;
          return (
            <div
              key={step}
              className="relative flex flex-col items-center text-center px-4 group h-full"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            >
              <div
                className={`relative z-10 w-14 h-14 rounded-full bg-[var(--color-brand-golden)] text-white flex items-center justify-center ring-4 ring-[var(--color-surface)] transition-all duration-300 ${
                  active
                    ? "scale-110 shadow-[0_16px_40px_-8px_rgba(217,119,6,0.75)]"
                    : dimmed
                      ? "scale-95 opacity-60 shadow-none"
                      : "shadow-[0_10px_30px_-8px_rgba(217,119,6,0.6)]"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              {i < STEPS.length - 1 && (
                <div className="absolute top-[52px] -right-3 z-20 w-6 h-6 rounded-full bg-[var(--color-brand-golden)] flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className={`mt-4 p-[3px] rounded-[calc(var(--radius-card)+3px)] w-full flex-1 flex transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-br from-[var(--color-brand-golden)]/80 to-[var(--color-brand-crust)]/60 -translate-y-1"
                    : "bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
                } ${dimmed ? "opacity-60" : "opacity-100"}`}
              >
                <div
                  className={`rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 w-full flex flex-col gap-2 transition-shadow duration-300 ${
                    active ? "shadow-[var(--shadow-card)]" : ""
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold text-[var(--color-brand-golden)] uppercase tracking-[0.2em]">
                    Step {step}
                  </span>
                  <h3
                    className={`font-bold transition-colors ${
                      active
                        ? "text-[var(--color-brand-crust)]"
                        : "text-[var(--color-ink)]"
                    }`}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical with connectors */}
      <div className="md:hidden flex flex-col gap-3">
        {STEPS.map(({ Icon, step, title, description }, i) => {
          const active = hovered === i;
          return (
            <div
              key={step}
              className="relative"
              onTouchStart={() => setHovered(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full bg-[var(--color-brand-golden)] text-white flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      active ? "scale-110" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 w-0.5 bg-[var(--color-brand-golden)]/30 my-2" />
                  )}
                </div>
                <div
                  className={`flex-1 p-[3px] rounded-[calc(var(--radius-card)+3px)] mb-2 transition-colors duration-300 ${
                    active
                      ? "bg-gradient-to-br from-[var(--color-brand-golden)]/80 to-[var(--color-brand-crust)]/60"
                      : "bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
                  }`}
                >
                  <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
                    <span className="font-mono text-[10px] font-bold text-[var(--color-brand-golden)] uppercase tracking-[0.2em]">
                      Step {step}
                    </span>
                    <h3
                      className={`font-bold mt-1 transition-colors ${
                        active
                          ? "text-[var(--color-brand-crust)]"
                          : "text-[var(--color-ink)]"
                      }`}
                    >
                      {title}
                    </h3>
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mt-1.5">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
