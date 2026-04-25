# Creator Dashboard Onboarding — Design Spec

**Date:** 2026-04-25
**Status:** Approved (brainstorming)
**Owner:** daryl

## Summary

Newly-approved creators land on `/dashboard` and see two co-equal cards (a disabled "Verify with Singpass" card and an empty-state "Launch your first campaign" card with a buried checklist link). There is no clear sequence — first-time users don't know what to do first.

This change introduces two dashboard surfaces that orient creators in their first session:

1. **`<CreatorOnboardingStepper />`** — a 4-step vertical list that replaces both the empty-state card and the standalone Singpass card when a creator is approved with zero projects.
2. **`<DraftContinuationCard />`** — a focused "Pick up where you left off" card that replaces the existing funding-progress + backers view when the creator's only project is a draft (where the standard view shows a misleading $0 / $goal progress bar).

Both surfaces are first-session-only — the stepper retires as soon as the creator has any saved project (including a draft), and the draft card retires once an active campaign exists.

## Goals

- Make the next action obvious for a creator in their first dashboard session.
- Surface the launch checklist (`/for-creators/launch-guide`) where it actually informs the decision.
- Replace UI elements that lie about state (e.g., a $0 / $goal progress bar for a pre-launch draft) with surfaces that reflect reality.
- Wire Singpass into the orientation roadmap now (as a "Coming soon" step) so when it ships, creators already know it's coming.

## Non-goals

- Pre-approval onboarding (pending_review / needs_info / rejected states keep their existing cards — they already work).
- Creator profile completeness, milestone education, or any other dashboard nudges beyond the first-campaign path.
- Replacing `confirm()` with a custom modal — match the rest of the app, ship the same UX everyone else uses.
- E2E or visual regression test infrastructure.

---

## Architecture

Two new components, both rendered conditionally inside the existing `CreatorDashboard` server component in `app/dashboard/page.tsx`. No new routes, no new API endpoints, no schema changes.

```
app/dashboard/page.tsx (existing, modified)
├── creator status === "approved" + projects.length === 0
│     → <CreatorOnboardingStepper singpassVerified={...} />
│
├── creator status === "approved" + activeProject?.status === "draft"
│     + no active campaign in projects
│     → <DraftContinuationCard project={activeProject} />
│       (replaces FundingProgressCard + BackerTable for that case)
│
└── otherwise: existing layout, untouched
```

Pre-approval states (`pending_review`, `needs_info`, `rejected`) and approved-with-active-campaign render exactly as today.

---

## Components

### `<CreatorOnboardingStepper />`

**File:** `components/dashboard/CreatorOnboardingStepper.tsx`
**Type:** Server component (no client JS, no DB writes)
**Props:** `{ singpassVerified: boolean }`

**Renders:**
- Card heading: **"Get your first campaign live"**
- Subtitle: **"Four quick steps from approved to launched."**
- Four step rows (vertical list, dividers between adjacent rows except the last):

| # | Title | Description | Status (today) | Action |
|---|---|---|---|---|
| 1 | Application approved | "You're cleared to create campaigns" | `done` (always) | none |
| 2 | Verify identity with Singpass | "Builds trust with your backers — we'll email you when it's live" | `locked` (always for now); becomes `done` when `singpassVerified=true`, `pointer` when verification flow is live but unverified | "Coming soon" pill |
| 3 | Run through the launch checklist | "15-min prep doc covering every section of your campaign" | `pointer` | "Open →" link to `/for-creators/launch-guide` |
| 4 | Launch your first campaign | "Walk through the form and submit for review" | `cta` | Primary `<Button>` "Start a project →" linking to `/projects/create` |

**Step row variants:**
- `done` — green check circle (`Check` icon, `bg-emerald-500` light / `bg-emerald-500/20 text-emerald-400` dark)
- `locked` — grey lock circle (`Lock` icon, `bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]`), row dimmed to ~70% opacity, "Coming soon" amber pill next to title
- `pointer` — amber number badge (`bg-[var(--color-brand-crumb)] text-[var(--color-brand-crust-dark)]`), "Open →" link styled as `text-[var(--color-brand-crust)] font-bold`
- `cta` — gold number badge (`bg-[var(--color-brand-golden)] text-white`), primary `<Button>` instead of a link

### `<DraftContinuationCard />`

**File:** `components/dashboard/DraftContinuationCard.tsx`
**Type:** Server component shell + client island for delete
**Props:** `{ project: { id: string; title: string; slug: string; updated_at: string } }`

**Renders:**
- Outer card: existing `bg-[var(--color-surface)] border rounded-[var(--radius-card)]` styling
- Header strip: gradient `from-[var(--color-brand-crumb)] to-[var(--color-brand-crumb)]/50` (or dark equivalent), one line: **"📝 Pick up where you left off"** in `text-[var(--color-brand-crust-dark)]` bold
- Body padding `p-5`:
  - Top row: amber DRAFT pill + "Last saved [relative time]" (e.g., "2 hours ago") using a new `formatRelativeTime(updated_at)` helper added to `lib/utils/dates.ts` (see "Helpers" below — no new npm dependency)
  - Title: `<h2>` with project title, falls back to **"Untitled draft"** if empty/null
  - One-line reassurance: **"Your draft is saved. Continue editing, then submit for review when you're ready."**
  - Action row: primary `<Button>` "✏️ Continue editing" linking to `/projects/[slug]/edit`, plus `<DeleteDraftButton projectId={project.id} />`

