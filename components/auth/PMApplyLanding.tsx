"use client";

import { useState } from "react";
import { PMApplyForm } from "@/components/auth/PMApplyForm";

interface PMApplyLandingProps {
  userId: string;
}

export function PMApplyLanding({ userId }: PMApplyLandingProps) {
  const [mode, setMode] = useState<"select" | "manual">("select");

  if (mode === "manual") {
    return (
      <>
        <div className="mb-8">
          <button
            onClick={() => setMode("select")}
            className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors mb-5"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
            Apply as Project Manager 🚀
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1.5">
            Tell us about yourself and your campaign plan. We&apos;ll review your application within 1–2 business days.
          </p>
        </div>
        <PMApplyForm userId={userId} />
      </>
    );
  }

  // Selection screen
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
          Apply as Project Manager 🚀
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1.5">
          Choose how you&apos;d like to verify your identity and submit your application.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Singpass option */}
        <div className="relative rounded-[var(--radius-card)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-6 opacity-60 cursor-not-allowed select-none">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-2xl">
              🇸🇬
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-[var(--color-ink)]">Verify with Singpass</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Coming soon
                </span>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Instantly verify your identity using your Singpass / MyInfo. No documents to upload — your NRIC and personal details are prefilled automatically.
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {["Instant identity verification", "NRIC & personal details auto-filled", "Highest trust level with backers"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 w-full flex items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink-muted)]">
            <span>🇸🇬</span>
            Verify with Singpass (Coming soon)
          </div>
        </div>

        {/* Manual option */}
        <button
          type="button"
          onClick={() => setMode("manual")}
          className="rounded-[var(--radius-card)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-left hover:border-[var(--color-brand-violet)] hover:bg-[var(--color-surface-raised)] transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-violet)]/10 flex items-center justify-center shrink-0 text-2xl">
              📝
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--color-ink)] group-hover:text-[var(--color-brand-violet)] transition-colors">
                Apply manually
              </p>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Fill in your profile, background, and campaign plan yourself. Optionally upload an ID document for faster verification.
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {["Tell us about yourself & your project", "Optional ID document upload", "Reviewed within 1–2 business days"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                    <span className="w-4 h-4 rounded-full bg-[var(--color-brand-violet)]/10 text-[var(--color-brand-violet)] flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 w-full flex items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand-violet)] px-4 py-2.5 text-sm font-semibold text-white group-hover:bg-[#7A3409] transition-colors">
            Start manual application →
          </div>
        </button>
      </div>

      <p className="text-xs text-center text-[var(--color-ink-subtle)]">
        By applying you agree to our{" "}
        <a href="/terms" className="underline hover:text-[var(--color-ink)]">Terms</a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-[var(--color-ink)]">Privacy Policy</a>.
      </p>
    </div>
  );
}
