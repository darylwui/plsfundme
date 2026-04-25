"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, BookOpen, ArrowRight } from "lucide-react";

const STORAGE_KEY = "gtb-launch-guide-v1";
const TITLE_KEY = "gtb-launch-guide-title-v1";
const DEFAULT_TITLE = "The world's best idea!";

type Item = { id: string; label: string; spec: string; editable?: boolean };
type Section = { id: string; title: string; intro: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    id: "basics",
    title: "Campaign basics",
    intro: "These are the first fields in the campaign creation wizard.",
    items: [
      {
        id: "title",
        label: "Project title",
        spec: "5–100 characters. Clear and specific beats clever — backers skim fast.",
        editable: true,
      },
      {
        id: "short_desc",
        label: "Short description",
        spec: "20–200 characters. The hook that appears in search results and Explore cards.",
      },
      {
        id: "cover_image",
        label: "Cover image",
        spec: "1200×675 px, JPG or PNG, under 2 MB. Your campaign's first impression — make it count.",
      },
      {
        id: "full_desc",
        label: "Full description",
        spec: "Tell the story: what it is, why it matters, what backers receive. Minimum 50 characters.",
      },
      {
        id: "category",
        label: "Category",
        spec: "Pick the one that fits best — it determines where your campaign appears on Explore.",
      },
    ],
  },
  {
    id: "funding",
    title: "Funding goal & deadline",
    intro: "You can only reach your goal — you can't raise more than your target.",
    items: [
      {
        id: "goal",
        label: "Funding goal (SGD)",
        spec: "Minimum SGD 500, maximum SGD 10,000,000. Aim for what you genuinely need to deliver.",
      },
      {
        id: "deadline",
        label: "Campaign deadline",
        spec: "Must be a future date. Most campaigns run 30–60 days — shorter creates urgency.",
      },
    ],
  },
  {
    id: "rewards",
    title: "Reward tiers",
    intro: "You need at least one tier. Think carefully about what each tier costs you to fulfil.",
    items: [
      {
        id: "reward_title",
        label: "Tier title",
        spec: 'What backers call what they\'re getting. E.g. "Early bird", "Supporter", "Founding member".',
      },
      {
        id: "reward_pledge",
        label: "Minimum pledge amount",
        spec: "The lowest amount that unlocks this tier. Factor in delivery costs.",
      },
      {
        id: "reward_desc",
        label: "Tier description",
        spec: "What backers actually receive. Be specific — vague promises erode trust and increase disputes.",
      },
      {
        id: "reward_delivery",
        label: "Estimated delivery date",
        spec: "Optional but strongly recommended. Sets expectations on when backers receive their reward.",
      },
      {
        id: "reward_physical",
        label: "Physical item flag",
        spec: "Check this if you're shipping something physical. Backers see it before they pledge.",
      },
      {
        id: "reward_cap",
        label: "Max backers cap",
        spec: "Optional. Use for limited-edition runs or capacity-constrained experiences.",
      },
    ],
  },
  {
    id: "milestones",
    title: "Milestones & payouts",
    intro:
      "Funds are released in three stages as you hit milestones — not all at once. Plan your deliverables before you launch.",
    items: [
      {
        id: "m1",
        label: "Milestone 1 — first deliverable (40% of funds)",
        spec: "Your first concrete proof of progress. Photos, prototypes, signed supplier agreements — anything verifiable.",
      },
      {
        id: "m2",
        label: "Milestone 2 — mid-project proof (40% of funds)",
        spec: "Show the project advancing. This is the largest release, so the proof needs to match.",
      },
      {
        id: "m3",
        label: "Milestone 3 — final delivery (20% of funds)",
        spec: "Completion proof: rewards shipped, build delivered, or service rendered. Closes out the campaign.",
      },
    ],
  },
  {
    id: "submit",
    title: "After you submit",
    intro: "Once you submit, the campaign goes into admin review before it goes live.",
    items: [
      {
        id: "review",
        label: "Admin review",
        spec: "We review within 2–3 business days. You'll get an email when approved or if changes are needed.",
      },
      {
        id: "live",
        label: "You're live",
        spec: "Once approved, your campaign page is public and backers can start pledging.",
      },
    ],
  },
];

const TOTAL_ITEMS = SECTIONS.reduce((acc, s) => acc + s.items.length, 0);