### `<DeleteDraftButton />`

**File:** `components/dashboard/DeleteDraftButton.tsx`
**Type:** Client island (`"use client"`)
**Props:** `{ projectId: string }`

**Renders:**
- Small text-style button: "Delete draft" in `text-[var(--color-ink-subtle)] hover:text-[var(--color-ink-muted)] underline text-sm font-semibold`
- Below the button (when error): inline error text in `text-red-600 text-xs`

**Behavior:**
1. Click → `window.confirm("Delete this draft? This cannot be undone.")`
2. If confirmed:
   - Set local `pending=true`, button label switches to "Deleting…", button disabled
   - `fetch("/api/projects/" + projectId + "/delete", { method: "POST" })`
   - On `ok`: call `router.refresh()` from `next/navigation` — server re-renders the dashboard, deleted draft drops out of the query, stepper reappears
   - On non-ok or thrown error: clear pending, render error message under the button: "Couldn't delete draft. Try again or contact support."
3. If dismissed: do nothing.

---

## Data flow

### Server queries

The existing `app/dashboard/page.tsx` `CreatorDashboard` already fetches everything required.

**Required change:** the existing `projects` query in `CreatorDashboard` must filter out soft-deleted projects:

```ts
const { data: projects } = await supabase
  .from("projects")
  .select("...")
  .eq("creator_id", userId)
  .is("deleted_at", null)        // ← ADD THIS LINE
  .order("created_at", { ascending: false })
  .limit(5);
```

Without this, deleting the only draft would leave a soft-deleted row in `typedProjects`, and the stepper would not reappear.

No other query changes. `creator_profiles.singpass_verified` is already selected and feeds straight into the stepper prop.

### Client-side state

- `<CreatorOnboardingStepper>` — none
- `<DraftContinuationCard>` — none in the shell
- `<DeleteDraftButton>` — `useState` for `{ status: "idle" | "pending" | "error", message?: string }`. No global state, no SWR/React Query.

### Network

- Dashboard render: zero new requests
- Delete flow: one `POST /api/projects/[id]/delete` (existing endpoint, no changes) + `router.refresh()` (server re-renders, no manual cache work)

---

## Render decision logic

Inside `CreatorDashboard` (`app/dashboard/page.tsx`), after fetching projects:

```ts
const hasActiveCampaign = typedProjects.some(p => p.status === "active");
const onlyProjectIsDraft =
  typedProjects.length > 0 &&
  !hasActiveCampaign &&
  activeProject?.status === "draft";

// Within the approved branch:
if (typedProjects.length === 0) {
  // Replaces SingpassVerificationCard AND empty state
  return <CreatorOnboardingStepper singpassVerified={singpassVerified} />;
}

if (onlyProjectIsDraft) {
  // Replaces FundingProgressCard + BackerTable for the activeProject only
  // The "All campaigns" list at the bottom still renders if typedProjects.length > 1
  return <DraftContinuationCard project={activeProject} />;
}

// Otherwise: existing layout (FundingProgressCard, BackerTable, all-campaigns list)
```

The `SingpassVerificationCard` import and conditional render in the dashboard are removed entirely — Singpass info now lives only inside the stepper (when relevant) and inside the `SingpassVerifiedBadge` (when verified, which is unchanged).

---

## Edge cases

1. **Soft-deleted projects.** Addressed in Data Flow — add `.is("deleted_at", null)` to the query.

2. **Multi-draft creator** (no active campaigns, multiple drafts). `activeProject` resolves to the most recent draft → draft card highlights it. Other drafts still appear in the existing "All campaigns" list at the bottom. Slightly redundant but not broken; keep as-is.

3. **Creator with active campaign + a separate draft.** `hasActiveCampaign === true`, so we fall through to the existing layout. Draft does not show as a continuation card; appears only in the bottom "All campaigns" list. Existing behavior preserved.

4. **Untitled draft.** Title field empty / null → fall back to **"Untitled draft"** for the heading.

5. **Delete failure.** Inline error under the button, button returns to idle. No toast (no toast system in app today).

6. **Delete success.** `router.refresh()` re-renders the dashboard. If the draft was the creator's only project, the stepper reappears. No extra wiring.

7. **Singpass goes live later.** `<CreatorOnboardingStepper>` already takes `singpassVerified`. Future PR flips step 2 from `locked` → `done` (when verified) or `locked` → `pointer` (when not yet verified, with a "Verify now" link). No dashboard change needed.

