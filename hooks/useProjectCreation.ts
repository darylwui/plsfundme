"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProjectDraft, MilestoneDraft } from "@/types/project";
import type { RewardFormData } from "@/types/reward";

export type CreationStep = 1 | 2 | 3 | 4 | 5;
export type SaveState = "idle" | "saving" | "saved" | "error";

const EMPTY_MILESTONE: MilestoneDraft = { title: "", description: "", target_date: "" };

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
  milestones: [
    { ...EMPTY_MILESTONE },
    { ...EMPTY_MILESTONE },
    { ...EMPTY_MILESTONE },
  ],
};

const SAVE_DEBOUNCE_MS = 1200;

export function useProjectCreation() {
  const [step, setStep] = useState<CreationStep>(1);
  const [draft, setDraft] = useState<ProjectDraft>(INITIAL_DRAFT);
  const [rewards, setRewards] = useState<RewardFormData[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing draft on mount
  useEffect(() => {
    async function loadDraft() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("campaign_drafts")
        .select("draft_data, rewards_data, step")
        .eq("user_id", user.id)
        .single();

      if (data) {
        // Backfill milestones for drafts saved before the milestone step shipped.
        const loadedDraft = data.draft_data as Partial<ProjectDraft>;
        const withDefaults: ProjectDraft = {
          ...INITIAL_DRAFT,
          ...loadedDraft,
          milestones: loadedDraft.milestones ?? INITIAL_DRAFT.milestones,
        };
        setDraft(withDefaults);
        setRewards(data.rewards_data as RewardFormData[]);
        setStep(data.step as CreationStep);
      }
      setLoaded(true);
    }
    loadDraft();
  }, []);

  const saveDraft = useCallback(async (
    nextDraft: ProjectDraft,
    nextRewards: RewardFormData[],
    nextStep: CreationStep,
  ) => {
    setSaveState("saving");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("campaign_drafts")
      .upsert(
        {
          user_id: user.id,
          draft_data: nextDraft,
          rewards_data: nextRewards,
          step: nextStep,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    setSaveState(error ? "error" : "saved");
    // Reset to idle after 2s
    setTimeout(() => setSaveState("idle"), 2000);
  }, []);

  // Debounced auto-save whenever draft/rewards/step change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(draft, rewards, step);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, rewards, step, loaded, saveDraft]);

  async function clearDraft() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("campaign_drafts").delete().eq("user_id", user.id);
  }

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
    setStep((s) => Math.min(s + 1, 5) as CreationStep);
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1) as CreationStep);
  }

  function updateMilestone(index: 0 | 1 | 2, partial: Partial<MilestoneDraft>) {
    setDraft((prev) => {
      const nextMilestones = [...prev.milestones] as ProjectDraft["milestones"];
      nextMilestones[index] = { ...nextMilestones[index], ...partial };
      return { ...prev, milestones: nextMilestones };
    });
  }

  return {
    step,
    draft,
    rewards,
    saveState,
    loaded,
    updateDraft,
    updateMilestone,
    addReward,
    updateReward,
    removeReward,
    reorderRewards,
    goTo,
    next,
    back,
    clearDraft,
  };
}
