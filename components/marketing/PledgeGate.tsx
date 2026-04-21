"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

type PledgeCtx = {
  progress: number;
  unlocked: boolean;
  bump: () => void;
};

const Ctx = createContext<PledgeCtx>({
  progress: 0,
  unlocked: false,
  bump: () => {},
});

const PLEDGE_STEP = 25;
const GOAL = 100;

export function PledgeProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const bump = () => setProgress((p) => Math.min(GOAL, p + PLEDGE_STEP));
  return (
    <Ctx.Provider value={{ progress, unlocked: progress >= GOAL, bump }}>
      {children}
    </Ctx.Provider>
  );
}

// ───────────────────────────────────────────────
// Interactive pledge widget + gated split panel
// ───────────────────────────────────────────────
export function PledgeDemo({ splitPanel }: { splitPanel: ReactNode }) {
  const { progress, unlocked, bump } = useContext(Ctx);
  const raised = progress; // dollars == percent in this demo
  const clicksLeft = Math.ceil((GOAL - progress) / PLEDGE_STEP);

  return (
    <div className="flex flex-col gap-8">
      {/* Widget */}
      <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-gradient-to-br from-[var(--color-brand-golden)]/50 to-[var(--color-brand-crust)]/50">
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-crust)]">
            <Sparkles className="w-3.5 h-3.5" />
            Try it — see how protection kicks in
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6 md:gap-10 items-center">
            {/* Left: campaign summary + progress */}
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  Bread truck Kickstart
                </p>
                <p className="text-xs font-mono text-[var(--color-ink-subtle)] uppercase tracking-wider">
                  $25 per pledge
                </p>
              </div>

              <div className="mt-3 relative h-3 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-brand-golden)] to-[var(--color-brand-crust)] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-mono text-[var(--color-ink-muted)]">
                  <span className="text-[var(--color-ink)] font-bold">${raised}</span> raised
                  <span className="text-[var(--color-ink-subtle)]"> / ${GOAL} goal</span>
                </span>
                <span
                  className={`font-mono font-bold transition-colors ${
                    unlocked ? "text-[var(--color-brand-golden)]" : "text-[var(--color-ink-subtle)]"
                  }`}
                >
                  {progress}%
                </span>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="shrink-0 w-full md:w-auto">
              {!unlocked ? (
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
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-golden)]/15 text-[var(--color-brand-golden)] font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Goal reached!
                </div>
              )}
            </div>
          </div>

          <p
            className={`mt-5 text-xs text-[var(--color-ink-muted)] transition-opacity duration-500 ${
              unlocked ? "opacity-100" : "opacity-70"
            }`}
          >
            {unlocked
              ? "🎉 Campaign hit its goal — scroll on to see exactly what happens next."
              : "Click pledge a few times to fund this demo campaign and unlock the rest of the page."}
          </p>
        </div>
      </div>

      {/* Split panel (fades in at 100%) */}
      <div
        className={`transition-all duration-700 ease-out ${
          unlocked
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-hidden={!unlocked}
      >
        {splitPanel}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Wrapper for locked sections — fades in with
// optional stagger once the campaign is funded.
// ───────────────────────────────────────────────
export function RevealOnUnlock({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const { unlocked } = useContext(Ctx);
  return (
    <div
      className={`transition-all duration-700 ease-out ${
        unlocked
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6 pointer-events-none"
      }`}
      style={{ transitionDelay: unlocked ? `${delay}ms` : "0ms" }}
      aria-hidden={!unlocked}
    >
      {children}
    </div>
  );
}
