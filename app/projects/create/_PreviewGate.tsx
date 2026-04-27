"use client";

import Link from "next/link";
import { ImageIcon, Lock } from "lucide-react";

// A static, non-interactive preview of the campaign creation Step 1 form.
// Shown to unauthenticated visitors so they understand the creation flow
// before committing to sign up.

export function CampaignPreviewGate() {
  return (
    <main className="flex-1 bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Step indicator — static visual */}
        <div className="flex items-center gap-0 mb-8">
          {["Basics", "Funding", "Milestones", "Rewards", "Review"].map(
            (label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${
                        i === 0
                          ? "bg-[var(--color-brand-crust)]/10 border-2 border-[var(--color-brand-crust)] text-[var(--color-brand-crust)]"
                          : "bg-[var(--color-surface-overlay)] border-2 border-[var(--color-border)] text-[var(--color-ink-subtle)]"
                      }
                    `}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-sm font-semibold hidden sm:block ${
                      i === 0
                        ? "text-[var(--color-ink)]"
                        : "text-[var(--color-ink-subtle)]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 4 && (
                  <div className="h-0.5 w-8 sm:w-12 mx-2 rounded-full bg-[var(--color-border)]" />
                )}
              </div>
            )
          )}
        </div>

        {/* Form preview + overlay wrapper */}
        <div className="relative">
          {/* Static form fields — disabled, no event handlers */}
          <div
            className="flex flex-col gap-6 pointer-events-none select-none"
            aria-hidden="true"
          >
            <div>
              <h2 className="text-2xl font-black text-[var(--color-ink)]">
                Tell us about your project
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                A compelling title and description help backers understand your vision.
              </p>
            </div>

            {/* Project title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-ink)]">
                Project title
              </label>
              <input
                disabled
                readOnly
                placeholder="e.g. EcoBottle: The last water bottle you'll ever buy"
                className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)]"
              />
              <p className="text-xs text-[var(--color-ink-subtle)]">
                60 characters or fewer works best. Be specific about what you're building.
              </p>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-ink)]">
                Category
              </label>
              <select
                disabled
                className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink-subtle)]"
              >
                <option>Select a category…</option>
              </select>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                Choose the category that best matches your project.
              </p>
            </div>

            {/* Short description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-ink)]">
                Short description{" "}
                <span className="text-[var(--color-ink-subtle)] font-normal">
                  (shown on cards)
                </span>
              </label>
              <textarea
                disabled
                readOnly
                rows={2}
                placeholder="One or two punchy sentences that sum up your project."
                className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm resize-none bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)]"
              />
              <p className="text-xs text-[var(--color-ink-subtle)]">
                Hook readers in 20–200 characters. Answer: What is this, and why should I care?
              </p>
            </div>

            {/* Campaign story — placeholder block */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-ink)]">
                Campaign story
              </label>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                Tell backers your story. What's the problem you're solving? Why are you building this?
              </p>
              <div className="min-h-[180px] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <div className="h-3 w-3/4 rounded bg-[var(--color-border)] mb-3" />
                <div className="h-3 w-full rounded bg-[var(--color-border)] mb-2" />
                <div className="h-3 w-5/6 rounded bg-[var(--color-border)] mb-2" />
                <div className="h-3 w-2/3 rounded bg-[var(--color-border)]" />
              </div>
            </div>

            {/* Cover image */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-ink)]">
                Cover image
              </label>
              <div className="w-full rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-12 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-[var(--color-ink-subtle)]" />
                <span className="text-sm text-[var(--color-ink-subtle)]">
                  Upload a cover image
                </span>
                <span className="text-xs text-[var(--color-ink-subtle)]">
                  Recommended: 1280×720px (16:9)
                </span>
              </div>
            </div>

            {/* Next button */}
            <div className="flex justify-end pt-2">
              <div className="px-6 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] text-white text-sm font-semibold opacity-50">
                Next: Funding goal
              </div>
            </div>
          </div>

          {/* Blur + CTA overlay */}
          <div className="absolute inset-0 backdrop-blur-[3px] bg-[var(--color-surface-raised)]/60 rounded-[var(--radius-card)] flex items-start justify-center pt-16 sm:pt-24 px-4">
            <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-lg p-8 flex flex-col items-center gap-5 text-center">
              {/* Lock icon */}
              <div className="w-14 h-14 rounded-full bg-[var(--color-brand-golden)]/10 flex items-center justify-center">
                <Lock className="w-7 h-7 text-[var(--color-brand-golden)]" />
              </div>

              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)]">
                  Ready to launch your campaign?
                </h2>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  Create a free account to get started. Takes less than 2 minutes.
                </p>
              </div>

              <Link
                href="/sign-up?redirectTo=/projects/create"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[var(--radius-btn)] bg-[var(--color-brand-golden)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Create free account
              </Link>

              <p className="text-xs text-[var(--color-ink-muted)]">
                Already have an account?{" "}
                <Link
                  href="/login?redirectTo=/projects/create"
                  className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-crust)] transition-colors underline underline-offset-2"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
