"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";

type Status = "running" | "success" | "missed";

const GOAL = 100;
const PLEDGE_STEP = 25;
const DEMO_SECONDS = 30;

export function PledgeTimelineDemo() {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEMO_SECONDS);
  const [status, setStatus] = useState<Status>("running");
  const raised = progress;
  const clicksLeft = Math.ceil((GOAL - progress) / PLEDGE_STEP);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inViewRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pause the interval when the component is scrolled out of view to avoid
  // unnecessary setState calls inflating INP during off-screen interactions.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (status !== "running") {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      if (!inViewRef.current) return;
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;
    if (progress >= GOAL) setStatus("success");
    else if (timeLeft <= 0) setStatus("missed");
  }, [progress, timeLeft, status]);

  const bump = () => {
    if (status !== "running") return;
    setProgress((p) => Math.min(GOAL, p + PLEDGE_STEP));
  };

  const reset = () => {
    setProgress(0);
    setTimeLeft(DEMO_SECONDS);
    setStatus("running");
  };

  const progressBarTone =
    status === "success"
      ? "from-[var(--color-brand-golden)] to-[var(--color-brand-golden)]"
      : status === "missed"
        ? "from-[var(--color-ink-subtle)]/40 to-[var(--color-ink-subtle)]/40"
        : "from-[var(--color-brand-golden)] to-[var(--color-brand-crust)]";

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      {/* Reset control (shown once outcome is decided) — lifted above the widget so it's reachable without scrolling past the outcome cards */}
      {status !== "running" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Want to see the {status === "success" ? "missed-goal" : "goal-reached"}{" "}
            outcome too?
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-btn)] bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] font-semibold text-sm transition-all hover:brightness-95 dark:hover:brightness-110"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Run it again
          </button>
        </div>
      )}

      {/* Widget */}
      <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-gradient-to-br from-[var(--color-brand-golden)]/50 to-[var(--color-brand-crust)]/50">
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 sm:p-8">
          {/* Top strip: eyebrow + deadline */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-crust)]">
              <Sparkles className="w-3.5 h-3.5" />
              Try it — watch the clock tick
            </div>
            <DeadlineBadge timeLeft={timeLeft} status={status} />
          </div>

          {/* Campaign + pledge */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6 md:gap-10 items-center">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  The World&apos;s Best Idea
                </p>
                <p className="text-xs font-mono text-[var(--color-ink-subtle)] uppercase tracking-wider">
                  $25 per pledge
                </p>
              </div>

              <div className="mt-3 relative h-3 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${progressBarTone} transition-all duration-700 ease-out`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-mono text-[var(--color-ink-muted)]">
                  <span className="text-[var(--color-ink)] font-bold">${raised}</span>{" "}
                  raised
                  <span className="text-[var(--color-ink-subtle)]"> / ${GOAL} goal</span>
                </span>
                <span
                  className={`font-mono font-bold transition-colors ${
                    status === "success"
                      ? "text-[var(--color-brand-golden)]"
                      : status === "missed"
                        ? "text-[var(--color-ink-subtle)]"
                        : "text-[var(--color-ink-muted)]"
                  }`}
                >
                  {progress}%
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 w-full md:w-auto">
              {status === "running" ? (
                <button
                  type="button"
                  onClick={bump}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white font-bold text-sm shadow-[var(--shadow-cta)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Pledge $25
                  <span className="text-xs font-mono opacity-80">
                    ({clicksLeft} more)
                  </span>
                </button>
              ) : status === "success" ? (
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-golden)]/15 text-[var(--color-brand-golden)] font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Goal reached
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[var(--radius-btn)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-[var(--color-ink-muted)] font-bold text-sm">
                  <XCircle className="w-4 h-4" />
                  Deadline passed
                </div>
              )}
            </div>
          </div>

          {/* Status strip */}
          <p className="mt-5 text-xs text-[var(--color-ink-muted)] transition-opacity">
            {status === "running" &&
              "Keep pledging before the clock hits zero — or wait it out to see the other outcome."}
            {status === "success" &&
              "🎉 Campaign hit its goal in time — here's what happens next."}
            {status === "missed" &&
              "⏱ Deadline passed before the goal was reached — no one gets charged."}
          </p>
        </div>
      </div>

      {/* Outcome card(s) */}
      {status === "success" && <SuccessCard />}
      {status === "missed" && (
        <>
          <MissCard />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--color-ink-subtle)]">
                What would have happened if it hit
              </span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            <div className="opacity-55 grayscale-[30%] pointer-events-none select-none">
              <SuccessCard />
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// ───────────────────────────────────────────────
// Deadline badge — deliberately loud so the "live clock" reads at a glance
// ───────────────────────────────────────────────
function DeadlineBadge({
  timeLeft,
  status,
}: {
  timeLeft: number;
  status: Status;
}) {
  const urgent = status === "running" && timeLeft <= 4;
  const label =
    status === "running"
      ? `Ends in ${String(timeLeft).padStart(2, "0")}s`
      : status === "success"
        ? "Goal reached"
        : "Deadline passed";

  const tone =
    status === "running"
      ? urgent
        ? "bg-[#dc2626] text-white ring-4 ring-[#dc2626]/30 shadow-[0_0_0_6px_rgba(220,38,38,0.18),0_10px_30px_-8px_rgba(220,38,38,0.6)]"
        : "bg-[#ef4444] text-white ring-2 ring-[#ef4444]/25 shadow-[0_8px_24px_-8px_rgba(239,68,68,0.55)]"
      : status === "success"
        ? "bg-[var(--color-brand-golden)] text-white ring-2 ring-[var(--color-brand-golden)]/25 shadow-[0_8px_24px_-8px_rgba(217,119,6,0.55)]"
        : "bg-[var(--color-ink-subtle)]/20 text-[var(--color-ink-muted)] ring-1 ring-[var(--color-border)]";

  return (
    <div
      className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-mono font-black tracking-wider uppercase transition-all ${tone} ${
        urgent ? "animate-pulse" : ""
      }`}
    >
      {/* Blinking "LIVE" dot when running */}
      {status === "running" && (
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-white/70 animate-ping" />
          <span className="relative w-2 h-2 rounded-full bg-white" />
        </span>
      )}
      <Clock
        className={`w-4 h-4 ${status === "running" ? "animate-[spin_6s_linear_infinite]" : ""}`}
      />
      <span>{label}</span>
    </div>
  );
}

// ───────────────────────────────────────────────
// Outcome cards (single, full-width)
// ───────────────────────────────────────────────
function SuccessCard() {
  return (
    <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-gradient-to-br from-[var(--color-brand-golden)]/50 to-[var(--color-brand-crust)]/50">
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-golden)]/10 text-[var(--color-brand-golden)] text-xs font-bold uppercase tracking-wider w-fit">
          <TrendingUp className="w-3.5 h-3.5" />
          Goal reached
        </div>
        <h3 className="mt-4 text-xl font-black text-[var(--color-ink)]">
          Campaign hit its goal in time
        </h3>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <OutcomeRow
            accent="golden"
            Icon={Check}
            title="You're charged"
            body="Card holds capture · PayNow was already collected"
          />
          <OutcomeRow
            accent="golden"
            Icon={Check}
            title="Creator gets funded"
            body="Funds released within 7–10 business days, minus 5% fee"
          />
          <OutcomeRow
            accent="golden"
            Icon={Check}
            title="Rewards ship"
            body="Creator keeps you posted on delivery timelines"
          />
        </div>
      </div>
    </div>
  );
}

function MissCard() {
  return (
    <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]">
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-[var(--color-ink-muted)] text-xs font-bold uppercase tracking-wider w-fit">
          <XCircle className="w-3.5 h-3.5" />
          Goal missed
        </div>
        <h3 className="mt-4 text-xl font-black text-[var(--color-ink)]">
          Campaign didn&apos;t hit its goal
        </h3>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <OutcomeRow
            accent="neutral"
            Icon={Shield}
            title="You pay nothing"
            body="Card holds released automatically"
          />
          <OutcomeRow
            accent="neutral"
            Icon={RefreshCw}
            title="PayNow refunded"
            body="Full refund within 5–7 business days"
          />
          <OutcomeRow
            accent="neutral"
            Icon={Lock}
            title="Zero risk"
            body="Creator receives nothing — no hidden fees, no fine print"
          />
        </div>
      </div>
    </div>
  );
}

function OutcomeRow({
  accent,
  Icon,
  title,
  body,
}: {
  accent: "golden" | "neutral";
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  const bubble =
    accent === "golden"
      ? "bg-[var(--color-brand-golden)]/15 text-[var(--color-brand-golden)]"
      : "bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-[var(--color-brand-crust)]";
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${bubble}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{body}</p>
      </div>
    </div>
  );
}
