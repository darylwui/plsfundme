# PDPA Review — Design

**Date:** 2026-04-24
**Scope:** Pre-launch trust & compliance, sub-project #1 of 3.

## Goal

Close the gap between what `/privacy` claims and what the code actually does. Lock honest inline consent at the single collection point still missing it (pledge checkout). Tighten Sentry session replay so the policy disclosure matches a narrower, defensible reality.

## Non-goals

- Account-deletion API or UI (handled by email to DPO mailbox for now).
- Cookie banner (GA4 is functional analytics, not advertising; PDPA doesn't require a banner for non-advertising analytics as long as it's disclosed).
- New DB columns — no `marketing_consent`, no `deletion_requested`, no migrations.
- Pre-flight Singpass KYC consent UX (couples to Singpass-live ship, currently "Coming soon").
- Named DPO person — `hello@getthatbread.sg` serves as the DPO mailbox.
- Automated retention-enforcement jobs.
- Breach-notification runbook.
- Self-service data export / access portal.

## Product decisions (locked)

1. **Scope is B: policy rewrite + consent UX at collection points.** No account-deletion flow. Right-to-erasure is fulfilled manually via email → DB delete until volume justifies self-serve.
2. **Sentry session replay is error-only.** Drop `replaysSessionSampleRate` from `0.1` to `0`. Keep `replaysOnErrorSampleRate: 1.0`. Narrower disclosure, no ambient recording.
3. **Marketing emails are off.** Transactional-only. Policy language about "product updates or announcements" is removed. No opt-in checkbox, no preference center, no marketing consent column — YAGNI until we actually want to send a digest.
4. **Singpass KYC disclosure is factual.** Stored fields: `verified_name`, `verified_dob`, `nationality`, `residency`, `verified_at`, `uinfin_hash` (SHA-256). Raw UINFIN is never persisted. One-row-per-creator enforced by unique index on `uinfin_hash`. Legal basis: MAS payment services compliance + anti-duplicate-account fraud prevention.
5. **Consent pattern is inline text with links.** PDPA accepts deemed consent by conduct for processing necessary to deliver the service. Signup, pledge, and creator apply all qualify. No required checkboxes.

## Files changed

### New

- **`docs/superpowers/specs/2026-04-24-pdpa-review-design.md`** — this spec.

### Rewritten

- **`app/(marketing)/privacy/page.tsx`** — section order and content rewrite. Preserve the existing `Section` helper pattern and `LAST_UPDATED` / `CONTACT_EMAIL` constants. Bump `LAST_UPDATED` to `"24 April 2026"`.

### Edited

- **`instrumentation-client.ts`** — single-line edit: `replaysSessionSampleRate: 0.1` → `0`.
- **`components/backing/CheckoutForm.tsx`** — add one consent line under the Confirm pledge button.

### Deliberately not touched

- `components/auth/RegisterForm.tsx` — already has inline consent at line 267.
- `components/auth/CreatorApplyForm.tsx` — already has inline consent at line 306.
- `components/dashboard/SingpassVerificationCard.tsx` — verification flow is "Coming soon"; pre-flight KYC UX is deferred.
- Any email, DB, Stripe, Supabase, or Resend integration code.

## Content — /privacy page structure

13 sections total. Sections 2, 5, 6, 7, 8 are meaty rewrites. Others are touch-ups or unchanged.

### 1. Introduction

Keep opening paragraph about PDPA compliance. Add a final sentence: *"For any privacy-related request, contact our Data Protection Officer (see Section 13)."*

### 2. Data we collect

Expand the current list to cover everything we actually capture:

