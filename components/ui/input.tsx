"use client";

import { type InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** When true and type="password", renders a show/hide toggle button. */
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, type, showPasswordToggle, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";
    const showToggle = isPassword && showPasswordToggle;
    const effectiveType = showToggle && revealed ? "text" : type;

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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={`
              w-full rounded-[var(--radius-btn)] border px-3.5 py-2.5 text-sm
              bg-[var(--color-surface)] text-[var(--color-ink)]
              placeholder:text-[var(--color-ink-subtle)]
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${showToggle ? "pr-10" : ""}
              ${error
                ? "border-[var(--color-brand-danger)] focus:ring-[var(--color-brand-danger)]"
                : "border-[var(--color-border)] hover:border-[var(--color-ink-subtle)]"
              }
              ${className}
            `}
            {...props}
          />
          {showToggle && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              tabIndex={-1}
              aria-label={revealed ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] transition-colors"
            >
              {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-[var(--color-brand-danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-ink-subtle)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
