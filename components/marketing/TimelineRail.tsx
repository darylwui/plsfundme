import { cn } from "@/lib/utils";

export type TimelineStep = {
  /** Optional small label like "Step 01" or "Week 1". Leave blank to suppress. */
  label?: string;
  /** Step heading. */
  title: string;
  /** Optional supporting copy. */
  description?: React.ReactNode;
  /** Optional icon node rendered inside the rail node. Falls back to step number. */
  icon?: React.ReactNode;
};

type TimelineVariant = "vertical" | "horizontal";

/**
 * Numbered step rail. Shared primitive used across:
 *   • /how-it-works   — backer + creator flows (vertical, 5 steps each)
 *   • /for-creators   — six-week playbook (horizontal, 6 steps)
 *   • /backer-protection — money flow on dark band (horizontal, 5 steps)
 *
 * Vertical variant: a continuous left spine connects circular nodes,
 * with title/description content stacked to the right.
 *
 * Horizontal variant: nodes sit on a horizontal connector, with content
 * stacked below each node.
 *
 * @example
 *   <TimelineRail
 *     variant="vertical"
 *     steps={[
 *       { label: "Step 01", title: "Pledge", description: "..." },
 *       { label: "Step 02", title: "Goal hit?", description: "..." },
 *     ]}
 *   />
 */
export function TimelineRail({
  steps,
  variant = "vertical",
  tone = "light",
  className,
}: {
  steps: TimelineStep[];
  variant?: TimelineVariant;
  /** "light" sits on cream/white; "dark" sits on a near-black ribbon. */
  tone?: "light" | "dark";
  className?: string;
}) {
  if (variant === "horizontal") {
    return <HorizontalRail steps={steps} tone={tone} className={className} />;
  }
  return <VerticalRail steps={steps} tone={tone} className={className} />;
}

function VerticalRail({
  steps,
  tone,
  className,
}: {
  steps: TimelineStep[];
  tone: "light" | "dark";
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "relative pl-12 sm:pl-16",
        // Continuous spine — slightly inset, full height of the list
        "before:absolute before:top-3 before:bottom-3 before:left-4 sm:before:left-6 before:w-[2px] before:rounded-full",
        tone === "dark"
          ? "before:bg-white/15"
          : "before:bg-[var(--color-border)]",
        className
      )}
    >
      {steps.map((step, i) => (
        <li
          key={i}
          className={cn("relative", i < steps.length - 1 && "pb-10 sm:pb-12")}
        >
          {/* Node on the spine */}
          <span
            className={cn(
              "absolute -left-[42px] sm:-left-[58px] top-1 inline-flex items-center justify-center",
              "w-9 h-9 sm:w-11 sm:h-11 rounded-full font-mono text-xs font-black ring-4",
              tone === "dark"
                ? "bg-[var(--color-brand-golden)] text-[var(--color-ink-deep)] ring-[var(--color-ink-deep)]"
                : "bg-[var(--color-brand-crust)] text-white ring-[var(--color-surface-raised)]"
            )}
          >
            {step.icon ?? String(i + 1).padStart(2, "0")}
          </span>

          {/* Content */}
          <div className="min-w-0">
            {step.label && (
              <div
                className={cn(
                  "font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5",
                  tone === "dark"
                    ? "text-[var(--color-brand-golden)]"
                    : "text-[var(--color-brand-crust-dark)]"
                )}
              >
                {step.label}
              </div>
            )}
            <h3
              className={cn(
                "font-black tracking-[-0.02em] text-xl sm:text-2xl m-0",
                tone === "dark" ? "text-white" : "text-[var(--color-ink)]"
              )}
            >
              {step.title}
            </h3>
            {step.description && (
              <div
                className={cn(
                  "mt-2.5 text-sm sm:text-base leading-[1.55] max-w-prose",
                  tone === "dark"
                    ? "text-white/70"
                    : "text-[var(--color-ink-muted)]"
                )}
              >
                {step.description}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function HorizontalRail({
  steps,
  tone,
  className,
}: {
  steps: TimelineStep[];
  tone: "light" | "dark";
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "relative grid gap-x-6 gap-y-10",
        // 1 column on small, scale up to N columns. We let CSS variables drive
        // count so callers can pass 4/5/6 by adding a className like
        // [--tl-cols:5] to the wrapper.
        "[grid-template-columns:repeat(var(--tl-cols,5),minmax(0,1fr))] max-md:[grid-template-columns:1fr]",
        // Connector line behind nodes — visible only at md+ where rail is horizontal
        "before:hidden md:before:block before:absolute before:top-[18px] before:left-[6%] before:right-[6%] before:h-[2px] before:rounded-full",
        tone === "dark"
          ? "before:bg-white/15"
          : "before:bg-[var(--color-border)]",
        className
      )}
    >
      {steps.map((step, i) => (
        <li key={i} className="relative flex flex-col items-center text-center">
          {/* Node */}
          <span
            className={cn(
              "relative inline-flex items-center justify-center",
              "w-9 h-9 sm:w-10 sm:h-10 rounded-full font-mono text-xs font-black ring-4",
              tone === "dark"
                ? "bg-[var(--color-brand-golden)] text-[var(--color-ink-deep)] ring-[var(--color-ink-deep)]"
                : "bg-[var(--color-brand-crust)] text-white ring-[var(--color-surface-raised)]"
            )}
          >
            {step.icon ?? String(i + 1).padStart(2, "0")}
          </span>

          <div className="mt-4 max-w-[24ch]">
            {step.label && (
              <div
                className={cn(
                  "font-mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5",
                  tone === "dark"
                    ? "text-[var(--color-brand-golden)]"
                    : "text-[var(--color-brand-crust-dark)]"
                )}
              >
                {step.label}
              </div>
            )}
            <h3
              className={cn(
                "font-black tracking-[-0.02em] text-base sm:text-lg m-0",
                tone === "dark" ? "text-white" : "text-[var(--color-ink)]"
              )}
            >
              {step.title}
            </h3>
            {step.description && (
              <div
                className={cn(
                  "mt-2 text-sm leading-[1.5]",
                  tone === "dark"
                    ? "text-white/70"
                    : "text-[var(--color-ink-muted)]"
                )}
              >
                {step.description}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