// useSyncExternalStore subscribe stub — localStorage is not a push source;
// we only need the client/server snapshot split for hydration safety.
const noop = () => () => {};

function getCheckedSnapshot(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}
const emptySet = new Set<string>();

function getTitleSnapshot(): string {
  try {
    return localStorage.getItem(TITLE_KEY) ?? DEFAULT_TITLE;
  } catch {
    return DEFAULT_TITLE;
  }
}

// Returns true on client, false on server — used instead of a mounted effect.
function getIsClient() {
  return true;
}

export default function LaunchGuidePage() {
  // useSyncExternalStore gives the server snapshot during SSR and the client
  // snapshot after hydration — no setState-in-effect needed.
  const mounted = useSyncExternalStore(noop, getIsClient, () => false);
  const storedChecked = useSyncExternalStore(noop, getCheckedSnapshot, () => emptySet);
  const storedTitle = useSyncExternalStore(noop, getTitleSnapshot, () => DEFAULT_TITLE);
  const [checked, setChecked] = useState<Set<string>>(() => storedChecked);
  const [projectTitle, setProjectTitle] = useState<string>(() => storedTitle);

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
  const pct = TOTAL_ITEMS > 0 ? Math.round((doneCount / TOTAL_ITEMS) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)] print:bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 print:py-8">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 mb-4 print:hidden">
            <BookOpen className="w-4 h-4 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
              Creator launch guide
            </span>
          </div>
          <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
            Everything you need before you hit launch
          </h1>
          <p className="mt-3 text-[var(--color-ink-muted)] text-lg leading-relaxed">
            Run through this checklist before you open the campaign wizard. The more prepared
            you are, the faster your review goes — and the stronger your campaign looks to
            backers from day one.
          </p>
        </div>

        {/* Progress bar — hidden until mounted to avoid hydration flash */}
        {mounted && (
          <div className="mb-10 print:hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                {doneCount} of {TOTAL_ITEMS} items ready
              </span>
              <span className="text-sm text-[var(--color-ink-muted)]">{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--color-border)]">
              <div
                className="h-2 rounded-full bg-[var(--color-brand-golden)] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            {doneCount === TOTAL_ITEMS && (
              <p className="mt-3 text-sm font-semibold text-[var(--color-brand-crust)]">
                You&apos;re ready — head to the campaign wizard and launch. 🎉
              </p>
            )}
          </div>
        )}

        {/* Checklist sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <h2 className="text-xl font-black text-[var(--color-ink)] mb-1">
                {section.title}
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mb-4">{section.intro}</p>
              <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden print:border-[#ccc]">
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
                          className="mt-0.5 shrink-0 print:hidden"
                          aria-label={done ? "Uncheck project title" : "Check project title"}
                        >
                          {done ? (
                            <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-golden)]" />
                          ) : (
                            <Circle className="w-5 h-5 text-[var(--color-border)]" />
                          )}
                        </button>
                        <span className="hidden print:inline-block w-4 h-4 border border-[#999] rounded-sm shrink-0 mt-0.5" />
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
                      className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-raised)] print:pointer-events-none ${
                        done ? "opacity-60" : ""
                      }`}
                    >
                      <span className="mt-0.5 shrink-0 print:hidden">
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-golden)]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[var(--color-border)]" />
                        )}
                      </span>
                      <span className="hidden print:inline-block w-4 h-4 border border-[#999] rounded-sm shrink-0 mt-0.5" />
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
          ))}
        </div>

        {/* Print tip */}
        <p className="mt-8 text-xs text-center text-[var(--color-ink-subtle)] print:hidden">
          Want a copy to refer to offline? Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-border)] font-mono text-xs">
            ⌘P
          </kbd>{" "}
          and save as PDF.
        </p>

        {/* CTA */}
        <div className="mt-12 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] px-8 py-8 text-center print:hidden">
          <h3 className="text-xl font-black text-white mb-2">Ready to launch?</h3>
          <p className="text-sm text-white/75 mb-5">
            Open the campaign wizard — you&apos;ve got everything you need.
          </p>
          <Link
            href="/projects/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-brand-golden)] text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Start your campaign <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center print:hidden">
          <Link
            href="/for-creators"
            className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            ← Back to For Creators
          </Link>
        </div>
      </div>
    </div>
  );
}
