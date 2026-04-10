"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-ink)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-[var(--radius-btn)] border px-3.5 py-2.5 text-sm
            bg-[var(--color-surface)] text-[var(--color-ink)]
            placeholder:text-[var(--color-ink-subtle)]
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? "border-[var(--color-brand-coral)] focus:ring-[var(--color-brand-coral)]"
              : "border-[var(--color-border)] hover:border-[var(--color-ink-subtle)]"
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-brand-coral)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-ink-subtle)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
