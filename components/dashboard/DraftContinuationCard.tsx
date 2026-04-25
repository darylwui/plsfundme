import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteDraftButton } from "@/components/dashboard/DeleteDraftButton";
import { formatRelativeTime } from "@/lib/utils/dates";

type DraftContinuationCardProps =
  | {
      source: "project";
      project: {
        id: string;
        title: string;
        slug: string;
        updated_at: string;
      };
    }
  | {
      source: "campaign-draft";
      draft: {
        title: string;
        updated_at: string;
        step: number;
      };
    };

export function DraftContinuationCard(props: DraftContinuationCardProps) {
  const rawTitle = props.source === "project" ? props.project.title : props.draft.title;
  const title = rawTitle?.trim() ? rawTitle : "Untitled draft";

  const lastSaved = formatRelativeTime(
    props.source === "project" ? props.project.updated_at : props.draft.updated_at,
  );

  const continueHref =
    props.source === "project" ? `/projects/${props.project.slug}/edit` : `/projects/create`;

  // Step indicator only meaningful for the in-progress wizard source.
  const stepHint = props.source === "campaign-draft" ? `Step ${props.draft.step} of 5` : null;

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-[var(--color-brand-crumb)] to-[var(--color-brand-crumb)]/40 dark:from-[var(--color-brand-crust-dark)]/25 dark:to-[var(--color-brand-crust-dark)]/10 px-5 py-2.5 border-b border-[var(--color-border)]">
        <p className="text-xs font-bold text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
          <span aria-hidden="true">📝</span> Pick up where you left off
        </p>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 uppercase tracking-wider">
            Draft
          </span>
          {lastSaved && (
            <span className="text-xs text-[var(--color-ink-subtle)]">Last saved {lastSaved}</span>
          )}
          {stepHint && (
            <>
              <span className="text-xs text-[var(--color-ink-subtle)]" aria-hidden="true">·</span>
              <span className="text-xs text-[var(--color-ink-subtle)]">{stepHint}</span>
            </>
          )}
        </div>

        <h2 className="text-xl font-black text-[var(--color-ink)] mb-2">{title}</h2>

        <p className="text-sm text-[var(--color-ink-muted)] mb-5 leading-relaxed">
          Your draft is saved. Continue editing, then submit for review when you&apos;re ready.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <Button asChild variant="primary">
            <Link href={continueHref}>
              <Pencil className="w-4 h-4" />
              Continue editing
            </Link>
          </Button>
          {props.source === "project" ? (
            <DeleteDraftButton source="project" projectId={props.project.id} />
          ) : (
            <DeleteDraftButton source="campaign-draft" />
          )}
        </div>
      </div>
    </div>
  );
}
