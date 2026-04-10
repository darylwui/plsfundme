"use client";

import { useState } from "react";
import type { ProjectDraft } from "@/types/project";
import type { RewardFormData } from "@/types/reward";

export type CreationStep = 1 | 2 | 3 | 4;

const INITIAL_DRAFT: ProjectDraft = {
  title: "",
  category_id: "",
  short_description: "",
  full_description: "",
  cover_image_url: null,
  video_url: null,
  funding_goal_sgd: 0,
  start_date: null,
  deadline: "",
  payout_mode: "automatic",
};

export function useProjectCreation() {
  const [step, setStep] = useState<CreationStep>(1);
  const [draft, setDraft] = useState<ProjectDraft>(INITIAL_DRAFT);
  const [rewards, setRewards] = useState<RewardFormData[]>([]);

  function updateDraft(partial: Partial<ProjectDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function addReward(reward: RewardFormData) {
    setRewards((prev) => [...prev, reward]);
  }

  function updateReward(index: number, reward: RewardFormData) {
    setRewards((prev) => prev.map((r, i) => (i === index ? reward : r)));
  }

  function removeReward(index: number) {
    setRewards((prev) => prev.filter((_, i) => i !== index));
  }

  function reorderRewards(from: number, to: number) {
    setRewards((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function goTo(s: CreationStep) {
    setStep(s);
  }

  function next() {
    setStep((s) => Math.min(s + 1, 4) as CreationStep);
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1) as CreationStep);
  }

  return {
    step,
    draft,
    rewards,
    updateDraft,
    addReward,
    updateReward,
    removeReward,
    reorderRewards,
    goTo,
    next,
    back,
  };
}
