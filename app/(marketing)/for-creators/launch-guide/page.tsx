"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, BookOpen, ArrowRight } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { BackToTop } from "@/components/ui/back-to-top";
import { LAUNCH_SECTIONS, LAUNCH_TOTAL_ITEMS } from "./_data";

const STORAGE_KEY = "gtb-launch-guide-v1";
const TITLE_KEY = "gtb-launch-guide-title-v1";
const DEFAULT_TITLE = "The world's best idea!";

export default function LaunchGuidePage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [projectTitle, setProjectTitle] = useState(DEFAULT_TITLE);
  const [mounted, setMounted] = useState(false);

  // Read persisted state from localStorage on first client render.
  // setState inside an effect is intentional here — this is a one-time sync
  // from an external store (localStorage) on mount, the canonical use case.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored) as string[]));
      const storedTitle = localStorage.getItem(TITLE_KEY);
      if (storedTitle) setProjectTitle(storedTitle);
    } catch {
      // localStorage unavailable (e.g. private browsing with strict settings)
    }
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleTitleChange(val: string) {
    setProjectTitle(val);
    try {
      localStorage.setItem(TITLE_KEY, val);
    } catch {}
  }

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const doneCount = checked.size;
  const pct = LAUNCH_TOTAL_ITEMS > 0 ? Math.round((doneCount / LAUNCH_TOTAL_ITEMS) * 100) : 0;

  const topItemIds = LAUNCH_SECTIONS.slice(0, 3).flatMap((s) => s.items.map((i) => i.id));
  const allTopDone = mounted && topItemIds.every((id) => checked.has(id));
  const UNLOCK_PCT = Math.round((topItemIds.length / LAUNCH_TOTAL_ITEMS) * 100);

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back link — top left */}
        <div className="mb-8">
          <BackLink href="/for-creators">Back to For Creators</BackLink>
        </div>

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 mb-4">
            <BookOpen className="w-4 h-4 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
              Creator launch guide
            </span>
          </div>
          <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
            Everything you need before you launch
          </h1>
          <p className="mt-3 text-[var(--color-ink-muted)] text-lg leading-relaxed">
            This is your prep list. Run through it before you open the campaign form — the
            more ready you are, the stronger your campaign lands on day one.
          </p>
        </div>

        {/* Progress bar — hidden until mounted to avoid hydration flash */}
        {mounted && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                {doneCount} of {LAUNCH_TOTAL_ITEMS} items ready
              </span>
              <span className="text-sm text-[var(--color-ink-muted)]">{pct}%</span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-[var(--color-border)]">
              <div
                className="h-2 rounded-full bg-[var(--color-brand-golden)] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-colors duration-500 ${
                  allTopDone ? "bg-[var(--color-brand-golden)]" : "bg-[var(--color-ink-muted)]"
                }`}
                style={{ left: `${UNLOCK_PCT}%` }}
              />
            </div>
            {doneCount === LAUNCH_TOTAL_ITEMS && (
              <p className="mt-3 text-sm font-semibold text-[var(--color-brand-crust)]">
                You&apos;re ready — head to the campaign form and launch. 🎉
              </p>
            )}
          </div>
        )}

        {/* Checklist sections */}
        <div className="space-y-10">
          {LAUNCH_SECTIONS.map((section, sectionIndex) => {
            const isLocked = sectionIndex >= 3 && !allTopDone;
            return (
            <div
              key={section.id}
              className={`transition-opacity duration-500 ${
                isLocked ? "opacity-40 pointer-events-none select-none" : "opacity-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-[var(--color-ink)]">
                  {section.title}
                </h2>
                {isLocked && (
                  <span className="text-xs font-semibold text-[var(--color-ink-muted)] flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Complete sections above to unlock
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-ink-muted)] mb-4">{section.intro}</p>
              <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden">
                {section.items.map((item) => {
                  const done = mounted && checked.has(item.id);

                  if (item.editable) {
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                          done ? "opacity-60" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          className="mt-0.5 shrink-0"
                          aria-label={done ? `Uncheck: ${item.label}` : `Check: ${item.label}`}
                        >
                          {done ? (
                            <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-golden)]" />
                          ) : (
                            <Circle className="w-5 h-5 text-[var(--color-border)]" />
                          )}
                        </button>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-subtle)] mb-1">
                            {item.label}
                          </span>
                          <input
                            type="text"
                            value={mounted ? projectTitle : DEFAULT_TITLE}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            maxLength={100}
                            placeholder={DEFAULT_TITLE}
                            className={`w-full bg-transparent font-bold text-lg text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] border-b border-dashed border-[var(--color-border)] focus:border-[var(--color-brand-golden)] focus:outline-none py-0.5 transition-colors ${
                              done ? "line-through" : ""
                            }`}
                          />
                          <span className="block text-sm text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                            {item.spec}
                          </span>
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-raised)] ${
                        done ? "opacity-60" : ""
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-golden)]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[var(--color-border)]" />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block font-semibold text-[var(--color-ink)] leading-snug ${
                            done ? "line-through" : ""
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="block text-sm text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">
                          {item.spec}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>

        {/* Download PDF link */}
        <div className="mt-8 flex justify-center">
          <a
            href="/api/launch-guide/pdf"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Download our creator checklist
          </a>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] px-8 py-8 text-center">
          <h3 className="text-xl font-black text-white mb-2">Ready to launch?</h3>
          <p className="text-sm text-white/75 mb-5">
            Open the campaign form — you&apos;ve got everything you need.
          </p>
          <Link
            href="/projects/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-brand-golden)] text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Start your campaign <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Back to top */}
        <div className="mt-8 flex justify-center">
          <BackToTop />
        </div>
      </div>
    </div>
  );
}
