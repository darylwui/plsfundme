"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  CreditCard,
  Gift,
  Shield,
  Check,
  RefreshCw,
  Clock,
  TrendingUp,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Lock,
} from "lucide-react";

const BACKER_STEPS = [
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

// ───────────────────────────────────────────────────────────────
// BACKER OPTION A — Horizontal connected stepper
// ───────────────────────────────────────────────────────────────
function BackerOptionA() {
  return (
    <div className="relative">
      {/* Desktop: horizontal connected cards */}
      <div className="hidden md:grid grid-cols-3 gap-0 relative">
        {/* Connecting line */}
        <div className="absolute top-[58px] left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-[var(--color-brand-golden)]/30 via-[var(--color-brand-golden)] to-[var(--color-brand-golden)]/30" />

        {BACKER_STEPS.map(({ Icon, step, title, description }, i) => (
          <div key={step} className="relative flex flex-col items-center text-center px-4">
            {/* Floating bubble above card */}
            <div className="relative z-10 w-14 h-14 rounded-full bg-[var(--color-brand-golden)] text-white flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(217,119,6,0.6)] ring-4 ring-[var(--color-surface-raised)]">
              <Icon className="w-6 h-6" />
            </div>
            {/* Arrow connector (except last) */}
            {i < BACKER_STEPS.length - 1 && (
              <div className="absolute top-[52px] -right-3 z-20 w-6 h-6 rounded-full bg-[var(--color-brand-golden)] flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="mt-4 p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] w-full">
              <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 h-full flex flex-col gap-2">
                <span className="font-mono text-[10px] font-bold text-[var(--color-brand-golden)] uppercase tracking-[0.2em]">
                  Step {step}
                </span>
                <h3 className="font-bold text-[var(--color-ink)]">{title}</h3>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical with dotted connectors */}
      <div className="md:hidden flex flex-col gap-4">
        {BACKER_STEPS.map(({ Icon, step, title, description }, i) => (
          <div key={step} className="relative">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brand-golden)] text-white flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                {i < BACKER_STEPS.length - 1 && (
                  <div className="flex-1 w-0.5 bg-[var(--color-brand-golden)]/30 my-2" />
                )}
              </div>
              <div className="flex-1 p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] mb-2">
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5">
                  <span className="font-mono text-[10px] font-bold text-[var(--color-brand-golden)] uppercase tracking-[0.2em]">
                    Step {step}
                  </span>
                  <h3 className="font-bold text-[var(--color-ink)] mt-1">{title}</h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mt-1.5">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// BACKER OPTION B — Scroll timeline (mirror of creator)
// ───────────────────────────────────────────────────────────────
function BackerOptionB() {
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
      <div className="absolute left-5 sm:left-8 top-4 bottom-4 w-0.5 bg-[var(--color-border)] rounded-full">
        <div
          className="absolute top-0 left-0 w-full bg-[var(--color-brand-golden)] rounded-full transition-all duration-150 ease-out"
          style={{ height: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-16">
        {BACKER_STEPS.map(({ Icon, step, title, description }, i) => {
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
                    ? "bg-[var(--color-brand-golden)] text-white scale-110 shadow-[0_10px_30px_-8px_rgba(217,119,6,0.6)]"
                    : isPassed
                    ? "bg-[var(--color-brand-golden)] text-white"
                    : "bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-ink-muted)]"
                }`}
              >
                {step}
              </div>

              <div
                className={`rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-6 sm:p-8 transition-all duration-500 ${
                  isActive
                    ? "border-[var(--color-brand-golden)]/40 shadow-[var(--shadow-card)]"
                    : "border-[var(--color-border)] opacity-70"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive || isPassed
                        ? "text-[var(--color-brand-golden)]"
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

// ───────────────────────────────────────────────────────────────
// SAFETY OPTION A — Outcome split (Success vs Miss)
// ───────────────────────────────────────────────────────────────
function SafetyOptionA() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Success path */}
      <div className="relative p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-gradient-to-br from-[var(--color-brand-golden)]/50 to-[var(--color-brand-crust)]/50">
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 h-full flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-golden)]/10 text-[var(--color-brand-golden)] text-xs font-bold uppercase tracking-wider w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            Goal reached
          </div>
          <h3 className="mt-4 text-xl font-black text-[var(--color-ink)]">
            Campaign hits its goal
          </h3>
          <div className="mt-5 flex flex-col gap-3 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-golden)]/15 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-golden)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">You&apos;re charged</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Card holds capture · PayNow was already collected
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-golden)]/15 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-golden)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Creator gets funded</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Funds released within 7–10 business days, minus 5% fee
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-golden)]/15 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-golden)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Rewards ship</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Creator keeps you posted on delivery timelines
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Miss path */}
      <div className="relative p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]">
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 h-full flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-[var(--color-ink-muted)] text-xs font-bold uppercase tracking-wider w-fit">
            <XCircle className="w-3.5 h-3.5" />
            Goal missed
          </div>
          <h3 className="mt-4 text-xl font-black text-[var(--color-ink)]">
            Campaign doesn&apos;t hit its goal
          </h3>
          <div className="mt-5 flex flex-col gap-3 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 text-[var(--color-brand-crust)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">You pay nothing</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Card holds released automatically
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <RefreshCw className="w-3.5 h-3.5 text-[var(--color-brand-crust)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">PayNow refunded</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Full refund within 5–7 business days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-[var(--color-brand-crust)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Zero risk</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Creator receives nothing — no hidden fees, no fine print
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// SAFETY OPTION B — Animated journey flow diagram
// ───────────────────────────────────────────────────────────────
function SafetyOptionB() {
  const [hover, setHover] = useState<"success" | "miss" | null>(null);

  return (
    <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]">
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 sm:p-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crust)]/10 text-[var(--color-brand-crust)] text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            All-or-nothing protection
          </div>
          <h3 className="mt-3 text-xl sm:text-2xl font-black text-[var(--color-ink)]">
            What happens to your pledge?
          </h3>
        </div>

        {/* Flow diagram */}
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-4">
          {/* Node 1: Pledge */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="w-20 h-20 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] flex items-center justify-center shadow-[var(--shadow-cta)]">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <p className="mt-3 text-sm font-bold text-[var(--color-ink)]">You pledge</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 max-w-[12ch]">
              Card or PayNow
            </p>
          </div>

          {/* Connector */}
          <div className="flex items-center gap-1 rotate-90 lg:rotate-0">
            <div className="w-8 lg:w-12 h-0.5 bg-[var(--color-border)]" />
            <ArrowRight className="w-4 h-4 text-[var(--color-ink-subtle)]" />
          </div>

          {/* Node 2: Deadline */}
          <div className="flex flex-col items-center text-center shrink-0">
            <div className="w-20 h-20 rounded-[var(--radius-card)] bg-[var(--color-surface-overlay)] border-2 border-[var(--color-border)] flex items-center justify-center">
              <Clock className="w-8 h-8 text-[var(--color-ink-muted)]" />
            </div>
            <p className="mt-3 text-sm font-bold text-[var(--color-ink)]">Deadline</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 max-w-[14ch]">
              Campaign ends
            </p>
          </div>

          {/* Fork connector */}
          <div className="flex items-center gap-1 rotate-90 lg:rotate-0">
            <div className="w-8 lg:w-12 h-0.5 bg-[var(--color-border)]" />
          </div>

          {/* Two outcome branches */}
          <div className="flex flex-col gap-3 flex-1 w-full">
            <button
              type="button"
              onMouseEnter={() => setHover("success")}
              onMouseLeave={() => setHover(null)}
              className={`group flex items-center gap-4 rounded-[var(--radius-card)] border-2 p-4 text-left transition-all ${
                hover === "success"
                  ? "border-[var(--color-brand-golden)] bg-[var(--color-brand-golden)]/5 shadow-[var(--shadow-card)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand-golden)] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--color-ink)] text-sm">
                  Goal reached → You&apos;re charged, creator gets funded
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Rewards ship; creator receives funds (minus 5% fee)
                </p>
              </div>
            </button>

            <button
              type="button"
              onMouseEnter={() => setHover("miss")}
              onMouseLeave={() => setHover(null)}
              className={`group flex items-center gap-4 rounded-[var(--radius-card)] border-2 p-4 text-left transition-all ${
                hover === "miss"
                  ? "border-[var(--color-brand-crust)] bg-[var(--color-brand-crust)]/5 shadow-[var(--shadow-card)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand-crust)] flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--color-ink)] text-sm">
                  Goal missed → You pay nothing, or get a full refund
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Card holds release · PayNow refunded in 5–7 business days
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom badges */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border)] grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-[var(--color-brand-crust)]">0%</p>
            <p className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider mt-1">
              Risk if goal missed
            </p>
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--color-brand-crust)]">5–7d</p>
            <p className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider mt-1">
              PayNow refund
            </p>
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--color-brand-crust)]">100%</p>
            <p className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider mt-1">
              Funds held secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Page layout
