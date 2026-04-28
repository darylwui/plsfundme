/**
 * Helpers for surfacing wizard `campaign_drafts` rows on dashboard pages.
 * The wizard auto-saves the entire ProjectDraft as JSON on every keystroke
 * (see `hooks/useProjectCreation.ts`); these helpers extract the bits the
 * dashboard's draft-continuation card actually displays.
 */

/**
 * Pull `title` out of the wizard's `draft_data` JSON blob. Returns "" for
 * any malformed shape — the draft-continuation card has its own
 * "Untitled draft" fallback.
 */
export function extractDraftTitle(draftData: unknown): string {
  if (
    draftData &&
    typeof draftData === "object" &&
    "title" in draftData &&
    typeof (draftData as { title: unknown }).title === "string"
  ) {
    return (draftData as { title: string }).title;
  }
  return "";
}

/**
 * The narrow shape consumed by `<DraftContinuationCard source="campaign-draft">`.
 */
export interface WizardDraftSummary {
  title: string;
  step: number;
  updated_at: string;
}
