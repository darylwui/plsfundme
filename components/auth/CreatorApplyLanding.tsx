"use client";

import { useState } from "react";
import { CreatorApplyForm } from "@/components/auth/CreatorApplyForm";

interface CreatorApplyLandingProps {
  userId: string;
}

export function CreatorApplyLanding({ userId }: CreatorApplyLandingProps) {
  const [mode, setMode] = useState<"manual" | "success">("manual");

  if (mode === "success") {
    return (
      <div className="text-center flex flex-col items-center gap-4 py-16">
        <div className="text-6xl">🎉</div>
        <h1 className="font-bold text-2xl text-[var(--color-ink)]">Application submitted!</h1>
        <p className="text-sm text-[var(--color-ink-muted)] max-w-sm">
          We&apos;ll review your application within <strong>1–2 business days</strong> and notify you by email once a decision has been made.
        </p>
        <a
          href="/dashboard"
          className="mt-2 text-sm font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          Go to dashboard →
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
          Apply as a Creator 🚀
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1.5">
          Tell us about yourself and your campaign plan. We&apos;ll review your application within 1–2 business days.
        </p>
      </div>
      <CreatorApplyForm userId={userId} onSuccess={() => setMode("success")} />
    </>
  );
}
