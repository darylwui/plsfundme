# Creator Launch Guide — Design

**Date:** 2026-04-25
**Scope:** Creator onboarding documentation — post-signup, pre-first-campaign.

---

## Goal

Close the gap between admin approval and a creator's first campaign draft. Approved creators currently land in an empty dashboard with a single "Launch your first campaign" button and no guidance on what they need to prepare. This spec ships a `/for-creators/launch-guide` page (interactive checklist + inline specs), wires it into the approval email and dashboard nudge, and updates the navbar link.

## Non-goals

- No tooltips, overlays, or in-app tour.
- No PDF download button (print stylesheet handles offline; ⌘P tip shown on page).
- No in-app milestone date calculator.
- No creator-to-creator examples.
- No server-side persistence of checklist state — localStorage only, no DB changes, no migrations.
- No changes to the creator application flow or Singpass KYC screens.

## Locked decisions

| Decision | Choice |
|---|---|
| Format | Public page (`/for-creators/launch-guide`) + dashboard nudge card |
| Depth | Checklist + short inline spec per item (no tooltips) |
| Scope | Assets + process overview (includes M1/M2/M3 milestone explanation) |
| Structure | Follows the campaign wizard form order |
| Offline | Print stylesheet + ⌘P tip line. No download button. |
| Interactivity | localStorage checkbox state. Versioned key. No DB. |
| Editable title | "Project title" row has inline text input, defaulting to "The world's best idea!" |

---

## Files changed

### Created

- **`app/(marketing)/for-creators/launch-guide/page.tsx`** — the guide page (draft already exists from brainstorm; spec defines final implementation).

### Modified

- **`components/layout/Navbar.tsx:35`** — update `href: "/for-creators"` → `"/for-creators/launch-guide"` for the "Creator guide" nav link.
- **`app/dashboard/page.tsx`** — add nudge card in the approved-no-campaigns empty state (currently lines 298–309).
- **`lib/email/templates.ts:217`** — update `sendCreatorApprovedEmail` to include a guide link paragraph before the primary CTA.
- **`app/(marketing)/for-creators/page.tsx`** — add a single "Get the launch checklist →" link near the page's bottom CTA.

### Deliberately not touched

- Any DB schema, migrations, or Supabase types.
- Creator application flow, Singpass card, or KYC screens.
- `components/auth/RegisterForm.tsx` or `CreatorApplyForm.tsx`.
- Any Stripe, Resend, or Sentry config.

---

## Page — `/for-creators/launch-guide`

### Architecture

`"use client"` page (checkbox interactivity requires client). No server data fetching — fully static content. Two localStorage keys:

- `gtb-launch-guide-v1` — JSON array of checked item IDs. Bump version suffix if checklist items change materially.
- `gtb-launch-guide-title-v1` — string, the creator's editable project title. Default: `"The world's best idea!"`.

`mounted` flag gates all localStorage reads to avoid hydration mismatch.

### Metadata

```tsx
export const metadata: Metadata = {
  title: "Launch checklist — get that bread",
  description:
    "Everything you need to prepare before launching your first campaign on get that bread. Interactive checklist, step by step.",
};
```

Note: `metadata` exports are only valid in Server Components. The page uses `"use client"`, so metadata must be declared in a parent layout or moved to a separate `generateMetadata` export in a wrapper. The simplest approach: keep the page as-is (`"use client"`) and accept that metadata comes from the nearest server layout. No metadata block in this file.

### Structure

```
Hero (badge + h1 + subtext)
Progress bar (X of 18 items ready / %)
  [completion message when all done]

Section: Campaign basics
Section: Funding goal & deadline
Section: Reward tiers
Section: Milestones & payouts
Section: After you submit

Print tip (⌘P line)
CTA card (Ready to launch? → /projects/create)
Back link (← Back to For Creators)
```

### Checklist content

Total: **18 items** across 5 sections.

#### Campaign basics (5 items)