// ───────────────────────────────────────────────────────────────
export default function DraftsPage() {
  return (
    <main className="flex-1 bg-[var(--color-surface-raised)]">
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-crust)]">
            Drafts · Pick what works
          </p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-black text-[var(--color-ink)]">
            How-it-works visual redos
          </h1>
          <p className="mt-3 text-[var(--color-ink-muted)] max-w-xl mx-auto">
            Two options for the backer section, two options for the all-or-nothing
            explainer. Tell me which combo and I&apos;ll ship it.
          </p>
        </div>
      </section>

      {/* Backer A */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-golden)] mb-2">
            Backer · Option A
          </p>
          <h2 className="text-2xl font-black text-[var(--color-ink)]">
            Connected horizontal stepper
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-8">
            3 linked nodes with arrows between them — reads left to right like a journey map.
          </p>
          <BackerOptionA />
        </div>
      </section>

      {/* Backer B */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-golden)] mb-2">
            Backer · Option B
          </p>
          <h2 className="text-2xl font-black text-[var(--color-ink)]">
            Scroll timeline (mirror of creator side)
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-8">
            Same scroll-driven rail pattern used on the creator side, in golden. Symmetric feel.
          </p>
          <BackerOptionB />
        </div>
      </section>

      {/* Safety A */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-crust)] mb-2">
            All-or-nothing · Option A
          </p>
          <h2 className="text-2xl font-black text-[var(--color-ink)]">
            Outcome split — success vs miss
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-8">
            Two side-by-side cards show exactly what happens in each scenario. Makes the protection tangible.
          </p>
          <SafetyOptionA />
        </div>
      </section>

      {/* Safety B */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-crust)] mb-2">
            All-or-nothing · Option B
          </p>
          <h2 className="text-2xl font-black text-[var(--color-ink)]">
            Journey flow diagram with outcome fork
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-8">
            Pledge → deadline → branches into success / miss. Interactive hover on the fork, plus stat badges.
          </p>
          <SafetyOptionB />
        </div>
      </section>
    </main>
  );
}