8. **Dark mode.** Use existing CSS vars (`--color-ink`, `--color-surface`, `--color-border`, `--color-brand-*`) which already work in both modes. For tinted icon backgrounds, follow the patterns already in `SingpassVerificationCard.tsx`:
   - **Amber "Coming soon" pill:** `bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`
   - **Emerald done check:** `bg-[var(--color-brand-success)]/10 text-[var(--color-brand-success)]` (CSS var handles both modes; no dark variant needed)
   - **Grey lock circle:** `bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]` (also CSS-var-based)

---

## Testing

### Automated (Vitest + Testing Library)

**`tests/components/dashboard/CreatorOnboardingStepper.test.tsx`**
- All 4 step titles render
- Step 1 renders a check icon (done state)
- With `singpassVerified={false}`: step 2 shows "Coming soon" pill and is dimmed
- With `singpassVerified={true}`: step 2 renders as done (forward-looking sanity check for the prop wiring)
- Step 3 link `href` is `/for-creators/launch-guide`
- Step 4 button `href` is `/projects/create`

**`tests/components/dashboard/DraftContinuationCard.test.tsx`**
- Renders project title
- Renders "Last saved [time]" with `addSuffix: true`
- With empty title: renders "Untitled draft"
- "Continue editing" button `href` is `/projects/[slug]/edit`

**`tests/components/dashboard/DeleteDraftButton.test.tsx`**
- Click → `window.confirm` invoked with the right copy
- Confirmed click → `fetch` called with `POST /api/projects/[id]/delete`
- Pending state: button disabled, label switches to "Deleting…"
- Success: `router.refresh()` called
- Failure: error message renders, button returns to idle
- Mock `fetch` and `useRouter`

### Manual smoke test (gating release)

A successful manual run is required before declaring the feature done. Hit the dev server (`port 65207` or current) and verify:

1. Approved creator with **zero projects** → stepper renders, all 4 steps visible, step 4 CTA navigates to `/projects/create`
2. Approved creator with **one draft** → draft card renders, "Last saved" shows a sensible relative time, "Continue editing" navigates to the edit page
3. Click "Delete draft" on a draft, confirm in the dialog → dashboard refreshes back to the stepper
4. Approved creator with **active campaign** → existing layout renders unchanged (FundingProgressCard + BackerTable visible)
5. Pre-approval states (`pending_review`, `needs_info`, `rejected`) → existing cards unchanged
6. Light + dark mode on the new components — contrast and readability look right

### Out of scope

- E2E (no Playwright/Cypress in project)
- Visual regression
- Re-testing the existing `/api/projects/[id]/delete` endpoint — already shipped, has its own coverage

---

## Helpers

### `formatRelativeTime(date)` — added to `lib/utils/dates.ts`

A small helper for "Last saved 2 hours ago"-style copy. No external dependency; written using the same patterns as the existing `formatDate` / `daysRemaining` helpers in that file.

**Signature:** `(date: string | Date | null | undefined) => string`

**Behavior:**
- Returns empty string for invalid input (matches existing helpers)
- < 60 seconds → `"just now"`
- < 60 minutes → `"N minutes ago"` (or `"1 minute ago"`)
- < 24 hours → `"N hours ago"` (or `"1 hour ago"`)
- < 7 days → `"N days ago"` (or `"1 day ago"`)
- ≥ 7 days → falls through to existing `formatDate(date)` (e.g., "15 May 2025")
- Future dates (clock skew) → `"just now"` (clamp to non-negative diff)

**Tests added to `lib/utils/__tests__/dates.test.ts`** (or a sibling test file if that path doesn't exist) covering each branch.

## File summary

**New files:**
- `components/dashboard/CreatorOnboardingStepper.tsx`
- `components/dashboard/DraftContinuationCard.tsx`
- `components/dashboard/DeleteDraftButton.tsx`
- `tests/components/dashboard/CreatorOnboardingStepper.test.tsx`
- `tests/components/dashboard/DraftContinuationCard.test.tsx`
- `tests/components/dashboard/DeleteDraftButton.test.tsx`

**Modified files:**
- `app/dashboard/page.tsx` — add `.is("deleted_at", null)` to projects query; remove `SingpassVerificationCard` import + render; replace empty-state card with `<CreatorOnboardingStepper />`; conditionally swap `<FundingProgressCard>` + `<BackerTable>` for `<DraftContinuationCard>` when `onlyProjectIsDraft`.
- `lib/utils/dates.ts` — add `formatRelativeTime(date)` helper. Tests added in a new `lib/utils/__tests__/dates.test.ts`.

**Unmodified:**
- `components/dashboard/SingpassVerificationCard.tsx` — `SingpassVerifiedBadge` is still used elsewhere; the unused `SingpassVerificationCard` export can be removed in a follow-up if nothing else imports it
- `app/api/projects/[id]/delete/route.ts` — existing, no changes
- `lib/supabase/server.ts`, `components/ui/Button.tsx`, etc. — no changes

---

## Open questions

None. All design decisions finalized in brainstorming.
