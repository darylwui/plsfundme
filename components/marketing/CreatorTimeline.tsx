"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Search, Target, Package, type LucideIcon } from "lucide-react";

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

export function CreatorTimeline() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const idx = stepRefs.current.indexOf(visible[0].target as HTMLDivElement);
          if (idx >= 0) setActiveIdx(idx);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));

    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative pl-16 sm:pl-24">
      {/* Rail */}
      <div className="absolute left-5 sm:left-8 top-4 bottom-4 w-0.5 bg-[var(--color-border)] rounded-full">
        <div
          className="absolute top-0 left-0 w-full bg-[var(--color-brand-crust)] rounded-full transition-all duration-150 ease-out"
          style={{ height: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-16 sm:gap-24">
        {STEPS.map(({ Icon, step, title, description }, i) => {
          const isActive = i === activeIdx;
          const isPassed = i < activeIdx;
          return (
            <div
              key={step}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="relative"
            >
              <div
                className={`absolute -left-16 sm:-left-24 top-0 w-11 h-11 rounded-full flex items-center justify-center font-black text-sm transition-all duration-400 ${
                  isActive
                    ? "bg-[var(--color-brand-crust)] text-white scale-110 shadow-[var(--shadow-cta)]"
                    : isPassed
                    ? "bg-[var(--color-brand-crust)] text-white"
                    : "bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-ink-muted)]"
                }`}
              >
                {step}
              </div>

              <div
                className={`rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-6 sm:p-8 transition-all duration-500 ${
                  isActive
                    ? "border-[var(--color-brand-crust)]/40 shadow-[var(--shadow-card)]"
                    : "border-[var(--color-border)] opacity-70"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive || isPassed
                        ? "text-[var(--color-brand-crust)]"
                        : "text-[var(--color-ink-muted)]"
                    }`}
                  />
                  <h3 className="text-xl font-black text-[var(--color-ink)]">{title}</h3>
                </div>
                <p className="text-[var(--color-ink-muted)] leading-relaxed">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