| id | Label | Inline spec |
|---|---|---|
| `title` | Project title *(editable — see below)* | 5–100 characters. Clear and specific beats clever — backers skim fast. |
| `short_desc` | Short description | 20–200 characters. The hook that appears in search results and Explore cards. |
| `cover_image` | Cover image | 1200×675 px, JPG or PNG, under 2 MB. Your campaign's first impression — make it count. |
| `full_desc` | Full description | Tell the story: what it is, why it matters, what backers receive. Minimum 50 characters. |
| `category` | Category | Pick the one that fits best — it determines where your campaign appears on Explore. |

#### Funding goal & deadline (2 items)

| id | Label | Inline spec |
|---|---|---|
| `goal` | Funding goal (SGD) | Minimum SGD 500, maximum SGD 10,000,000. Aim for what you genuinely need to deliver. |
| `deadline` | Campaign deadline | Must be a future date. Most campaigns run 30–60 days — shorter creates urgency. |

#### Reward tiers (6 items)

| id | Label | Inline spec |
|---|---|---|
| `reward_title` | Tier title | What backers call what they're getting. E.g. "Early bird", "Supporter", "Founding member". |
| `reward_pledge` | Minimum pledge amount | The lowest amount that unlocks this tier. Factor in delivery costs. |
| `reward_desc` | Tier description | What backers actually receive. Be specific — vague promises erode trust and increase disputes. |
| `reward_delivery` | Estimated delivery date | Optional but strongly recommended. Sets expectations on when backers receive their reward. |
| `reward_physical` | Physical item flag | Check this if you're shipping something physical. Backers see it before they pledge. |
| `reward_cap` | Max backers cap | Optional. Use for limited-edition runs or capacity-constrained experiences. |

#### Milestones & payouts (3 items)

| id | Label | Inline spec |
|---|---|---|
| `m1` | Milestone 1 — first deliverable (40% of funds) | Your first concrete proof of progress. Photos, prototypes, signed supplier agreements — anything verifiable. |
| `m2` | Milestone 2 — mid-project proof (40% of funds) | Show the project advancing. This is the largest release, so the proof needs to match. |
| `m3` | Milestone 3 — final delivery (20% of funds) | Completion proof: rewards shipped, build delivered, or service rendered. Closes out the campaign. |

#### After you submit (2 items)

| id | Label | Inline spec |
|---|---|---|
| `review` | Admin review | We review within 2–3 business days. You'll get an email when approved or if changes are needed. |
| `live` | You're live | Once approved, your campaign page is public and backers can start pledging. |

### Editable project title row

The `title` item renders differently from all other rows:

- **Layout:** checkbox button (left) + content area (right).
- **Content area:** small-caps `PROJECT TITLE` label above the input; input below; spec text below input.
- **Input:** `type="text"`, `maxLength={100}`, default value `"The world's best idea!"`, styled with `bg-transparent font-bold text-lg`, dashed bottom border (`border-dashed border-[var(--color-border)]`), focus ring switches border to `var(--color-brand-golden)`.
- **Checked state:** input gains `line-through` class. Checkbox button is separate and still clickable.
- **Persistence:** onChange writes to `localStorage.setItem(TITLE_KEY, val)`.
- **Hydration safety:** render `DEFAULT_TITLE` until `mounted` is true.

### Row interaction (non-editable items)

- Full row is a `<button>` — clicking anywhere toggles checked state.
- Checked: `CheckCircle2` icon in `var(--color-brand-golden)`, label gains `line-through`, row `opacity-60`.
- Unchecked: `Circle` icon in `var(--color-border)`, normal opacity.
- Hover: `bg-[var(--color-surface-raised)]`.

### Progress bar

- Shows `X of 18 items ready` + percentage.
- Bar fill: `bg-[var(--color-brand-golden)]`, `transition-all duration-300`.
- When all 18 checked: show `"You're ready — head to the campaign wizard and launch. 🎉"` in `text-[var(--color-brand-crust)]`.
- Hidden on print (`print:hidden`).

### Print stylesheet

- `@media print` or Tailwind `print:` variants.
- Hide: nav, progress bar, CTA card, back link, print tip, checkbox icons.
- Show: square `<span>` stand-in checkboxes (`w-4 h-4 border border-[#999] rounded-sm`).
- Page background: `print:bg-white`.
- Input in print: pointer-events none, no border styling change needed (dashed border is subtle).

