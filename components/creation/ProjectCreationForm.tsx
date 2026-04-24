"use client";

import { StepIndicator } from "./StepIndicator";
import { Step1_BasicInfo } from "./Step1_BasicInfo";
import { Step2_Funding } from "./Step2_Funding";
import { Step3_Milestones } from "./Step3_Milestones";
import { Step4_Rewards } from "./Step4_Rewards";
import { Step5_Review } from "./Step5_Review";
import { CreationChecklist } from "./CreationChecklist";
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
    saveState,
    updateDraft,
    updateMilestone,
    addReward,
    updateReward,
    removeReward,
    goTo,
    next,
    back,
    clearDraft,
  } = useProjectCreation();

  const showChecklist = step !== 5; // Don't show checklist on review step

  return (
    <div className="flex flex-col gap-8">
      <StepIndicator current={step} saveState={saveState} onGoTo={goTo} />

      {/* Main layout: form on left, checklist on right */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Form steps */}
        <div className="flex-1">
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
              <Step3_Milestones
                draft={draft}
                onUpdate={updateMilestone}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 4 && (
              <Step4_Rewards
                rewards={rewards}
                onAdd={addReward}
                onUpdate={updateReward}
                onRemove={removeReward}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 5 && (
              <Step5_Review
                draft={draft}
                rewards={rewards}
                categories={categories}
                onBack={back}
                onSuccess={clearDraft}
              />
            )}
          </div>
        </div>

        {/* Right: Checklist sidebar (desktop only) */}
        {showChecklist && (
          <div className="hidden lg:block w-72 sticky top-20 h-fit">
            <CreationChecklist draft={draft} rewards={rewards} />
          </div>
        )}
      </div>

      {/* Mobile checklist drawer toggle */}
      {showChecklist && (
        <div className="lg:hidden">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
            <CreationChecklist draft={draft} rewards={rewards} />
          </div>
        </div>
      )}
    </div>
  );
}
