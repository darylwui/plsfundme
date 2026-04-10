"use client";

import { StepIndicator } from "./StepIndicator";
import { Step1_BasicInfo } from "./Step1_BasicInfo";
import { Step2_Funding } from "./Step2_Funding";
import { Step3_Rewards } from "./Step3_Rewards";
import { Step4_Review } from "./Step4_Review";
import { useProjectCreation } from "@/hooks/useProjectCreation";
import type { Category } from "@/types/project";

interface ProjectCreationFormProps {
  categories: Category[];
}

export function ProjectCreationForm({ categories }: ProjectCreationFormProps) {
  const {
    step,
    draft,
    rewards,
    updateDraft,
    addReward,
    updateReward,
    removeReward,
    goTo,
    next,
    back,
  } = useProjectCreation();

  return (
    <div className="flex flex-col gap-8">
      <StepIndicator current={step} onGoTo={goTo} />

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-8">
        {step === 1 && (
          <Step1_BasicInfo
            draft={draft}
            categories={categories}
            onUpdate={updateDraft}
            onNext={next}
          />
        )}
        {step === 2 && (
          <Step2_Funding
            draft={draft}
            onUpdate={updateDraft}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <Step3_Rewards
            rewards={rewards}
            onAdd={addReward}
            onUpdate={updateReward}
            onRemove={removeReward}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <Step4_Review
            draft={draft}
            rewards={rewards}
            categories={categories}
            onBack={back}
          />
        )}
      </div>
    </div>
  );
}
