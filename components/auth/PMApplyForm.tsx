"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/ImageUpload";

const PROJECT_TYPES = [
  "Technology",
  "Arts & Creative",
  "Food & Beverage",
  "Education",
  "Social Impact",
  "Health & Wellness",
  "Fashion",
  "Gaming",
  "Music",
  "Film & Media",
  "Other",
];

interface PMApplyFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function PMApplyForm({ userId, onSuccess }: PMApplyFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: About you
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // Step 2: Campaign plan
  const [projectType, setProjectType] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Step 3: Identity
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);

  // Profile photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!bio.trim()) e.bio = "Bio is required";
    if (bio.trim().length < 50) e.bio = "Bio must be at least 50 characters";
    if (linkedinUrl && !/^https?:\/\//i.test(linkedinUrl))
      e.linkedinUrl = "LinkedIn URL must start with http:// or https://";
    if (companyWebsite && !/^https?:\/\//i.test(companyWebsite))
      e.companyWebsite = "Website URL must start with http:// or https://";
    return e;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!projectType) e.projectType = "Please select a project type";
    if (!projectDescription.trim()) e.projectDescription = "Project description is required";
    if (projectDescription.trim().length < 100)
      e.projectDescription = "Description must be at least 100 characters";
    return e;
  }

  function handleNext() {
    let errs: Record<string, string> = {};
    if (step === 1) errs = validateStep1();
    else if (step === 2) errs = validateStep2();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/pm-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          bio: bio.trim(),
          linkedin_url: linkedinUrl.trim() || null,
          company_name: companyName.trim() || null,
          company_website: companyWebsite.trim() || null,
          project_type: projectType,
          project_description: projectDescription.trim(),
          id_document_url: idDocumentUrl,
          photo_url: photoUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors({ form: json.error ?? "Something went wrong. Please try again." });
        return;
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = 3;

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Step {step} of {totalSteps}</span>
          <span className="text-xs text-[var(--color-ink-subtle)]">
            {step === 1 && "About you"}
            {step === 2 && "Your campaign plan"}
            {step === 3 && "Identity verification"}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-brand-violet)] transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: About you */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-lg text-[var(--color-ink)]">About you</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              Tell us about yourself. This appears on your public creator card on each project page, and you can edit it later from your dashboard.
            </p>
          </div>

          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            label="Profile photo"
            hint="Shown publicly on your creator card for all your campaigns"
            compact
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">
              Bio <span className="text-[var(--color-brand-coral)]">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Tell us who you are, your background, and what drives you..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] resize-none"
            />
            <div className="flex justify-between">
              {errors.bio ? (
                <p className="text-xs text-[var(--color-brand-coral)]">{errors.bio}</p>
              ) : (
                <p className="text-xs text-[var(--color-ink-subtle)]">Minimum 50 characters</p>
              )}
              <p className={`text-xs ${bio.length < 50 ? "text-[var(--color-ink-subtle)]" : "text-[var(--color-brand-lime)]"}`}>
                {bio.length}/50
              </p>
            </div>
          </div>

          <Input
            label="LinkedIn URL"
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            error={errors.linkedinUrl}
            hint="Optional — shown on your project creator card"
          />
          <Input
            label="Company name"
            type="text"
            placeholder="Acme Pte. Ltd."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            hint="Optional — shown on your project creator card"
          />
          <Input
            label="Company website"
            type="url"
            placeholder="https://yourcompany.com"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            error={errors.companyWebsite}
            hint="Optional — shown on your project creator card"
          />

          <Button type="button" fullWidth onClick={handleNext} size="lg">
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Campaign plan */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-bold text-lg text-[var(--color-ink)]">Your campaign plan</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              Describe the project you want to raise funds for.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">
              Project type <span className="text-[var(--color-brand-coral)]">*</span>
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)]"
            >
              <option value="">Select a category...</option>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.projectType && (
              <p className="text-xs text-[var(--color-brand-coral)]">{errors.projectType}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">
              Project description <span className="text-[var(--color-brand-coral)]">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Describe your project idea, what you plan to build, and why it matters..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] resize-none"
            />
            <div className="flex justify-between">
              {errors.projectDescription ? (
                <p className="text-xs text-[var(--color-brand-coral)]">{errors.projectDescription}</p>
              ) : (
                <p className="text-xs text-[var(--color-ink-subtle)]">Minimum 100 characters</p>
              )}
              <p className={`text-xs ${projectDescription.length < 100 ? "text-[var(--color-ink-subtle)]" : "text-[var(--color-brand-lime)]"}`}>
                {projectDescription.length}/100
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" size="lg" variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" size="lg" fullWidth onClick={handleNext}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: Identity */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-bold text-lg text-[var(--color-ink)]">Identity verification</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              Help us verify your identity. This keeps our platform trustworthy for everyone.
            </p>
          </div>

          {errors.form && (
            <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-[var(--color-brand-coral)]">
              {errors.form}
            </div>
          )}

          <ImageUpload
            value={idDocumentUrl}
            onChange={setIdDocumentUrl}
            label="ID document (optional)"
            hint="Upload a photo of your NRIC, passport, or other government-issued ID"
            compact
          />

          {/* Singpass placeholder */}
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇸🇬</span>
              <span className="font-semibold text-sm text-[var(--color-ink)]">Singpass / MyInfo</span>
              <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Coming soon
              </span>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
              Identity verification via Singpass is coming soon. Once available, you&apos;ll verify your NRIC directly through Singpass — no documents needed.
            </p>
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink-muted)] cursor-not-allowed opacity-60"
            >
              <span>🇸🇬</span>
              Verify with Singpass (Coming soon)
            </button>
          </div>

          <div className="flex gap-3">
            <Button type="button" size="lg" variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" size="lg" fullWidth loading={loading} onClick={handleSubmit}>
              Submit application
            </Button>
          </div>

          <p className="text-xs text-center text-[var(--color-ink-subtle)]">
            By submitting you agree to our{" "}
            <a href="/terms" className="underline hover:text-[var(--color-ink)]">Terms</a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-[var(--color-ink)]">Privacy Policy</a>.
          </p>
        </div>
      )}
    </div>
  );
}
