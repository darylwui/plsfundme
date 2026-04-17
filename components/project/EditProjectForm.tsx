"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, CheckCircle2, Lock, ImageIcon, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { CampaignEditor } from "@/components/projects/CampaignEditor";
import { formatSgd } from "@/lib/utils/currency";
import { rewardSchema } from "@/lib/validations/reward";
import type { ProjectWithRelations, Category, ProjectUpdate } from "@/types/project";
import type { Reward, RewardFormData } from "@/types/reward";

interface EditProjectFormProps {
  project: ProjectWithRelations;
  categories: Category[];
  rewards: Reward[];
  pledgeCountByReward: Record<string, number>;
  hasPledges: boolean;
}

type Tab = "details" | "funding" | "rewards";

const EMPTY_REWARD: RewardFormData = {
  title: "",
  description: "",
  minimum_pledge_sgd: 0,
  estimated_delivery_date: "",
  max_backers: null,
  includes_physical_item: false,
  image_url: null,
};

export function EditProjectForm({
  project,
  categories,
  rewards: initialRewards,
  pledgeCountByReward,
  hasPledges,
}: EditProjectFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("details");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Tab | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Details state
  const [title, setTitle] = useState(project.title);
  const [categoryId, setCategoryId] = useState(project.category_id);
  const [shortDesc, setShortDesc] = useState(project.short_description);
  const [fullDesc, setFullDesc] = useState(() => {
    const value = project.full_description;
    if (!/<[a-z][\s\S]*>/i.test(value)) {
      // Plain text — wrap each non-empty line in <p> for Tiptap
      return value
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => `<p>${line}</p>`)
        .join("");
    }
    return value;
  });
  const [coverUrl, setCoverUrl] = useState<string | null>(project.cover_image_url);
  const [videoUrl, setVideoUrl] = useState(project.video_url ?? "");

  // Funding state
  const [fundingGoal, setFundingGoal] = useState(project.funding_goal_sgd);
  const [deadline, setDeadline] = useState(
    project.deadline ? project.deadline.slice(0, 10) : ""
  );
  const [payoutMode, setPayoutMode] = useState(project.payout_mode);

  // Rewards state
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [addingReward, setAddingReward] = useState(false);

  // Delete project state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [rewardForm, setRewardForm] = useState<RewardFormData>(EMPTY_REWARD);
  const [rewardFormErrors, setRewardFormErrors] = useState<Record<string, string>>({});
  const [rewardSaving, setRewardSaving] = useState(false);

  function showSaved(t: Tab) {
    setSaved(t);
    setTimeout(() => setSaved(null), 3000);
  }

  // ── Details save ──────────────────────────────────────────────
  async function saveDetails() {
    const errs: Record<string, string> = {};
    if (!title.trim() || title.length < 5) errs.title = "Title must be at least 5 characters";
    if (!categoryId) errs.category_id = "Please select a category";
    if (!shortDesc.trim() || shortDesc.length < 20) errs.short_description = "Must be at least 20 characters";
    if (!fullDesc.trim() || fullDesc.length < 50) errs.full_description = "Must be at least 50 characters";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    setSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({
        title: title.trim(),
        category_id: categoryId,
        short_description: shortDesc.trim(),
        full_description: fullDesc.trim(),
        cover_image_url: coverUrl || null,
        video_url: videoUrl.trim() || null,
      })
      .eq("id", project.id);
    setSaving(false);

    if (error) {
      setErrors({ _: error.message });
    } else {
      showSaved("details");
      router.refresh();
    }
  }

  // ── Funding save ──────────────────────────────────────────────
  async function saveFunding() {
    const errs: Record<string, string> = {};
    if (!hasPledges && (fundingGoal < 500 || fundingGoal > 10_000_000)) {
      errs.funding_goal_sgd = "Goal must be between S$500 and S$10,000,000";
    }
    if (!deadline) {
      errs.deadline = "Deadline is required";
    } else if (new Date(`${deadline}T00:00:00.000Z`) <= new Date()) {
      errs.deadline = "Deadline must be in the future";
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    setSaving(true);
    const updates: ProjectUpdate = {
      deadline: `${deadline}T00:00:00.000Z`,
      payout_mode: payoutMode,
      ...((!hasPledges) ? { funding_goal_sgd: fundingGoal } : {}),
    };

    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", project.id);
    setSaving(false);

    if (error) {
      setErrors({ _: error.message });
    } else {
      showSaved("funding");
      router.refresh();
    }
  }

  // ── Reward add ────────────────────────────────────────────────
  async function saveNewReward() {
    const result = rewardSchema.safeParse({
      ...rewardForm,
      minimum_pledge_sgd: Number(rewardForm.minimum_pledge_sgd),
      max_backers: rewardForm.max_backers ? Number(rewardForm.max_backers) : null,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        if (e.path[0]) errs[String(e.path[0])] = e.message;
      });
      setRewardFormErrors(errs);
      return;
    }

    setRewardSaving(true);
    const { data, error } = await supabase
      .from("rewards")
      .insert({
        project_id: project.id,
        ...result.data,
        image_url: rewardForm.image_url ?? null,
        display_order: rewards.length,
      })
      .select()
      .single();
    setRewardSaving(false);

    if (error) {
      setRewardFormErrors({ _: error.message });
    } else if (data) {
      setRewards((prev) => [...prev, data as Reward]);
      setRewardForm(EMPTY_REWARD);
      setRewardFormErrors({});
      setAddingReward(false);
    }
  }

  async function deleteReward(rewardId: string) {
    if ((pledgeCountByReward[rewardId] ?? 0) > 0) return; // locked
    const { error } = await supabase.from("rewards").delete().eq("id", rewardId);
    if (!error) {
      setRewards((prev) => prev.filter((r) => r.id !== rewardId));
    }
  }

  async function deleteProject() {
    setDeleting(true);
    setDeleteError("");
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    setDeleting(false);
    if (error) {
      if (error.code === "23503") {
        // Foreign key violation — pledges exist
        setDeleteError("Your project has pledged funds, please contact support for assistance.");
      } else {
        setDeleteError(error.message);
      }
    } else {
      router.push("/dashboard/projects");
    }
  }

  const platformFee = fundingGoal * 0.05;

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "funding", label: "Funding" },
    { id: "rewards", label: "Rewards" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setErrors({}); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-[var(--radius-btn)] transition-all ${
              tab === t.id
                ? "bg-[var(--color-brand-violet)] text-white shadow-sm"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Global error */}
      {errors._ && (
        <p className="text-sm text-[var(--color-brand-coral)] bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-[var(--radius-card)]">
          {errors._}
        </p>
      )}

      {/* ── Details tab ──────────────────────────────── */}
      {tab === "details" && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 flex flex-col gap-5">
          <Input
            label="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            hint="60 characters or fewer works best"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full rounded-[var(--radius-btn)] border px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] focus:border-transparent ${
                errors.category_id ? "border-[var(--color-brand-coral)]" : "border-[var(--color-border)]"
              }`}
            >
              <option value="">Select a category…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-[var(--color-brand-coral)]">{errors.category_id}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">
              Short description{" "}
              <span className="font-normal text-[var(--color-ink-subtle)]">(shown on cards)</span>
            </label>
            <textarea
              rows={2}
              maxLength={200}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className={`w-full rounded-[var(--radius-btn)] border px-3.5 py-2.5 text-sm resize-none bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] focus:border-transparent ${
                errors.short_description ? "border-[var(--color-brand-coral)]" : "border-[var(--color-border)]"
              }`}
            />
            <div className="flex justify-between">
              {errors.short_description ? (
                <p className="text-xs text-[var(--color-brand-coral)]">{errors.short_description}</p>
              ) : <span />}
              <p className="text-xs text-[var(--color-ink-subtle)]">{shortDesc.length}/200</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">Campaign story</label>
            <CampaignEditor
              value={fullDesc}
              onChange={(html) => setFullDesc(html)}
              error={errors.full_description}
            />
            {errors.full_description && (
              <p className="text-xs text-[var(--color-brand-coral)]">{errors.full_description}</p>
            )}
          </div>

          <ImageUpload
            label="Cover image"
            value={coverUrl}
            onChange={(url) => setCoverUrl(url)}
            hint="Recommended: 1280×720px or wider (16:9)"
          />

          <Input
            label="Video URL (optional)"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
            {saved === "details" ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-brand-lime)] font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            ) : <span />}
            <Button size="lg" loading={saving} onClick={saveDetails}>
              Save details
            </Button>
          </div>
        </div>
      )}

      {/* ── Funding tab ──────────────────────────────── */}
      {tab === "funding" && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 flex flex-col gap-5">
          {/* Funding goal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)] flex items-center gap-2">
              Funding goal (SGD)
              {hasPledges && (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-subtle)] font-normal">
                  <Lock className="w-3 h-3" /> Locked — pledges exist
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-ink-muted)]">
                S$
              </span>
              <input
                type="number"
                min={500}
                step={100}
                disabled={hasPledges}
                value={fundingGoal || ""}
                onChange={(e) => setFundingGoal(parseFloat(e.target.value) || 0)}
                className={`w-full rounded-[var(--radius-btn)] border pl-9 pr-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.funding_goal_sgd ? "border-[var(--color-brand-coral)]" : "border-[var(--color-border)]"
                }`}
              />
            </div>
            {errors.funding_goal_sgd && (
              <p className="text-xs text-[var(--color-brand-coral)]">{errors.funding_goal_sgd}</p>
            )}
          </div>

          {/* Fee breakdown */}
          {fundingGoal > 0 && (
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 text-sm flex flex-col gap-2">
              <h4 className="font-semibold text-[var(--color-ink)]">Fee breakdown</h4>
              <div className="flex justify-between text-[var(--color-ink-muted)]">
                <span>Funding goal</span>
                <span>{formatSgd(fundingGoal)}</span>
              </div>
              <div className="flex justify-between text-[var(--color-ink-muted)]">
                <span>Platform fee (5%)</span>
                <span>- {formatSgd(platformFee)}</span>
              </div>
              <hr className="border-[var(--color-border)]" />
              <div className="flex justify-between font-bold text-[var(--color-ink)]">
                <span>You receive</span>
                <span className="text-[var(--color-brand-lime)]">{formatSgd(fundingGoal - platformFee)}</span>
              </div>
            </div>
          )}

          <Input
            label="Campaign deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            error={errors.deadline}
            hint="Funds are released (or refunded) on this date"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">Payout mode</label>
            <div className="grid grid-cols-2 gap-3">
              {(["automatic", "manual"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPayoutMode(mode)}
                  className={`rounded-[var(--radius-card)] border-2 p-4 text-left transition-all ${
                    payoutMode === mode
                      ? "border-[var(--color-brand-violet)] bg-violet-50/50 dark:bg-violet-900/10"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand-violet)]/50"
                  }`}
                >
                  <p className="font-bold text-sm text-[var(--color-ink)]">
                    {mode === "automatic" ? "⚡ Automatic" : "🎛️ Manual"}
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                    {mode === "automatic"
                      ? "Funds transferred automatically when goal is reached."
                      : "You request a payout from your dashboard when ready."}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
            {saved === "funding" ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-brand-lime)] font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            ) : <span />}
            <Button size="lg" loading={saving} onClick={saveFunding}>
              Save funding
            </Button>
          </div>
        </div>
      )}

      {/* ── Rewards tab ──────────────────────────────── */}
      {tab === "rewards" && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 flex flex-col gap-5">
          <div>
            <h3 className="font-bold text-[var(--color-ink)]">Reward tiers</h3>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              You can add new reward tiers at any time. Tiers with active pledges are locked.
            </p>
          </div>

          {/* Existing rewards */}
          {rewards.length > 0 ? (
            <div className="flex flex-col gap-3">
              {rewards
                .sort((a, b) => a.minimum_pledge_sgd - b.minimum_pledge_sgd)
                .map((reward) => {
                  const pledgeCount = pledgeCountByReward[reward.id] ?? 0;
                  const locked = pledgeCount > 0;
                  return (
                    <div
                      key={reward.id}
                      className={`flex items-start gap-3 rounded-[var(--radius-card)] border p-4 ${
                        locked
                          ? "border-[var(--color-border)] bg-[var(--color-surface-overlay)] opacity-80"
                          : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
                      }`}
                    >
                      {reward.image_url ? (
                        <img
                          src={reward.image_url}
                          alt={reward.title}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-[var(--color-surface-overlay)] flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-[var(--color-ink-subtle)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-[var(--color-brand-violet)]">
                            {formatSgd(reward.minimum_pledge_sgd)}+
                          </span>
                          <span className="font-bold text-[var(--color-ink)]">{reward.title}</span>
                          {reward.includes_physical_item && (
                            <Badge variant="amber">Ships</Badge>
                          )}
                          {locked && (
                            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-subtle)]">
                              <Lock className="w-3 h-3" /> {pledgeCount} pledge{pledgeCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        {reward.description && (
                          <p className="text-sm text-[var(--color-ink-muted)] mt-1 line-clamp-2">
                            {reward.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => deleteReward(reward.id)}
                        className="p-1.5 rounded-lg text-[var(--color-ink-subtle)] hover:text-[var(--color-brand-coral)] hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={locked ? "Cannot delete — has active pledges" : "Delete reward"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ink-subtle)] text-center py-4">
              No reward tiers yet.
            </p>
          )}

          {/* Add reward form */}
          {addingReward ? (
            <div className="rounded-[var(--radius-card)] border-2 border-[var(--color-brand-violet)]/30 bg-violet-50/30 dark:bg-violet-900/10 p-5 flex flex-col gap-4">
              <h3 className="font-bold text-[var(--color-ink)]">New reward tier</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Title"
                  placeholder="Early Bird Special"
                  value={rewardForm.title}
                  onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
                  error={rewardFormErrors.title}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--color-ink)]">
                    Minimum pledge (SGD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-ink-muted)]">
                      S$
                    </span>
                    <input
                      type="number"
                      min={1}
                      placeholder="50"
                      value={rewardForm.minimum_pledge_sgd || ""}
                      onChange={(e) =>
                        setRewardForm({ ...rewardForm, minimum_pledge_sgd: parseFloat(e.target.value) || 0 })
                      }
                      className={`w-full rounded-[var(--radius-btn)] border pl-9 pr-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] ${
                        rewardFormErrors.minimum_pledge_sgd ? "border-[var(--color-brand-coral)]" : "border-[var(--color-border)]"
                      }`}
                    />
                  </div>
                  {rewardFormErrors.minimum_pledge_sgd && (
                    <p className="text-xs text-[var(--color-brand-coral)]">{rewardFormErrors.minimum_pledge_sgd}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-ink)]">Description</label>
                <textarea
                  rows={3}
                  placeholder="What will backers receive?"
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Estimated delivery"
                  type="date"
                  value={rewardForm.estimated_delivery_date}
                  onChange={(e) => setRewardForm({ ...rewardForm, estimated_delivery_date: e.target.value })}
                  error={rewardFormErrors.estimated_delivery_date}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--color-ink)]">
                    Max backers{" "}
                    <span className="font-normal text-[var(--color-ink-subtle)]">(blank = unlimited)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 100"
                    value={rewardForm.max_backers ?? ""}
                    onChange={(e) =>
                      setRewardForm({ ...rewardForm, max_backers: e.target.value ? parseInt(e.target.value) : null })
                    }
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)]"
                  />
                </div>
              </div>

              <ImageUpload
                label="Reward image (optional)"
                hint="Show backers what they'll receive — product photo, mockup, etc."
                compact
                value={rewardForm.image_url}
                onChange={(url) => setRewardForm({ ...rewardForm, image_url: url })}
              />

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rewardForm.includes_physical_item}
                  onChange={(e) => setRewardForm({ ...rewardForm, includes_physical_item: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--color-brand-violet)]"
                />
                <span className="text-sm text-[var(--color-ink)]">
                  This reward includes a physical item that needs to be shipped
                </span>
              </label>

              {rewardFormErrors._ && (
                <p className="text-xs text-[var(--color-brand-coral)]">{rewardFormErrors._}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAddingReward(false);
                    setRewardForm(EMPTY_REWARD);
                    setRewardFormErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button loading={rewardSaving} onClick={saveNewReward}>
                  Add reward
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingReward(true)}
              className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-violet)]/50 p-6 flex flex-col items-center gap-2 text-[var(--color-ink-muted)] hover:text-[var(--color-brand-violet)] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-overlay)] group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold">Add a reward tier</span>
            </button>
          )}
        </div>
      )}

      {/* ── Danger zone ──────────────────────────────── */}
      <div className="rounded-[var(--radius-card)] border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--color-brand-coral)] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[var(--color-ink)]">Delete campaign</h3>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              {hasPledges
                ? "Your project has pledged funds, please contact support for assistance."
                : "Permanently remove this campaign and all its data. This cannot be undone."}
            </p>
          </div>
        </div>

        {!hasPledges && !showDeleteConfirm && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-btn)] border border-red-300 dark:border-red-700 text-sm font-semibold text-[var(--color-brand-coral)] hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete campaign
          </button>
        )}

        {!hasPledges && showDeleteConfirm && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--color-ink-muted)]">
              Type <span className="font-mono font-bold text-[var(--color-ink)]">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full max-w-xs rounded-[var(--radius-btn)] border border-red-300 dark:border-red-700 px-3.5 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-coral)]"
            />
            {deleteError && (
              <p className="text-xs text-[var(--color-brand-coral)]">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                className="px-4 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-overlay)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInput !== "DELETE" || deleting}
                onClick={deleteProject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-btn)] bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
