"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface CreatorProfileEditorProps {
  userId: string;
  initial: {
    avatarUrl: string | null;
    bio: string;
    linkedinUrl: string | null;
    companyName: string | null;
    companyWebsite: string | null;
    projectType: string;
    projectDescription: string;
    status: "pending_review" | "approved" | "rejected";
  };
}

export function CreatorProfileEditor({ userId, initial }: CreatorProfileEditorProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [bio, setBio] = useState(initial.bio);
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl ?? "");
  const [companyName, setCompanyName] = useState(initial.companyName ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(initial.companyWebsite ?? "");
  const [projectType, setProjectType] = useState(initial.projectType);
  const [projectDescription, setProjectDescription] = useState(initial.projectDescription);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (bio.trim().length < 50) {
      setLoading(false);
      setError("Bio must be at least 50 characters.");
      return;
    }

    if (projectDescription.trim().length < 100) {
      setLoading(false);
      setError("Project description must be at least 100 characters.");
      return;
    }

    const websiteRegex = /^https?:\/\//i;
    if (linkedinUrl && !websiteRegex.test(linkedinUrl)) {
      setLoading(false);
      setError("LinkedIn URL must start with http:// or https://.");
      return;
    }

    if (companyWebsite && !websiteRegex.test(companyWebsite)) {
      setLoading(false);
      setError("Company website must start with http:// or https://.");
      return;
    }

    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    if (profileError) {
      setLoading(false);
      setError(profileError.message);
      return;
    }

    const { error: pmError } = await supabase
      .from("creator_profiles")
      .update({
        bio: bio.trim(),
        linkedin_url: linkedinUrl.trim() || null,
        company_name: companyName.trim() || null,
        company_website: companyWebsite.trim() || null,
        project_type: projectType.trim(),
        project_description: projectDescription.trim(),
      })
      .eq("id", userId);

    setLoading(false);

    if (pmError) {
      setError(pmError.message);
      return;
    }

    setSuccess("Profile updated. Your project creator cards now show the latest information.");
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-4">
        <div>
          <h2 className="font-bold text-[var(--color-ink)]">Public creator card</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
            These details appear on your project pages for backers to review.
          </p>
        </div>

        <ImageUpload
          value={avatarUrl}
          onChange={setAvatarUrl}
          label="Profile photo"
          hint="Shown publicly on your creator card"
          compact
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-ink)]">
            Bio <span className="text-[var(--color-brand-danger)]">*</span>
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell backers who you are, your background, and what drives your work..."
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] resize-none"
          />
          <p className="text-xs text-[var(--color-ink-subtle)]">Minimum 50 characters · {bio.length}/50</p>
        </div>

        <Input
          label="LinkedIn URL"
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/yourprofile"
          hint="Optional"
        />
        <Input
          label="Company name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Pte. Ltd."
          hint="Optional"
        />
        <Input
          label="Company website"
          type="url"
          value={companyWebsite}
          onChange={(e) => setCompanyWebsite(e.target.value)}
          placeholder="https://yourcompany.com"
          hint="Optional"
        />

        <Input
          label="Project type"
          type="text"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          placeholder="Technology, Food & Beverage, Social Impact..."
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-ink)]">
            What you are building <span className="text-[var(--color-brand-danger)]">*</span>
          </label>
          <textarea
            rows={5}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Describe your project mission and what backers can expect..."
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)] resize-none"
          />
          <p className="text-xs text-[var(--color-ink-subtle)]">Minimum 100 characters · {projectDescription.length}/100</p>
        </div>

        <p className="text-xs text-[var(--color-ink-subtle)]">
          Creator status: <span className="font-semibold">{initial.status.replace("_", " ")}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-btn)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-[var(--radius-btn)] border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-700">
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>Save creator profile</Button>
      </div>
    </form>
  );
}
