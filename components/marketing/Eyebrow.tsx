import { cn } from "@/lib/utils";

type EyebrowVariant = "crust-dark" | "brand" | "golden" | "muted";
type EyebrowSize = "sm" | "md";

const VARIANT_CLASSES: Record<EyebrowVariant, string> = {
  "crust-dark": "text-[var(--color-brand-crust-dark)]",
  brand: "text-[var(--color-brand-crust)]",
  golden: "text-[var(--color-brand-golden)]",
  muted: "text-[var(--color-ink-muted)]",
};

const SIZE_CLASSES: Record<EyebrowSize, string> = {
  sm: "text-[10px] tracking-[0.2em]",
  md: "text-[11px] tracking-[0.22em]",
};

/**
 * Mono-font, uppercase, wide-tracking section label.
 * Sits above every section's display heading throughout the marketing surface.
 *
 * @example
 *   <Eyebrow>The founding cohort</Eyebrow>
 *   <Eyebrow variant="golden" size="sm">Public launch · 14 March 2026</Eyebrow>
 */
export function Eyebrow({
  children,
  variant = "crust-dark",
  size = "md",
  className,
  as: Component = "div",
}: {
  children: React.ReactNode;
  variant?: EyebrowVariant;
  size?: EyebrowSize;
  className?: string;
  as?: "div" | "span" | "p";
}) {
  return (
    <Component
      className={cn(
        "font-mono font-semibold uppercase",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
    >
      {children}
    </Component>
  );
}