### CTA card

```tsx
<div className="mt-12 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] px-8 py-8 text-center print:hidden">
  <h3>Ready to launch?</h3>
  <p>Open the campaign wizard — you've got everything you need.</p>
  <Link href="/projects/create">Start your campaign →</Link>
</div>
```

---

## Dashboard nudge card

Location: `app/dashboard/page.tsx` — in the approved-creator, zero-campaigns empty state (around lines 298–309, after the existing "Launch your first campaign" CTA button).

Add a compact secondary card below the primary empty-state CTA:

```tsx
<Link
  href="/for-creators/launch-guide"
  className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
>
  <BookOpen className="w-4 h-4 shrink-0" />
  Not sure where to start? Run through the launch checklist first.
  <ArrowRight className="w-3 h-3" />
</Link>
```

Import `BookOpen` and `ArrowRight` from `lucide-react` (check if already imported).

---

## Approval email update

`lib/email/templates.ts` — `sendCreatorApprovedEmail` (line 217).

Add a guide paragraph **before** the primary CTA button. Final HTML body:

```html
<h2>Welcome aboard, ${args.creatorName}! 🎉</h2>
<p>Great news — your creator application has been reviewed and <strong>approved</strong>.</p>
<p>You can now create and publish your first campaign on get that bread. Share your idea with backers and start raising funds today.</p>
<p style="margin-top:16px;font-size:14px;color:#6b7280;">
  Not sure where to start?
  <a href="${appUrl}/for-creators/launch-guide" style="color:#7C3AED;">Run through our launch checklist</a>
  — it covers everything you need to prepare before you open the campaign wizard.
</p>
<a href="${appUrl}/projects/create" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
  Launch your first campaign
</a>
<p style="margin-top:24px;font-size:14px;color:#6b7280;">
  Questions? Reply to this email or contact us at <a href="mailto:hello@getthatbread.sg">hello@getthatbread.sg</a>.
</p>
```

---

## For-creators page update

`app/(marketing)/for-creators/page.tsx` — add a single link to the guide near the bottom CTA section. Exact placement: just above or below the existing bottom CTA. Copy:

```tsx
<Link
  href="/for-creators/launch-guide"
  className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-crust)] hover:underline"
>
  Get the launch checklist <ArrowRight className="w-3.5 h-3.5" />
</Link>
```

---

## Navbar update

`components/layout/Navbar.tsx:35` — change:

```ts
{ type: "link", href: "/for-creators", label: "Creator guide" },
```

to:

```ts
{ type: "link", href: "/for-creators/launch-guide", label: "Creator guide" },
```

---

## Verification / definition of done

- `/for-creators/launch-guide` renders all 5 sections, 18 items total.
- Checking an item shows gold checkmark + strikethrough + progress bar increment.
- Refreshing the page restores checked state and title from localStorage.
- "Project title" row: typing in the input updates the displayed text; value persists on refresh.
- "Project title" input defaults to "The world's best idea!" on a fresh browser (no localStorage).
- Progress shows "You're ready — launch your first campaign. 🎉" when all 18 are checked.
- `⌘P` print: nav, progress, CTA, and print-tip are hidden; content and square checkboxes are visible.
- Navbar "Creator guide" link navigates to `/for-creators/launch-guide`.
- Dashboard empty state (approved creator, no campaigns) shows the checklist nudge link below the primary CTA.
- Approval email includes guide link paragraph above primary CTA button.
- `/for-creators` page has "Get the launch checklist →" link.
- `npx tsc --noEmit` clean on changed files.
- `npm run lint` no new errors.

---

## Out of scope (explicitly deferred)

- Tooltips or hover overlays on checklist items.
- In-app wizard tour or step-by-step form overlay.
- Server-side checklist persistence (DB column, API endpoint).
- Milestone date calculator.
- Creator-to-creator examples or case studies.
- PDF generation (puppeteer, react-pdf). Browser print handles this.
- Download button.
- Checklist reset button (devtools is fine for v1).
- Additional editable fields beyond project title.
