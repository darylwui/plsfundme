"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { projectBasicInfoSchema } from "@/lib/validations/project";
import type { ProjectDraft } from "@/types/project";
import type { Category } from "@/types/project";

interface Step1Props {
  draft: ProjectDraft;
  categories: Category[];
  onUpdate: (partial: Partial<ProjectDraft>) => void;
  onNext: () => void;
}

export function Step1_BasicInfo({
  draft,
  categories,
  onUpdate,
  onNext,
}: Step1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleNext() {
    const result = projectBasicInfoSchema.safeParse({
      title: draft.title,
      category_id: draft.category_id,
      short_description: draft.short_description,
      full_description: draft.full_description,
      cover_image_url: draft.cover_image_url || null,
      video_url: draft.video_url || null,
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-[var(--color-ink)]">
          Tell us about your project
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          A compelling title and description help backers understand your vision.
        </p>
      </div>

      <Input
        label="Project title"
        placeholder="e.g. EcoBottle: The last water bottle you'll ever buy"
        value={draft.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        error={errors.title}
        hint="60 characters or fewer works best"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-ink)]">
          Category
        </label>
        <select
          value={draft.category_id}
          onChange={(e) => onUpdate({ category_id: e.target.value })}
          className={`
            w-full rounded-[var(--radius-btn)] border px-3.5 py-2.5 text-sm
            bg-[var(--color-surface)] text-[var(--color-ink)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] focus:border-transparent
            ${errors.category_id ? "border-[var(--color-brand-coral)]" : "border-[var(--color-border)]"}
          `}
        >
          <option value="">Select a category…</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="text-xs text-[var(--color-brand-coral)]">
            {errors.category_id}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-ink)]">
          Short description{" "}
          <span className="text-[var(--color-ink-subtle)] font-normal">
            (shown on cards)
          </span>
        </label>
        <textarea
          rows={2}
          maxLength={200}
          placeholder="One or two punchy sentences that sum up your project."
          value={draft.short_description}
          onChange={(e) => onUpdate({ short_description: e.target.value })}
          className={`
            w-full rounded-[var(--radius-btn)] border px-3.5 py-2.5 text-sm resize-none
            bg-[var(--color-surface)] text-[var(--color-ink)]
            placeholder:text-[var(--color-ink-subtle)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] focus:border-transparent
            ${errors.short_description ? "border-[var(--color-brand-coral)]" : "border-[var(--color-border)]"}
          `}
        />
        <div className="flex justify-between">
          {errors.short_description ? (
            <p className="text-xs text-[var(--color-brand-coral)]">
              {errors.short_description}
            </p>
          ) : (
            <span />
          )}
          <p className="text-xs text-[var(--color-ink-subtle)]">
            {draft.short_description.length}/200
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-ink)]">
          Full description
        </label>
        <textarea
          rows={8}
          placeholder="Describe your project in detail — what it is, why it matters, and what backers get."
          value={draft.full_description}
          onChange={(e) => onUpdate({ full_description: e.target.value })}
          className={`
            w-full rounded-[var(--radius-btn)] border px-3.5 py-2.5 text-sm
            bg-[var(--color-surface)] text-[var(--color-ink)]
            placeholder:text-[var(--color-ink-subtle)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] focus:border-transparent
            ${errors.full_description ? "border-[var(--color-brand-coral)]" : "border-[var(--color-border)]"}
          `}
        />
        {errors.full_description && (
          <p className="text-xs text-[var(--color-brand-coral)]">
            {errors.full_description}
          </p>
        )}
      </div>

      <ImageUpload
        label="Cover image"
        value={draft.cover_image_url}
        onChange={(url) => onUpdate({ cover_image_url: url })}
        hint="Recommended: 1280×720px or wider (16:9)"
      />

      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={handleNext}>
          Next: Funding goal
        </Button>
      </div>
    </div>
  );
}
