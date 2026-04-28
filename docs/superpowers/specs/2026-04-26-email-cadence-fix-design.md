# Email Cadence Fix — Design Spec

**Date:** 2026-04-26
**Status:** Approved (brainstorming)
**Owner:** daryl

## Summary

A read-only audit of the transactional email surface found four missing event triggers and three template bugs. This spec covers the launch-blocking subset that ships in one PR before the May 2026 launch:

- Wire campaign-failed → creator + card-pledge backers
- Wire milestone-approved → creator + backers (migrating an existing plain-text template to HTML)
- Wire milestone-rejected / needs_info → creator
- Wire `releaseMilestonePayment()` from `lib/milestones/escrow.ts` into the milestone-approve endpoint (the function exists with tests but has no production caller — without it, no `escrow_releases` row is ever inserted on approval, so the new email's "S$X released" claim would have no audit trail)
- Fix two correctness bugs in the existing campaign-funded email (broken slug, wrong backer count)
- Add `Reply-To: hello@getthatbread.sg` header on every transactional send (centralized in the helper)

The motivating context: the platform sells "milestone-based escrow protection" and just shipped backer-facing milestone visibility (#87). Without milestone-approved emails, that trust narrative is half-built — backers see milestone status only when they open the dashboard, not when something actually happens. Similarly, today a campaign that fails to fund silently transitions to `status='failed'` with no email to anyone. Both gaps undermine launch readiness.

## Goals

- Wire every milestone admin decision (approved / rejected / needs_info) to its right recipients with email confirmations.
- Wire campaign-failure to creator notification + a closure email to card-pledge backers ("no charge, no action needed").
- Fix two correctness bugs in the existing campaign-funded email (broken dashboard link, wrong backer count).
- Add `Reply-To: hello@getthatbread.sg` so support replies don't bounce on every outbound.

## Non-goals

- **Milestone late / submitted emails** — separate scope. Late needs new cron + threshold logic; submitted is low-value (admin sees it via review queue).
- **Dispute emails (filing / resolution)** — dispute filing UI doesn't exist yet, so templates would have no caller. Defer until filing flow is built.
- **PayNow backer notification on failed campaigns** — the failed-campaign cron currently doesn't process `paynow_captured` pledges (no refund flow exists for them). Sending a "no charge needed" email to PayNow backers would be a lie. Defer until PayNow refund flow ships.
- **Resend webhook receiver** for bounces / spam complaints — observability follow-up, post-launch.
- **`getPostPledgeEducationEmail`** template at `lib/email/milestone-notifications.ts` — has no caller, overlaps with `sendPledgeConfirmedEmail` in purpose. Delete as part of the cleanup.

---

## Architecture

Six fixes, one PR, no schema changes. All email sends already route through the centralized `sendEmail()` helper in `lib/email/templates.ts`. The plan adds new templates next to existing ones and wires three call sites.

```
                  ┌────────────────────────────┐
                  │  sendEmail() helper        │  ← add Reply-To here
                  │  in lib/email/templates.ts │     (one place, all sends)
                  └─────────────┬──────────────┘
                                │
            ┌───────────────────┼─────────────────────┐
            ▼                   ▼                     ▼
    Campaign-failed      Milestone admin       Stripe transfer.created
    cron (existing)      API (existing)        webhook (existing)
                                                       │
            │                   │                       └─ fix: pass real
            │                   │                          slug + backerCount
    ┌───────┴────────┐   ┌──────┴────────┐
    │ creator email  │   │ approved →    │   rejected/needs_info →
    │ (wire existing │   │ creator (new) │   creator (new template)
    │  template)     │   │ + backers     │
    │                │   │   (migrate    │
    │ + card-pledge  │   │    from       │
    │   backer email │   │    milestone- │
    │   (new)        │   │   notifs.ts)  │
    └────────────────┘   └───────────────┘
```

No new dependencies, no migrations, no new routes.

---

## Components

### Helper-level change

**`lib/email/templates.ts` — `sendEmail()`**: add `replyTo: REPLY_TO` to the Resend send call. `REPLY_TO` is a const at the top of the file, environment-overridable via `RESEND_REPLY_TO_EMAIL`, defaulting to `hello@getthatbread.sg`. Centralized — all 17+ existing sends inherit it.

### New + migrated templates (`lib/email/templates.ts`)

#### `sendCampaignFailedToBackerEmail`

```ts
interface CampaignFailedBackerArgs {
  backerEmail: string;
  backerName: string;
  projectTitle: string;
  deadline: string; // ISO
}
```

- HTML body, mirrors the existing `sendPledgeRefundedEmail` shape
- Copy: warm one-paragraph acknowledgment + `<a>` to `/explore`. "The campaign you backed didn't reach its goal by [deadline]. Your card was never charged — no action needed. Find more campaigns to back at /explore."
- Subject: `"`{projectTitle}` didn't reach its goal"`

#### `sendMilestoneApprovedToBackerEmail`

```ts
interface MilestoneApprovedBackerArgs {
  backerEmail: string;
  backerName: string;
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
  milestoneNumber: 1 | 2 | 3;
  escrowReleasedSgd: number;
}
```

- Migrates the narrative from `getMilestoneApprovedEmail` (currently in `lib/email/milestone-notifications.ts`, plain-text body) → HTML format consistent with the rest of `templates.ts`
- Copy keeps the warm tone: "Great news — {creatorName} just hit milestone {N} on {projectTitle}. We've verified the proof and released S${amount} from escrow. Your money is safe in escrow until all milestones are complete."
- Includes `<a>` to `/projects/{projectSlug}`
- Subject: depends on milestone number — `"Milestone {N} hit · {projectTitle}"`

#### `sendMilestoneApprovedToCreatorEmail`

```ts
interface MilestoneApprovedCreatorArgs {
  creatorEmail: string;
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
  milestoneNumber: 1 | 2 | 3;
  escrowReleasedSgd: number;
}
```

- Short confirmation, mirrors the project-approved pattern
- Copy: "Milestone {N} on {projectTitle} approved. S${amount} released to your account."
- Subject: `"Milestone {N} approved — {projectTitle}"`

#### `sendMilestoneNeedsActionEmail`

```ts
interface MilestoneNeedsActionArgs {
  creatorEmail: string;
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
  milestoneNumber: 1 | 2 | 3;
  decision: "rejected" | "needs_info";
  feedbackText?: string;
}
```

- Single template branching on `decision`:
  - `rejected`: "The proof you submitted for milestone {N} on {projectTitle} needs revision. Please review the feedback and resubmit."
  - `needs_info`: "We have some questions about your milestone {N} submission for {projectTitle} before we can approve."
- When `feedbackText` is present, render it (escaped via existing `escapeHtml()` helper, matching `sendCreatorRequestInfoEmail` and `sendCreatorNewMessageEmail`)
- Subject: `"Action needed — milestone {N} ({projectTitle})"`
- Includes `<a>` to `/dashboard/projects/{projectSlug}` (creator's view of their own project)

### Existing template fixes

#### `sendCampaignFundedEmail` (in `lib/email/templates.ts`)

Two args were hardcoded incorrectly at the call site:
- `projectSlug = ""` → causes broken `<a href="/projects/">View campaign</a>` link
- `backerCount = 0` → email shows "0 backers" on a campaign that just funded

Fix at the **call site** (Stripe webhook), not the template signature. The template already accepts both args correctly. The webhook already loads the full project record before the email fires; pass `project.slug` and `project.backer_count` instead of the empty defaults.

### Deletions

- `lib/email/milestone-notifications.ts` — entire file removed. `getMilestoneApprovedEmail` content migrated to the new HTML template above. `getPostPledgeEducationEmail` deleted (no caller, overlaps with `sendPledgeConfirmedEmail`). `sendMilestoneEmail` `console.log` stub deleted.
- `tests/lib/email/milestone-notifications.test.ts` — entire file removed; replaced by tests against the new HTML templates in `tests/lib/email/templates.test.ts`.

---

## Data flow

### Failed-campaign cron — `app/api/cron/close-campaigns/route.ts`

Currently the failed branch (after `status='failed'` update + `paymentIntents.cancel()` loop) ends without notification. Add two send blocks at the end of the failed branch, before the `failedProjects.push(project.id)`:

```ts
// 1. Email creator
const { data: projectFull } = await serviceClient
  .from("projects")
  .select(`
    id, title, deadline, amount_pledged_sgd, funding_goal_sgd,
    creator:profiles!creator_id(id, display_name, email)
  `)
  .eq("id", project.id)
  .single();

if (projectFull?.creator?.email) {
  sendCampaignFailedEmail({
    creatorEmail: projectFull.creator.email,
    creatorName: projectFull.creator.display_name,
    projectTitle: projectFull.title,
    amountRaised: projectFull.amount_pledged_sgd,
    goal: projectFull.funding_goal_sgd,
  }).catch(console.error);
}

// 2. Email card-pledge backers ("no charge, no action needed")
const { data: cardBackers } = await serviceClient
  .from("pledges")
  .select("backer:profiles!backer_id(display_name, email)")
  .eq("project_id", project.id)
  .eq("payment_method", "card")
  .in("status", ["authorized", "released"]); // both pre- and post-cancel

for (const pledge of cardBackers ?? []) {
  if (!pledge.backer?.email || !projectFull) continue;
  sendCampaignFailedToBackerEmail({
    backerEmail: pledge.backer.email,
    backerName: pledge.backer.display_name,
    projectTitle: projectFull.title,
    deadline: projectFull.deadline,
  }).catch(console.error);
}
```

Sequential `for` loop with fire-and-forget `.catch(console.error)` matches the existing pattern. Resend rate limits aren't a concern at expected campaign sizes (<100 backers per campaign at launch). PayNow backers (`payment_method='paynow'`, status `paynow_captured`) are explicitly excluded — not handled by the cron's payment cancellation either, so emailing them about "no charge" would be incorrect.

### Admin milestone-approve API — `app/api/campaigns/[campaignId]/milestone-approve/route.ts`

(Path verified by reading the codebase. `app/api/admin/milestones/route.ts` is a GET-only list endpoint — not the decision endpoint.)

The existing handler creates a `milestone_approvals` row and updates `milestone_submissions.status`. It does NOT call `releaseMilestonePayment()` from `lib/milestones/escrow.ts`, so no `escrow_releases` row is created on approval today.

This PR adds two pieces of work to the `decision === "approved"` branch of this handler, in order:

1. **Insert the `escrow_releases` row** by calling `releaseMilestonePayment({ campaign_id, milestone_number, campaign_total_sgd })`. The function uses the 40/40/20 split from `lib/milestones/escrow.ts` (already tested). The `campaign_total_sgd` is `projects.amount_pledged_sgd` (what was actually raised), not `funding_goal_sgd`.

2. **Fire the milestone emails** (creator + backers) using the dollar amount returned by step 1.

Then in the `decision === "rejected" || decision === "needs_info"` branch, fire the needs-action email to the creator.

After the admin's decision is persisted (existing code), branch on `decision`:

```ts
const { data: project } = await serviceClient
  .from("projects")
  .select(`
    id, title, slug,
    creator:profiles!creator_id(display_name, email)
  `)
  .eq("id", campaignId)
  .single();

if (decision === "approved") {
  // Step 1: insert escrow_releases row via releaseMilestonePayment
  const releaseResult = await releaseMilestonePayment({
    campaign_id: campaignId,
    milestone_number: submission.milestone_number,
    campaign_total_sgd: project.amount_pledged_sgd,
  });
  if (!releaseResult.success) {
    // Log but proceed with email — the approval already succeeded;
    // missing escrow audit trail is operationally recoverable, missing
    // emails are not.
    console.error("Escrow release insert failed:", releaseResult.error);
  }
  const escrowReleasedSgd = releaseResult.amount_released ?? 0;

  // Step 2: creator email — short confirmation
  sendMilestoneApprovedToCreatorEmail({
    creatorEmail: project.creator.email,
    creatorName: project.creator.display_name,
    projectTitle: project.title,
    projectSlug: project.slug,
    milestoneNumber: submission.milestone_number,
    escrowReleasedSgd,
  }).catch(console.error);

  // Backer emails — only those whose money is in escrow
  const { data: backers } = await serviceClient
    .from("pledges")
    .select("backer:profiles!backer_id(display_name, email)")
    .eq("project_id", campaignId)
    .in("status", ["captured", "paynow_captured"]);

  for (const pledge of backers ?? []) {
    if (!pledge.backer?.email) continue;
    sendMilestoneApprovedToBackerEmail({
      backerEmail: pledge.backer.email,
      backerName: pledge.backer.display_name,
      creatorName: project.creator.display_name,
      projectTitle: project.title,
      projectSlug: project.slug,
      milestoneNumber,
      escrowReleasedSgd,
    }).catch(console.error);
  }
} else if (decision === "rejected" || decision === "needs_info") {
  sendMilestoneNeedsActionEmail({
    creatorEmail: project.creator.email,
    creatorName: project.creator.display_name,
    projectTitle: project.title,
    projectSlug: project.slug,
    milestoneNumber,
    decision,
    feedbackText, // from the admin's request body
  }).catch(console.error);
}
```

The status filter `IN ('captured', 'paynow_captured')` is intentional — both card-charged and PayNow-captured backers receive the milestone trust signal (their money is in escrow). `released` (failed campaign), `refunded`, `authorized` (campaign still funding) are all excluded.

### Stripe `transfer.created` webhook — `app/api/webhooks/stripe/route.ts`

Currently passes `projectSlug=""` and `backerCount=0` to `sendCampaignFundedEmail`. The webhook already loads the project before the email call. Change the call site:

```ts
// Before:
sendCampaignFundedEmail({
  // ...
  projectSlug: "",
  backerCount: 0,
});

// After:
sendCampaignFundedEmail({
  // ...
  projectSlug: project.slug,
  backerCount: project.backer_count,
});
```

If `project` isn't already in scope at the call site (verify during implementation), add a single Supabase select for `slug, backer_count` before the email call.

### Reply-To — one place

In `sendEmail()`:

```ts
const REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL ?? "hello@getthatbread.sg";

return resend.emails.send({
  from: FROM,
  replyTo: REPLY_TO,
  to,
  subject,
  html,
});
```

All existing sends inherit it without any further changes.

### Network footprint

- Failed cron: +1 creator email, +N card-pledge-backer emails per failed project (N typically 5-50 at launch scale)
- Milestone-approved: +1 creator email, +N backer emails (N typically 5-50)
- Milestone-rejected/needs_info: +1 creator email
- Funded webhook: same as today, just with correct slug + count

All sends fire-and-forget; failures log to console (Sentry breadcrumb already in place from prior work).

---

## Edge cases

1. **Backer email missing or null.** Both pledges→profiles queries explicitly check `if (!pledge.backer?.email) continue;` — skip silently rather than crash. Logged via the centralized fail handler if Resend would have errored on a missing recipient.

2. **Cron retries / duplicate sends.** Vercel cron is at-least-once delivery. The cron only processes projects with `status='active'` past their deadline; once flipped to `'failed'`, the next cron run filters it out. Idempotent at the project level. Edge case: cron crashes mid-loop after marking failed but before all emails fire — those backers get nothing on the next run. v1 accepts this trade-off; a follow-up could add a `failed_emails_sent_at` column for resumability.

3. **Milestone admin double-click.** If admin double-clicks approve, two `milestone_approvals` rows could be inserted (no UNIQUE constraint on `submission_id`). v1 accepts the duplicate-email risk — same risk as any other admin-driven send today. Follow-up: check for existing approval row before sending.

4. **Race with PayNow refund flow.** No PayNow refund flow exists. The failed-cron filter `payment_method='card'` ensures PayNow backers are not contacted — when PayNow refund flow eventually ships, it can fire its own email without colliding (audiences are disjoint).

5. **Backer-of-failed-campaign with `status='released'`** (auth was successfully cancelled). Included in the email loop via `status IN ('authorized', 'released')` — they pledged in good faith and deserve closure.

6. **Reply-To rejected by Resend.** `getthatbread.sg` is a verified domain in Resend per existing `from` config. Reply-To with same domain is supported.

7. **Email send to invalid address.** Resend returns 422 — `.catch(console.error)` swallows it; Sentry breadcrumb captures it. No retry; hard-bounce handling is out of scope (post-launch Resend webhook receiver).

8. **Markdown→HTML migration of existing `getMilestoneApprovedEmail` content.** Mechanical translation: `**X**` → `<strong>X</strong>`, numbered list → `<ol>`. Tone preserved.

9. **PayNow backers in milestone-approved emails.** Filter `status IN ('captured', 'paynow_captured')` includes them — their money is in escrow, so the trust signal applies the same way.

10. **`sendCampaignFundedEmail` call site `project` scope.** If the variable isn't already loaded at the call site, add a one-line `.select('slug, backer_count')` query. No extra round-trip in the common case where `project` is already loaded.

---

## Testing

### Automated (Vitest + Testing Library)

**`tests/lib/email/templates.test.ts`** — extend the existing pattern. Add render tests for the four new/migrated templates:

- `sendCampaignFailedToBackerEmail` → HTML contains project title, "no charge" copy, link to `/explore`. `escapeHtml` correctly escapes special chars in `projectTitle`. Reply-To header set.
- `sendMilestoneApprovedToBackerEmail` → contains backer name, creator name, milestone number, escrow amount as `S$X,XXX`, link to project page.
- `sendMilestoneApprovedToCreatorEmail` → short confirmation, milestone number, escrow amount.
- `sendMilestoneNeedsActionEmail` → branches:
  - `decision: "rejected"` → "needs revision" copy
  - `decision: "needs_info"` → "questions about your milestone" copy
  - With `feedbackText` → escaped + rendered
  - Without `feedbackText` → renders without crashing
- Existing `sendCampaignFundedEmail` test extended → asserts `projectSlug` and `backerCount` honored in the rendered HTML.
- One test asserts every send goes through the centralized `sendEmail()` and includes `replyTo: "hello@getthatbread.sg"`.

**`tests/api/cron/close-campaigns.test.ts`** — new file. Mock the email module + Supabase service client, run the handler, assert:
- For a failed project, `sendCampaignFailedEmail` called once with the right creator args.
- For a failed project with N card-pledge backers + M PayNow backers, `sendCampaignFailedToBackerEmail` called N times (not N+M).
- For a funded project, neither failed-email function is called.
- For a project with no card-pledge backers, only the creator email fires.

**`tests/api/campaigns/milestone-approve.test.ts`** — new file (existing `tests/api/admin/milestones.test.ts` only covers the GET list endpoint, not the decision endpoint). Mock the email module + Supabase service client + `releaseMilestonePayment`. Cases:
- Admin approves milestone → `releaseMilestonePayment` called once with `(campaignId, milestone_number, project.amount_pledged_sgd)`; `sendMilestoneApprovedToCreatorEmail` called once with the returned `amount_released`; `sendMilestoneApprovedToBackerEmail` called once per `captured`/`paynow_captured` backer; not called for `authorized`/`released`/`refunded` pledges.
- Admin approves milestone but `releaseMilestonePayment` fails → emails still fire (with `escrowReleasedSgd` defaulting to 0 from the failed result), error is logged.
- Admin rejects → `sendMilestoneNeedsActionEmail` called once with `decision: "rejected"`; no backer emails; `releaseMilestonePayment` NOT called.
- Admin needs_info → `sendMilestoneNeedsActionEmail` called once with `decision: "needs_info"`; no backer emails; `releaseMilestonePayment` NOT called.
- `feedbackText` propagates from admin payload into the template arg.

**`tests/api/webhooks/stripe-funded.test.ts`** — extend or create. One case: `transfer.created` webhook with a valid project → `sendCampaignFundedEmail` called with the loaded `project.slug` and `project.backer_count` (not `""` and `0`).

### Manual smoke test (gating release)

Cannot drive Resend without sending real email or wiring a sandbox key. v1 approach:

1. **Trigger each new path locally** with a real Resend dev key:
   - **Failed campaign:** back-date a test project's deadline, call cron handler with the cron secret. Confirm creator email + N card-backer emails fire.
   - **Milestone approved:** use the admin UI on a test campaign to approve a milestone; confirm 1 creator email + N backer emails.
   - **Milestone rejected:** same admin UI, click reject with a feedback message; confirm 1 creator email with the feedback text rendered (escaped).
   - **Milestone needs_info:** same as rejected, different decision.
   - **Funded campaign:** trigger via Stripe CLI (`stripe trigger transfer.created`) against the dev webhook; confirm slug + backer_count render correctly in the email.
2. **In Resend dashboard**: verify Reply-To is `hello@getthatbread.sg`, links use the right domain, no `{{undefined}}` placeholders, no `$$` rendering bugs.
3. **Hit reply** on each test email — should route to `hello@getthatbread.sg`.

### Out of scope

- Resend webhook receiver for bounces / complaints (post-launch follow-up)
- E2E rendering across email clients (Gmail vs Outlook vs Apple Mail) — Resend has render previews
- PayNow refund flow + its email
- Dispute emails (filing UI doesn't exist yet)
- Milestone late / submitted emails

---

## File summary

**New files:**
- `tests/api/cron/close-campaigns.test.ts` — cron failed-branch send assertions
- `tests/api/webhooks/stripe-funded.test.ts` — funded webhook `sendCampaignFundedEmail` arg-fix assertions. The implementer first checks if `tests/api/webhooks/stripe.test.ts` (or similar) already exists; if it does, extend that file instead of creating a new one.

**Modified files:**
- `lib/email/templates.ts` — add four new template functions, add `REPLY_TO` const, add `replyTo` to `sendEmail()` helper
- `app/api/cron/close-campaigns/route.ts` — add creator email + card-pledge-backer loop in the failed branch
- `app/api/campaigns/[campaignId]/milestone-approve/route.ts` — wire `releaseMilestonePayment()` in the `approved` branch + add three milestone email sends across both branches
- `app/api/webhooks/stripe/route.ts` — fix `projectSlug` and `backerCount` args at the `sendCampaignFundedEmail` call site
- `tests/lib/email/templates.test.ts` (or `lib/email/__tests__/templates.test.ts` — match existing convention) — add tests for new templates + Reply-To assertion + extended funded-email test
- `tests/api/campaigns/milestone-approve.test.ts` — new file covering the `app/api/campaigns/[campaignId]/milestone-approve/route.ts` endpoint. (Existing `tests/api/admin/milestones.test.ts` only covers the GET list endpoint and stays untouched.)

**Deleted files:**
- `lib/email/milestone-notifications.ts` — content migrated; remaining stubs are dead code
- `tests/lib/email/milestone-notifications.test.ts` — replaced by template tests

**Unmodified:**
- All other email templates, send call sites, schema. No migrations.

---

## Open questions

None. All design decisions finalized in brainstorming.
