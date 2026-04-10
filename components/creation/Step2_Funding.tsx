"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { projectFundingSchema } from "@/lib/validations/project";
import { formatSgd } from "@/lib/utils/currency";
import type { ProjectDraft } from "@/types/project";

interface Step2Props {
  draft: ProjectDraft;
  onUpdate: (partial: Partial<ProjectDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2_Funding({ draft, onUpdate, onNext, onBack }: Step2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleNext() {
    const result = projectFundingSchema.safeParse({
      funding_goal_sgd: draft.funding_goal_sgd,
      start_date: draft.start_date || undefined,
      deadline: draft.deadline,
      payout_mode: draft.payout_mode,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        if (e.path[0]) errs[String(e.path[0])] = e.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    onNext();
  }

  const platformFee = draft.funding_goal_sgd * 0.05;
  const creatorReceives = draft.funding_goal_sgd - platformFee;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-ink)]">
          Set your funding goal
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          This is an all-or-nothing campaign — you only receive funds if the
          goal is met by the deadline.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-ink)]">
          Funding goal (SGD)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-ink-muted)]">
            S$
          </span>
          <input
            type="number"
            min={500}
            step={100}
            placeholder="10,000"
            value={draft.funding_goal_sgd || ""}
            onChange={(e) =>
              onUpdate({ funding_goal_sgd: parseFloat(e.target.value) || 0 })
            }
            className={`
              w-full rounded-[var(--radius-btn)] border pl-9 pr-3.5 py-2.5 text-sm
              bg-[var(--color-surface)] text-[var(--color-ink)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] focus:border-transparent
              ${errors.funding_goal_sgd ? "border-[var(--color-brand-coral)]" : "border-[var(--color-border)]"}
            `}
          />
        </div>
        {errors.funding_goal_sgd && (
          <p className="text-xs text-[var(--color-brand-coral)]">
            {errors.funding_goal_sgd}
          </p>
        )}
      </div>

      {/* Fee breakdown */}
      {draft.funding_goal_sgd > 0 && (
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 text-sm flex flex-col gap-2">
          <h4 className="font-semibold text-[var(--color-ink)]">Fee breakdown</h4>
          <div className="flex justify-between text-[var(--color-ink-muted)]">
            <span>Funding goal</span>
            <span>{formatSgd(draft.funding_goal_sgd)}</span>
          </div>
          <div className="flex justify-between text-[var(--color-ink-muted)]">
            <span>Platform fee (5%)</span>
            <span>- {formatSgd(platformFee)}</span>
          </div>
          <hr className="border-[var(--color-border)]" />
          <div className="flex justify-between font-bold text-[var(--color-ink)]">
            <span>You receive</span>
            <span className="text-[var(--color-brand-lime)]">
              {formatSgd(creatorReceives)}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Campaign start date (optional)"
          type="datetime-local"
          value={draft.start_date ?? ""}
          onChange={(e) =>
            onUpdate({ start_date: e.target.value || null })
          }
          hint="Leave blank to launch immediately"
        />
        <Input
          label="Campaign deadline"
          type="datetime-local"
          value={draft.deadline}
          onChange={(e) => onUpdate({ deadline: e.target.value })}
          error={errors.deadline}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-ink)]">
          Payout mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["automatic", "manual"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onUpdate({ payout_mode: mode })}
              className={`
                rounded-[var(--radius-card)] border-2 p-4 text-left transition-all
                ${
                  draft.payout_mode === mode
                    ? "border-[var(--color-brand-violet)] bg-violet-50/50 dark:bg-violet-900/10"
                    : "border-[var(--color-border)] hover:border-[var(--color-brand-violet)]/50"
                }
              `}
            >
              <p className="font-bold text-sm text-[var(--color-ink)]">
                {mode === "automatic" ? "⚡ Automatic" : "🎛️ Manual"}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                {mode === "automatic"
                  ? "Funds transferred to you automatically when goal is reached."
                  : "You request a payout from your dashboard when ready."}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={handleNext}>
          Next: Reward tiers
        </Button>
      </div>
    </div>
  );
}
