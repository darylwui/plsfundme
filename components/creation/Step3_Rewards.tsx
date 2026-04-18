"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { rewardSchema } from "@/lib/validations/reward";
import { formatSgd } from "@/lib/utils/currency";
import type { RewardFormData } from "@/types/reward";

const EMPTY_REWARD: RewardFormData = {
  title: "",
  description: "",
  minimum_pledge_sgd: 0,
  estimated_delivery_date: "",
  max_backers: null,
  includes_physical_item: false,
  image_url: null,
};

interface Step3Props {
  rewards: RewardFormData[];
  onAdd: (reward: RewardFormData) => void;
  onUpdate: (index: number, reward: RewardFormData) => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3_Rewards({
  rewards,
  onAdd,
  onUpdate,
  onRemove,
  onNext,
  onBack,
}: Step3Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<RewardFormData>(EMPTY_REWARD);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function handleSaveReward() {
    const result = rewardSchema.safeParse({
      ...form,
      minimum_pledge_sgd: Number(form.minimum_pledge_sgd),
      max_backers: form.max_backers ? Number(form.max_backers) : null,
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        if (e.path[0]) errs[String(e.path[0])] = e.message;
      });
      setFormErrors(errs);
      return;
    }

    onAdd(result.data as RewardFormData);
    setForm(EMPTY_REWARD);
    setFormErrors({});
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-ink)]">
          Build your reward tiers
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Give backers something exciting to unlock at different pledge levels. Start with an affordable "entry-level" reward — more backers = more momentum. You can always add more after launch.
        </p>
      </div>

      {/* Existing rewards */}
      {rewards.length > 0 && (
        <div className="flex flex-col gap-3">
          {rewards.map((reward, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4"
            >
              <GripVertical className="w-4 h-4 text-[var(--color-ink-subtle)] mt-0.5 shrink-0" />
              {reward.image_url && (
                <img
                  src={reward.image_url}
                  alt={reward.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-[var(--color-brand-crust)]">
                    {formatSgd(reward.minimum_pledge_sgd)}+
                  </span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {reward.title}
                  </span>
                  {reward.includes_physical_item && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Ships
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
                onClick={() => onRemove(i)}
                className="p-1.5 rounded-lg text-[var(--color-ink-subtle)] hover:text-[var(--color-brand-danger)] hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add reward form */}
      {adding ? (
        <div className="rounded-[var(--radius-card)] border-2 border-[var(--color-brand-crust)]/30 bg-violet-50/30 dark:bg-violet-900/10 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-[var(--color-ink)]">New reward tier</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title"
              placeholder="Early Bird Special"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              error={formErrors.title}
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
                  value={form.minimum_pledge_sgd || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minimum_pledge_sgd: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`
                    w-full rounded-[var(--radius-btn)] border pl-9 pr-3.5 py-2.5 text-sm
                    bg-[var(--color-surface)] text-[var(--color-ink)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]
                    ${formErrors.minimum_pledge_sgd ? "border-[var(--color-brand-danger)]" : "border-[var(--color-border)]"}
                  `}
                />
              </div>
              {formErrors.minimum_pledge_sgd && (
                <p className="text-xs text-[var(--color-brand-danger)]">
                  {formErrors.minimum_pledge_sgd}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What will backers receive? Be specific and exciting."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] resize-none"
            />
            <p className="text-xs text-[var(--color-ink-subtle)]">
              Explain exactly what backers get. Include delivery date. Example: "Digital ebook (20 pages) + lifetime access to updates"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Estimated delivery"
              type="date"
              value={form.estimated_delivery_date}
              onChange={(e) =>
                setForm({ ...form, estimated_delivery_date: e.target.value })
              }
              error={formErrors.estimated_delivery_date}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-ink)]">
                Max backers{" "}
                <span className="font-normal text-[var(--color-ink-subtle)]">
                  (leave blank for unlimited)
                </span>
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 100"
                value={form.max_backers ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_backers: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
              />
            </div>
          </div>

          <ImageUpload
            label="Reward image (optional)"
            hint="Show backers what they'll receive — product photo, mockup, etc."
            compact
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
          />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.includes_physical_item}
              onChange={(e) =>
                setForm({ ...form, includes_physical_item: e.target.checked })
              }
              className="w-4 h-4 rounded accent-[var(--color-brand-crust)]"
            />
            <span className="text-sm text-[var(--color-ink)]">
              This reward includes a physical item that needs to be shipped
            </span>
          </label>

          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setForm(EMPTY_REWARD);
                setFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveReward}>Save reward</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-crust)]/50 p-6 flex flex-col items-center gap-2 text-[var(--color-ink-muted)] hover:text-[var(--color-brand-crust)] transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface-overlay)] group-hover:bg-violet-100 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold">Add a reward tier</span>
        </button>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onNext}>
          Next: Review &amp; launch
        </Button>
      </div>
    </div>
  );
}