- **Account information:** Name, email address, password (hashed by Supabase Auth).
- **Profile information:** Display name and profile picture if you choose to provide them.
- **Campaign data:** Project titles, descriptions, images, rewards, milestones, and other content creators submit.
- **Pledge and payment data:** Pledge amounts, selected rewards, shipping details where rewards require them. Card data is handled directly by Stripe — we never see or store full card numbers.
- **Creator verification (KYC):** For creators who verify via Singpass, we store verified name, date of birth, nationality, residency status, and a one-way hash of the UINFIN for duplicate-account detection. The raw UINFIN is never stored. See Section 7.
- **Uploaded images:** Profile pictures, campaign artwork, and reward imagery are stored in Supabase Cloud Storage. Campaign and reward images are publicly accessible via CDN as part of the campaign's public page; profile pictures follow your profile visibility.
- **In-app messages:** Messages between creators and backers within a campaign's review threads are stored for the lifespan of that campaign plus a 30-day grace period after the final milestone is released or the campaign is cancelled.
- **Usage data:** IP address, browser type, pages visited, and interaction data collected via our hosting provider (Vercel) and analytics provider (Google Analytics 4 — see Section 5).
- **Error diagnostics:** When something breaks, we collect technical error context via Sentry. This may include a session replay recording of the failing interaction — see Section 6.
- **Communications:** Messages you send to us via email or support channels.

### 3. How we use your data

Rewrite without the marketing bullet:

- Create and manage your account on the platform.
- Process pledges and creator payouts securely via Stripe.
- Send transactional emails (pledge confirmations, campaign status updates, payout notifications, password resets, refund notices). We do not send marketing emails.
- Review campaigns and creator applications for compliance with our Terms.
- Verify creator identity (KYC) for payout eligibility and anti-fraud.
- Respond to customer support enquiries and PDPA rights requests.
- Diagnose technical issues via error tracking and limited session replay (Section 6).
- Improve platform usability via aggregated usage analytics.

### 4. Data sharing

Extend the current list. Add Sentry and Google Analytics:

- **Stripe** — payment processing and creator payouts. Subject to Stripe's own Privacy Policy.
- **Supabase** — database, authentication, and storage hosting.
- **Vercel** — website hosting and deployment. May log anonymised request data.
- **Resend** — transactional email delivery.
- **Sentry** — error tracking and error-only session replay (Section 6).
- **Google Analytics 4 (Google)** — platform usage analytics with IP anonymisation enabled.

Keep the "we do not sell your data" and legal-disclosure clauses.

### 5. Cookies and analytics *(rewritten)*

Honest version:

- **Essential session cookies** keep you logged in and are required for the platform to function.
- **Analytics cookies** are set by Google Analytics 4 to measure page views, traffic sources, and aggregated interaction metrics. We use IP anonymisation so your full IP address is never stored by Google. We do not use advertising or retargeting cookies, and we do not share analytics data with ad networks.

### 6. Session replay *(new section)*

Explain narrowly:

- We use Sentry's session replay feature to record **only the sessions in which an error occurs**. We do not record sessions in the normal, error-free case.
- When an error triggers a replay, Sentry captures DOM changes, mouse movement, clicks, navigation, and network request metadata for that session. Form input text is masked by default — we cannot see what you typed into input fields.
- Replays are used by our engineering team to reproduce and fix crashes.
- Recordings are retained by Sentry for **30 days** and then deleted.

### 7. Creator verification (Singpass MyInfo) *(new section)*

- Creators are required to verify identity through Singpass MyInfo before they can receive payouts.
- From a successful Singpass verification, we store the following fields: verified name, date of birth, nationality, and residency status.
- We also store a **SHA-256 hash of the UINFIN** — not the UINFIN itself. The hash lets us prevent one person from holding multiple verified creator accounts. The raw UINFIN is never written to our database.
- This data is used strictly for payout compliance (MAS payment services rules) and anti-fraud. It is not used for marketing, not shared with other backers or creators, and is accessible only to the creator themselves and to platform admins performing compliance review.
- KYC records are retained for **7 years** from account closure to meet MAS and AML record-keeping obligations.

### 8. Data retention

Replace the current one-paragraph section with specifics:

| Data | Retention |
|---|---|
| Account (name, email, profile) | For as long as the account is active. Deleted or anonymised within 30 days of deletion request. |
| Pledges and payout records | 7 years from the transaction date (financial record-keeping under Singapore law). |
| Creator KYC (Singpass) | 7 years from account closure (MAS / AML compliance). |
| Campaign content (projects, rewards, updates, milestones) | For the lifetime of the platform unless you specifically request deletion; anonymised on account deletion. |
| In-app messages | Lifespan of the campaign + 30 days grace after final milestone release or cancellation. |
| Sentry error data and session replays | 30 days. |
| Server and request logs (Vercel) | Provider default, typically ≤ 30 days. |
| Stripe webhook event log (`processed_stripe_events`) | 7 years from event receipt (reconciliation). |

Add a short paragraph at the bottom: legal and financial retention obligations override deletion requests for affected records — we'll confirm which records fall under this when you exercise your rights.

### 9. Your rights (PDPA)

Keep the current three rights (access, correct, withdraw consent). Clarify:

- Requests go to the DPO mailbox (Section 13).
- Response within **30 days** of a valid request, per PDPA.
- We may verify your identity before acting on access or deletion requests to protect you against impersonation.

### 10. Security

Keep current paragraph. Add one sentence: *"Our database uses Supabase row-level security policies to enforce per-user access, and data is encrypted at rest by our infrastructure providers."*

### 11. Children

Unchanged.

### 12. Changes to this policy

Unchanged.

### 13. Data Protection Officer & Contact *(renames current §11)*

- Name the DPO mailbox: `hello@getthatbread.sg`.
- All PDPA rights requests and privacy questions go here.
- 30-day response commitment.
- Keep the existing "If you have any questions" closing.

## Content — consent line at pledge checkout

Exact placement: in `components/backing/CheckoutForm.tsx`, between the existing "You're only charged if the campaign reaches its goal…" line (around line 203-207) and the closing `</form>` tag.

Exact copy:

> By confirming, you agree to our [Terms of Service](/terms), [Privacy Policy](/privacy), and [Refund & Dispute Policy](/refund-policy).

Styling: same `text-xs text-center text-[var(--color-ink-subtle)]` class as the existing trust line so the two small-print lines visually match. No icon. Three `Link` components (one per policy). Use Next.js `next/link` rather than anchor tags for consistency with the rest of the file.

## Content — Sentry config change

**Before** (`instrumentation-client.ts:23-36`, approximate):

```ts
Sentry.init({
  // ...
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // ...
});
```

**After:**

```ts
Sentry.init({
  // ...
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  // ...
});
```

Only `replaysSessionSampleRate` changes. The integrations array (`Sentry.replayIntegration()`) stays in place so error replay still functions.

## Verification / definition of done

- `/privacy` renders all 13 sections without layout regression. `Last updated: 24 April 2026`.
- Section 6 (Session replay) and Section 7 (Creator verification) are present with the content above.
- No "marketing", "product updates", or "announcements" language anywhere on `/privacy`.
- GA4 and Sentry appear in Section 4 (Data sharing).
- Pledge checkout page (`/backing/[projectId]/checkout`) shows the three-link consent line below the Confirm pledge button.
- `grep -n "replaysSessionSampleRate" instrumentation-client.ts` returns exactly `replaysSessionSampleRate: 0,`.
- `npm run lint` introduces no new errors on the changed files.
- `npx tsc --noEmit` clean.
- Manual browser smoke: scroll through `/privacy` top to bottom — all three policy links in checkout resolve to live pages.
- Dark mode spot-check on `/privacy` — no regressions.

## Out of scope (explicitly deferred)

- Account-deletion API + dashboard UI.
- Cookie banner / cookie consent manager.
- Marketing email consent infrastructure (checkbox, preference center, `marketing_consent` column).
- Pre-flight Singpass KYC disclosure inside the creator dashboard Singpass card.
- Automated retention-enforcement cron jobs.
- Separate DPO person or named DPO.
- Breach notification runbook + PDPC notification templates.
- Self-service data export portal.
- Review of `/terms` alignment with the new privacy language (terms already reference privacy policy).
