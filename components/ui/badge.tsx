import { type HTMLAttributes } from "react";

type BadgeVariant = "violet" | "coral" | "teal" | "amber" | "lime" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "violet",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    coral: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
    teal: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    lime: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
    neutral: "bg-[var(--color-surface-overlay)] text-[var(--color-ink-muted)]",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5
        text-xs font-semibold rounded-full
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
