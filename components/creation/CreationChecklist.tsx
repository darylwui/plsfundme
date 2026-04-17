"use client";

import { Check, X } from "lucide-react";
import type { ProjectDraft } from "@/types/project";
import type { RewardFormData } from "@/types/reward";

interface CreationChecklistProps {
  draft: ProjectDraft;
  rewards: RewardFormData[];
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  isRequired: boolean;
}

export function CreationChecklist({ draft, rewards }: CreationChecklistProps) {
  const items: ChecklistItem[] = [
    {
      id: "title",
      label: "Title",
      description: "5–100 characters, compelling & clear",
      isComplete: draft.title ? draft.title.length >= 5 && draft.title.length <= 100 : false,
      isRequired: true,
    },
    {
      id: "category",
      label: "Category",
      description: "Select a category",
      isComplete: !!draft.category_id,
      isRequired: true,
    },
    {
      id: "short_description",
      label: "Short description",
      description: "20–200 characters, hooks readers",
      isComplete: draft.short_description
        ? draft.short_description.length >= 20 && draft.short_description.length <= 200
        : false,
      isRequired: true,
    },
    {
      id: "full_description",
      label: "Full description",
      description: "50+ characters, tells your story",
      isComplete: draft.full_description ? draft.full_description.length >= 50 : false,
      isRequired: true,
    },
    {
      id: "cover_image",
      label: "Cover image",
      description: "Recommended: 16:9 aspect ratio",
      isComplete: !!draft.cover_image_url,
      isRequired: false,
    },
    {
      id: "funding_goal",
      label: "Funding goal",
      description: "S$500–S$10M",
      isComplete: draft.funding_goal_sgd ? draft.funding_goal_sgd >= 500 && draft.funding_goal_sgd <= 10_000_000 : false,
      isRequired: true,
    },
    {
      id: "deadline",
      label: "Deadline",
      description: "Future date (typically 30–90 days)",
      isComplete: draft.deadline ? new Date(draft.deadline) > new Date() : false,
      isRequired: true,
    },
    {
      id: "rewards",
      label: "Rewards",
      description: "At least 1 reward tier",
      isComplete: rewards.length > 0,
      isRequired: true,
    },
    {
      id: "reward_titles",
      label: "Reward titles",
      description: "All rewards have titles",
      isComplete: rewards.length > 0 && rewards.every((r) => r.title && r.title.trim().length > 0),
      isRequired: rewards.length > 0,
    },
  ];

  const requiredItems = items.filter((i) => i.isRequired);
  const completedRequired = requiredItems.filter((i) => i.isComplete).length;
  const completionPercent = requiredItems.length > 0 ? Math.round((completedRequired / requiredItems.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      {/* Header */}
      <div>
        <h3 className="font-bold text-sm text-[var(--color-ink)] mb-2">Submission checklist</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-brand-violet)] to-[var(--color-brand-amber)] transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[var(--color-ink-subtle)] whitespace-nowrap">
            {completionPercent}%
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5">
            {/* Icon */}
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              {item.isComplete ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : item.isRequired ? (
                <div className="w-5 h-5 rounded-full border-2 border-[var(--color-brand-coral)] flex items-center justify-center">
                  <X className="w-3 h-3 text-[var(--color-brand-coral)]" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center">
                  <span className="text-xs text-[var(--color-ink-subtle)]">ⓘ</span>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${item.isComplete ? "text-emerald-600" : item.isRequired ? "text-[var(--color-ink)]" : "text-[var(--color-ink-subtle)]"}`}>
                {item.label}
              </p>
              <p className="text-xs text-[var(--color-ink-subtle)]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ready-to-submit message */}
      {completionPercent === 100 && (
        <div className="mt-2 p-3 rounded-[var(--radius-card)] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            ✨ You're ready to submit! Our team will review within 1–2 business days.
          </p>
        </div>
      )}
    </div>
  );
}
