"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "inverse";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  /**
   * When true, the Button delegates rendering to its child element via
   * Radix Slot — useful for wrapping a `<Link>` so the rendered element
   * is a real `<a>` (valid HTML, single focus stop, real keyboard target)
   * while still inheriting Button styles. Slot expects exactly one child.
   *
   * Constraints when `asChild` is true:
   * - `loading` is ignored (Slot can't accept a sibling spinner without
   *   breaking its single-child rule, and links don't have loading states
   *   in practice — submit buttons that need it should not use asChild).
   * - `disabled` has no effect on `<a>` (HTML doesn't allow it). For
   *   navigation guards, conditionally render the link instead.
   */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      asChild = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-btn)] transition-[color,background-color,border-color,box-shadow,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-crust)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-[var(--color-brand-crust)] text-white hover:bg-[var(--color-brand-crust-dark)] active:scale-[0.98] active:shadow-none shadow-[var(--shadow-cta)]",
      secondary:
        "bg-[var(--color-surface-overlay)] text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-border)] active:scale-[0.98]",
      ghost:
        "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-overlay)] active:scale-[0.98]",
      danger:
        "bg-[var(--color-brand-danger)] text-white hover:bg-red-700 active:scale-[0.98]",
      inverse:
        "bg-white text-[var(--color-brand-crust)] hover:bg-[var(--color-brand-crust)] hover:text-white active:scale-[0.98] active:bg-[var(--color-brand-crust-dark)] active:shadow-none shadow-lg",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5 h-8",
      md: "text-sm px-4 py-2 h-10",
      lg: "text-base px-6 py-3 h-12",
    };

    const composedClassName = `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;

    if (asChild) {
      // Slot delegates to the child element — typically a Next/Link — so
      // the rendered DOM is a real <a>. We forward className and ref but
      // skip loading-spinner injection (would break Slot's single-child
      // rule) and the disabled HTML attribute (no-op on <a>).
      return (
        <Slot ref={ref} className={composedClassName} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={composedClassName}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
