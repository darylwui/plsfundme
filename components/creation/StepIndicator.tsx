import { Check } from "lucide-react";
import type { CreationStep } from "@/hooks/useProjectCreation";

const STEPS = [
  { number: 1 as CreationStep, label: "Basics" },
  { number: 2 as CreationStep, label: "Funding" },
  { number: 3 as CreationStep, label: "Rewards" },
  { number: 4 as CreationStep, label: "Review" },
];

interface StepIndicatorProps {
  current: CreationStep;
  onGoTo?: (step: CreationStep) => void;
}

export function StepIndicator({ current, onGoTo }: StepIndicatorProps) {
  return (
    <nav aria-label="Campaign creation progress">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isComplete = step.number < current;
          const isActive = step.number === current;
          const canNavigate = isComplete && onGoTo;

          return (
            <li key={step.number} className="flex items-center">
              <button
                type="button"
                onClick={() => canNavigate && onGoTo(step.number)}
                disabled={!canNavigate}
                className={`
                  flex items-center gap-2.5
                  ${canNavigate ? "cursor-pointer" : "cursor-default"}
                `}
              >
                {/* Circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${
                      isComplete
                        ? "bg-[var(--color-brand-violet)] text-white"
                        : isActive
                        ? "bg-[var(--color-brand-violet)]/10 border-2 border-[var(--color-brand-violet)] text-[var(--color-brand-violet)]"
                        : "bg-[var(--color-surface-overlay)] border-2 border-[var(--color-border)] text-[var(--color-ink-subtle)]"
                    }
                  `}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : step.number}
                </div>

                <span
                  className={`text-sm font-semibold hidden sm:block ${
                    isActive
                      ? "text-[var(--color-ink)]"
                      : isComplete
                      ? "text-[var(--color-ink-muted)]"
                      : "text-[var(--color-ink-subtle)]"
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 sm:w-12 mx-2 rounded-full transition-all ${
                    step.number < current
                      ? "bg-[var(--color-brand-violet)]"
                      : "bg-[var(--color-border)]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
