"use client";

import { useMemo, useState } from "react";
import { Flag, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { projectMilestonesSchema } from "@/lib/validations/project";
import { formatSgd } from "@/lib/utils/currency";
import type { MilestoneDraft, ProjectDraft } from "@/types/project";

interface Step3Props {
  draft: ProjectDraft;
  onUpdate: (index: 0 | 1 | 2, partial: Partial<MilestoneDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Payout split is fixed platform-wide; displayed to the creator so they
// understand when funds release. Matches lib/milestones/escrow.ts.
const PAYOUT_PERCENTAGES: [number, number, number] = [40, 40, 20];

const MILESTONE_HINTS: [string, string, string] = [
  "e.g. Prototype finalised & manufacturing partner confirmed",
  "e.g. Production complete and units ready to ship",
  "e.g. All rewards shipped and confirmed delivered",
];

export function Step3_Milestones({ draft, onUpdate, onNext, onBack }: Step3Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const creatorReceives = useMemo(
    () => draft.funding_goal_sgd * 0.95,
    [draft.funding_goal_sgd],
  );

  function handleNext() {
    const result = projectMilestonesSchema.safeParse({
      milestones: draft.milestones,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        // Path looks like ["milestones", <index>, "<field>"]
        if (e.path.length >= 3) {
          const key = `${String(e.path[1])}.${String(e.path[2])}`;
          if (!errs[key]) errs[key] = e.message;
        }
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    onNext();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-ink)]">
          Define your milestones
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Backers fund your campaign in three phases. Tell them what you&apos;ll
          deliver at each one — funds unlock from escrow as you complete each milestone.
        </p>
      </div>

      {/* Explainer card */}
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 text-sm flex gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-brand-crust)]" />
        <div className="flex-1 flex flex-col gap-1 text-[var(--color-ink-muted)]">
          <p className="font-semibold text-[var(--color-ink)]">
            How milestone payouts work
          </p>
          <p>
            The payout split is fixed at <strong>40% / 40% / 20%</strong>. When our team
            approves a milestone, that share of your{" "}
            {draft.funding_goal_sgd > 0 ? (
              <>net payout ({formatSgd(creatorReceives)})</>
            ) : (
              <>net payout</>
            )}{" "}
            releases to you automatically.
          </p>
        </div>
      </div>

      {/* Milestone cards */}
      <div className="flex flex-col gap-5">
        {draft.milestones.map((m, i) => {
          const index = i as 0 | 1 | 2;
          const percentage = PAYOUT_PERCENTAGES[index];
          const payoutAmount =
            draft.funding_goal_sgd > 0
              ? (creatorReceives * percentage) / 100
              : 0;

          const titleError = errors[`${index}.title`];
          const descriptionError = errors[`${index}.description`];
          const dateError = errors[`${index}.target_date`];

          return (
            <div
              key={index}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 flex flex-col gap-4"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-brand-crust)]/10 flex items-center justify-center">
                    <Flag className="w-4 h-4 text-[var(--color-brand-crust)]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] font-semibold text-[var(--color-ink-subtle)]">
                      Milestone {index + 1}
                    </p>
                    <p className="text-sm font-bold text-[var(--color-ink)]">
                      {percentage}% of payout
                      {payoutAmount > 0 && (
                        <span className="text-[var(--color-ink-muted)] font-normal">
                          {" "}
                          — {formatSgd(payoutAmount)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Title */}
              <Input
                label="Milestone title"
                type="text"
                placeholder={MILESTONE_HINTS[index]}
                value={m.title}
                onChange={(e) => onUpdate(index, { title: e.target.value })}
                error={titleError}
                required
                maxLength={80}
                hint="5–80 chars. Name a concrete deliverable, not a feeling. E.g. 'Prototype finalised', 'First 100 units shipped'."
              />

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-ink)]">
                  What proof will you submit?{" "}
                  <span className="text-[var(--color-brand-danger)]">*</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="e.g. Photos of the prototype, confirmation email from manufacturer, or tracking numbers"
                  value={m.description}
                  onChange={(e) =>
                    onUpdate(index, { description: e.target.value })
                  }
                  className={`
                    w-full rounded-[var(--radius-btn)] border px-3 py-2 text-sm
                    bg-[var(--color-surface)] text-[var(--color-ink)]
                    placeholder:text-[var(--color-ink-subtle)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] focus:border-transparent resize-none
                    ${
                      descriptionError
                        ? "border-[var(--color-brand-danger)]"
                        : "border-[var(--color-border)]"
                    }
                  `}
                />
                <div className="flex items-center justify-between">
                  {descriptionError ? (
                    <p className="text-xs text-[var(--color-brand-danger)]">
                      {descriptionError}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-ink-subtle)]">
                      Admins review this evidence before releasing funds.
                    </p>
                  )}
                  <p
                    className={`text-xs ${
                      m.description.length < 20
                        ? "text-[var(--color-ink-subtle)]"
                        : "text-[var(--color-brand-success)]"
                    }`}
                  >
                    {m.description.length}/300
                  </p>
                </div>
              </div>

              {/* Target date */}
              <Input
                label="Target delivery date"
                type="date"
                value={m.target_date ? m.target_date.slice(0, 10) : ""}
                onChange={(e) => onUpdate(index, { target_date: e.target.value })}
                error={dateError}
                required
                hint="When you'll have proof ready. Stay realistic — slipping milestones erodes backer trust."
              />
            </div>
          );
        })}
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
