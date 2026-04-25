"use client";

import { ArrowUp } from "lucide-react";

interface BackToTopProps {
  className?: string;
  label?: string;
}

export function BackToTop({ className = "", label = "Back to top" }: BackToTopProps) {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-ink-subtle)] transition-colors ${className}`}
    >
      <ArrowUp className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
