import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DeleteDraftButton } from "@/components/dashboard/DeleteDraftButton";
import { formatRelativeTime } from "@/lib/utils/dates";

interface WizardDraftBannerProps {
  draft: {
    title: string;
    step: number;
    updated_at: string;
  };
}

/**
 * Slim "you have a draft in progress" banner used when the creator already has
 * other projects (active, pending_review, etc.) so the full DraftContinuationCard
 * would compete for attention. Always points the creator back to /projects/create
 * — the wizard auto-restores from `campaign_drafts` on load.
 */
export function WizardDraftBanner({ draft }: WizardDraftBannerProps) {
  const title = draft.title?.trim() ? draft.title : "Untitled draft";
  const lastSaved = formatRelativeTime(draft.updated_at);

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-brand-crumb)]/60 to-[var(--color-brand-crumb)]/20 dark:from-[var(--color-brand-crust-dark)]/25 dark:to-[var(--color-brand-crust-dark)]/10 px-4 py-3 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span aria-hidden="true" className="text-lg shrink-0">📝</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-ink)] truncate">
            Continue your draft: {title}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            {lastSaved && <>Last saved {lastSaved} · </>}Step {draft.step} of 5
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/projects/create"
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-crust)] hover:underline"
        >
          Continue editing
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <DeleteDraftButton source="campaign-draft" />
      </div>
    </div>
  );
}
