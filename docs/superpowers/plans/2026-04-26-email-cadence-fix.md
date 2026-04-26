# Email Cadence Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire missing transactional email triggers (campaign-failed, milestone-approved, milestone-needs-action), fix two `sendCampaignFundedEmail` argument bugs, add a centralized `Reply-To: hello@getthatbread.sg` header, and finally call `releaseMilestonePayment()` from the milestone-approve endpoint so the escrow audit trail is real.

**Architecture:** All sends keep flowing through `sendEmail()` in `lib/email/templates.ts`. Reply-To is added once in the helper. New templates live next to existing ones in `templates.ts`. Three call-site changes: cron failed-branch, milestone-approve route, Stripe webhook. Cleanup deletes `lib/email/milestone-notifications.ts` (content migrated to a real HTML template).

**Tech Stack:** Next.js App Router, Resend (existing), Supabase service client, Vitest + Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-26-email-cadence-fix-design.md`

---

## File Structure

**New files:**
- `tests/api/cron/close-campaigns.test.ts` — cron failed-branch send assertions
- `tests/api/campaigns/milestone-approve.test.ts` — milestone-approve endpoint covering escrow release + email sends (existing `tests/api/admin/milestones.test.ts` only covers GET list — leave it alone)

**Modified files:**
- `lib/email/resend.ts` — export new `REPLY_TO` constant
- `lib/email/templates.ts` — thread `replyTo` through `sendEmail()`; add 4 new template functions
- `app/api/webhooks/stripe/route.ts` — fix `sendCampaignFundedEmail` call-site args (slug + backerCount)
- `app/api/cron/close-campaigns/route.ts` — wire creator + card-pledge-backer emails in the failed branch
- `app/api/campaigns/[campaignId]/milestone-approve/route.ts` — call `releaseMilestonePayment()` on approve, fire 3 milestone emails per branch
- `lib/email/__tests__/auth-emails.test.ts` — extend or add new template-render tests (or use a sibling file — see Task 1 step note about convention)

**Deleted files:**
- `lib/email/milestone-notifications.ts` — content migrated to real HTML template
- `tests/lib/email/milestone-notifications.test.ts` — replaced by template render tests

---

## Task 1: Reply-To header in `sendEmail()` helper

**Files:**
- Modify: `lib/email/resend.ts`
- Modify: `lib/email/templates.ts:40-42` (the `sendEmail()` helper)

- [ ] **Step 1: Add `REPLY_TO` const to `lib/email/resend.ts`**

The existing file has `FROM` and `ADMIN_EMAIL` consts read from env vars. Add `REPLY_TO` in the same pattern:

```ts
import { Resend } from "resend";

export const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@getthatbread.sg";
export const REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL ?? "hello@getthatbread.sg";
export const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "hello@getthatbread.sg";

let resendClient: Resend | null = null;

export function getResend() {
	const apiKey = process.env.RESEND_API_KEY;

	if (!apiKey) {
		throw new Error("Missing RESEND_API_KEY.");
	}

	if (!resendClient) {
		resendClient = new Resend(apiKey);
	}

	return resendClient;
}
```

- [ ] **Step 2: Wire `REPLY_TO` into the `sendEmail()` helper**

Open `lib/email/templates.ts`. The current helper:

```ts
function sendEmail(payload: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0]) {
  return getResend().emails.send(payload);
}
```

Update the import and helper to inject `replyTo`. Resend's API uses `replyTo` (camelCase). Replace lines 1 and 40-42:

```ts
import { getResend, FROM, REPLY_TO, ADMIN_EMAIL } from "./resend";
```

```ts
function sendEmail(payload: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0]) {
  return getResend().emails.send({ replyTo: REPLY_TO, ...payload });
}
```

The spread-with-default pattern means callers can override `replyTo` if needed; default is the centralized address.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add lib/email/resend.ts lib/email/templates.ts
git commit -m "feat(email): centralized Reply-To header for transactional sends"
```

---

## Task 2: Fix `sendCampaignFundedEmail` call-site args (slug + backerCount)

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts:233-256` (the `transfer.created` case)
- Verification: existing `lib/email/__tests__/templates.test.ts` already covers the template-level rendering. The webhook handler is signature-verification-heavy and not worth a full integration test for a 2-line arg fix; the manual smoke test in Task 10 (Stripe CLI trigger) is the real verification.

- [ ] **Step 1: Update the `select` clause to include `slug` and `backer_count`**

Find this block (around line 233-237):

```ts
const { data: project } = await supabase
  .from("projects")
  .select("creator_id, title, amount_pledged_sgd, funding_goal_sgd")
  .eq("id", projectId)
  .single();
```

Change `.select(...)` to add `slug, backer_count`:

```ts
const { data: project } = await supabase
  .from("projects")
  .select("creator_id, title, slug, backer_count, amount_pledged_sgd, funding_goal_sgd")
  .eq("id", projectId)
  .single();
```

- [ ] **Step 2: Pass real values into the email call**

Find the `sendCampaignFundedEmail({...})` call (around line 246-253). Replace the hardcoded fallbacks:

```ts
await sendCampaignFundedEmail({
  creatorEmail: user.email,
  creatorName: (creatorProfile as any).display_name,
  projectTitle: (project as any).title,
  projectSlug: (project as any).slug,
  amountRaised: (project as any).amount_pledged_sgd,
  backerCount: (project as any).backer_count,
}).catch(console.error);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "fix(email): use real project slug + backer count in campaign-funded email"
```

---

## Task 3: New template — `sendCampaignFailedToBackerEmail`

**Files:**
- Modify: `lib/email/templates.ts` — add new interface + function near existing `sendCampaignFailedEmail`
- Modify: `lib/email/__tests__/auth-emails.test.ts` (will rename to `templates.test.ts` mid-task — see step 1)

- [ ] **Step 1: Decide the test file location**

Run:
```bash
ls /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00/lib/email/__tests__/
```

The existing file is `auth-emails.test.ts`. Create a sibling file `templates.test.ts` for this and the next 3 tasks (auth-emails tests its own module; transactional templates get their own file).

- [ ] **Step 2: Write the failing test**

Create `lib/email/__tests__/templates.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg_test' }, error: null });

vi.mock('@/lib/email/resend', () => ({
  FROM: 'noreply@getthatbread.sg',
  REPLY_TO: 'hello@getthatbread.sg',
  ADMIN_EMAIL: 'hello@getthatbread.sg',
  getResend: () => ({ emails: { send: mockSend } }),
}));

import { sendCampaignFailedToBackerEmail } from '@/lib/email/templates';

describe('sendCampaignFailedToBackerEmail', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  it('sends an email with project title and "no charge" copy', async () => {
    await sendCampaignFailedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      projectTitle: 'Sourdough Starter Kit',
      deadline: '2026-05-01T00:00:00Z',
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe('backer@example.com');
    expect(payload.subject).toContain('Sourdough Starter Kit');
    expect(payload.html).toContain('Sam');
    expect(payload.html).toContain('Sourdough Starter Kit');
    expect(payload.html).toMatch(/no.*charge|never.*charged|card.*not.*charged/i);
    expect(payload.html).toContain('/explore');
  });

  it('includes Reply-To via the centralized helper', async () => {
    await sendCampaignFailedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      projectTitle: 'Test',
      deadline: '2026-05-01T00:00:00Z',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.replyTo).toBe('hello@getthatbread.sg');
  });

  it('escapes HTML in projectTitle', async () => {
    await sendCampaignFailedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      projectTitle: '<script>alert(1)</script>',
      deadline: '2026-05-01T00:00:00Z',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).not.toContain('<script>');
    expect(payload.html).toMatch(/&lt;script&gt;/);
  });
});
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
npx vitest run lib/email/__tests__/templates.test.ts
```
Expected: FAIL — `sendCampaignFailedToBackerEmail is not exported`.

- [ ] **Step 4: Implement the template**

Open `lib/email/templates.ts`. The file exports an `escapeHtml` helper used by other templates with user-input fields (search for `escapeHtml` in the file). If it's not exported but used internally, you may need to expose it or duplicate the small implementation. Inspect first:

```bash
grep -nE "(escapeHtml|function esc)" /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00/lib/email/templates.ts
```

If `escapeHtml` exists, use it. If not, add a small helper at the top of the file:

```ts
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

Then add the new interface and function. Place them right after the existing `sendCampaignFailedEmail` function (around line 81):

```ts
interface CampaignFailedBackerArgs {
  backerEmail: string;
  backerName: string;
  projectTitle: string;
  deadline: string;
}

export async function sendCampaignFailedToBackerEmail(args: CampaignFailedBackerArgs) {
  const safeTitle = escapeHtml(args.projectTitle);
  const safeName = escapeHtml(args.backerName);
  const deadlineDisplay = new Date(args.deadline).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return sendEmail({
    from: FROM,
    to: args.backerEmail,
    subject: `${args.projectTitle} didn't reach its goal`,
    html: `
      <h2>Hi ${safeName},</h2>
      <p>The campaign you backed, <strong>${safeTitle}</strong>, ended on ${deadlineDisplay} without reaching its funding goal.</p>
      <p><strong>Your card was never charged — no action needed.</strong></p>
      <p>Thanks for backing local creators. Keep an eye out for more campaigns to support.</p>
      <a href="${appUrl}/explore" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Find more campaigns
      </a>
    `,
  });
}
```

Note: subject deliberately doesn't escape `args.projectTitle` because email subjects don't render HTML — escaping would show `&amp;` instead of `&`. Subject lines are display-text. The `html` body uses the escaped version.

- [ ] **Step 5: Run the test to confirm it passes**

```bash
npx vitest run lib/email/__tests__/templates.test.ts
```
Expected: 3 passing tests.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 7: Commit**

```bash
git add lib/email/templates.ts lib/email/__tests__/templates.test.ts
git commit -m "feat(email): add sendCampaignFailedToBackerEmail template"
```

---

## Task 4: Migrate `getMilestoneApprovedEmail` → `sendMilestoneApprovedToBackerEmail` (HTML)

**Files:**
- Modify: `lib/email/templates.ts` — add new interface + function
- Modify: `lib/email/__tests__/templates.test.ts` — add tests

- [ ] **Step 1: Write the failing tests**

Append to `lib/email/__tests__/templates.test.ts` (after the previous `describe` block):

```ts
import { sendMilestoneApprovedToBackerEmail } from '@/lib/email/templates';

describe('sendMilestoneApprovedToBackerEmail', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  it('sends an email with all milestone context', async () => {
    await sendMilestoneApprovedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      creatorName: 'Jamie',
      projectTitle: 'Sourdough Starter Kit',
      projectSlug: 'sourdough-starter-kit',
      milestoneNumber: 1,
      escrowReleasedSgd: 4000,
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe('backer@example.com');
    expect(payload.subject).toContain('Milestone 1');
    expect(payload.subject).toContain('Sourdough Starter Kit');
    expect(payload.html).toContain('Sam');
    expect(payload.html).toContain('Jamie');
    expect(payload.html).toContain('milestone 1');
    expect(payload.html).toMatch(/\$4,?000/); // matches both Node ICU "$4,000" and browser "S$4,000"
    expect(payload.html).toContain('/projects/sourdough-starter-kit');
  });

  it('includes Reply-To via the centralized helper', async () => {
    await sendMilestoneApprovedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 2,
      escrowReleasedSgd: 4000,
    });
    expect(mockSend.mock.calls[0][0].replyTo).toBe('hello@getthatbread.sg');
  });

  it('escapes HTML in user-supplied fields', async () => {
    await sendMilestoneApprovedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: '<img src=x>',
      creatorName: 'Jamie',
      projectTitle: '<b>x</b>',
      projectSlug: 'test',
      milestoneNumber: 3,
      escrowReleasedSgd: 2000,
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).not.toContain('<img');
    expect(payload.html).not.toContain('<b>x</b>');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run lib/email/__tests__/templates.test.ts
```
Expected: FAIL — `sendMilestoneApprovedToBackerEmail is not exported`.

- [ ] **Step 3: Implement the template**

Append to `lib/email/templates.ts`:

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

const MILESTONE_LABELS: Record<1 | 2 | 3, string> = {
  1: "Tooling & Deposits — Factory has confirmed the order",
  2: "Production — Manufacturing is underway",
  3: "Fulfillment — Rewards are on the way",
};

export async function sendMilestoneApprovedToBackerEmail(args: MilestoneApprovedBackerArgs) {
  const safeTitle = escapeHtml(args.projectTitle);
  const safeName = escapeHtml(args.backerName);
  const safeCreator = escapeHtml(args.creatorName);
  const milestoneLabel = MILESTONE_LABELS[args.milestoneNumber];

  return sendEmail({
    from: FROM,
    to: args.backerEmail,
    subject: `Milestone ${args.milestoneNumber} hit · ${args.projectTitle}`,
    html: `
      <h2>Hi ${safeName},</h2>
      <p>Great news — <strong>${safeCreator}</strong> just hit milestone ${args.milestoneNumber} on <strong>${safeTitle}</strong>. We've verified the proof and released <strong>${formatSgd(args.escrowReleasedSgd)}</strong> from escrow.</p>
      <p><strong>Milestone ${args.milestoneNumber}: ${escapeHtml(milestoneLabel)}</strong></p>
      <p>Your money is still safe in escrow until all milestones are complete. You'll get an update when the next one is ready.</p>
      <a href="${appUrl}/projects/${encodeURIComponent(args.projectSlug)}" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        See campaign progress
      </a>
    `,
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run lib/email/__tests__/templates.test.ts
```
Expected: 6 passing tests (3 from Task 3 + 3 new).

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add lib/email/templates.ts lib/email/__tests__/templates.test.ts
git commit -m "feat(email): add sendMilestoneApprovedToBackerEmail (HTML, migrated from milestone-notifications.ts)"
```

---

## Task 5: New template — `sendMilestoneApprovedToCreatorEmail`

**Files:**
- Modify: `lib/email/templates.ts`
- Modify: `lib/email/__tests__/templates.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `lib/email/__tests__/templates.test.ts`:

```ts
import { sendMilestoneApprovedToCreatorEmail } from '@/lib/email/templates';

describe('sendMilestoneApprovedToCreatorEmail', () => {
  beforeEach(() => { mockSend.mockClear(); });

  it('sends short confirmation with milestone number + amount', async () => {
    await sendMilestoneApprovedToCreatorEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Sourdough Starter Kit',
      projectSlug: 'sourdough-starter-kit',
      milestoneNumber: 2,
      escrowReleasedSgd: 4000,
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe('creator@example.com');
    expect(payload.subject).toContain('Milestone 2');
    expect(payload.html).toContain('Jamie');
    expect(payload.html).toMatch(/\$4,?000/);
    expect(payload.html).toContain('/dashboard');
  });

  it('includes Reply-To', async () => {
    await sendMilestoneApprovedToCreatorEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 1,
      escrowReleasedSgd: 4000,
    });
    expect(mockSend.mock.calls[0][0].replyTo).toBe('hello@getthatbread.sg');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run lib/email/__tests__/templates.test.ts
```
Expected: FAIL — `sendMilestoneApprovedToCreatorEmail is not exported`.

- [ ] **Step 3: Implement the template**

Append to `lib/email/templates.ts`:

```ts
interface MilestoneApprovedCreatorArgs {
  creatorEmail: string;
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
  milestoneNumber: 1 | 2 | 3;
  escrowReleasedSgd: number;
}

export async function sendMilestoneApprovedToCreatorEmail(args: MilestoneApprovedCreatorArgs) {
  const safeTitle = escapeHtml(args.projectTitle);
  const safeName = escapeHtml(args.creatorName);

  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: `Milestone ${args.milestoneNumber} approved — ${args.projectTitle}`,
    html: `
      <h2>Hi ${safeName},</h2>
      <p>Milestone ${args.milestoneNumber} on <strong>${safeTitle}</strong> has been approved. <strong>${formatSgd(args.escrowReleasedSgd)}</strong> has been released from escrow to your account.</p>
      <p>Backers have been notified. Keep up the good work.</p>
      <a href="${appUrl}/dashboard" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Open dashboard
      </a>
    `,
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run lib/email/__tests__/templates.test.ts
```
Expected: 8 passing tests.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add lib/email/templates.ts lib/email/__tests__/templates.test.ts
git commit -m "feat(email): add sendMilestoneApprovedToCreatorEmail"
```

---

## Task 6: New template — `sendMilestoneNeedsActionEmail`

**Files:**
- Modify: `lib/email/templates.ts`
- Modify: `lib/email/__tests__/templates.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `lib/email/__tests__/templates.test.ts`:

```ts
import { sendMilestoneNeedsActionEmail } from '@/lib/email/templates';

describe('sendMilestoneNeedsActionEmail', () => {
  beforeEach(() => { mockSend.mockClear(); });

  it('sends rejection copy when decision is "rejected"', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Sourdough Starter Kit',
      projectSlug: 'sourdough-starter-kit',
      milestoneNumber: 1,
      decision: 'rejected',
      feedbackText: 'Photo is too blurry, please retake.',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toContain('Action needed');
    expect(payload.html).toMatch(/needs revision|please review/i);
    expect(payload.html).toContain('Photo is too blurry, please retake.');
  });

  it('sends needs_info copy when decision is "needs_info"', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 2,
      decision: 'needs_info',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).toMatch(/questions about|more info/i);
  });

  it('renders without feedbackText (undefined)', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 3,
      decision: 'rejected',
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).not.toContain('undefined');
  });

  it('escapes HTML in feedbackText', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 1,
      decision: 'rejected',
      feedbackText: '<script>alert(1)</script>',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).not.toContain('<script>');
  });

  it('includes Reply-To', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 1,
      decision: 'rejected',
    });
    expect(mockSend.mock.calls[0][0].replyTo).toBe('hello@getthatbread.sg');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run lib/email/__tests__/templates.test.ts
```
Expected: FAIL — `sendMilestoneNeedsActionEmail is not exported`.

- [ ] **Step 3: Implement the template**

Append to `lib/email/templates.ts`:

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

export async function sendMilestoneNeedsActionEmail(args: MilestoneNeedsActionArgs) {
  const safeTitle = escapeHtml(args.projectTitle);
  const safeName = escapeHtml(args.creatorName);
  const intro =
    args.decision === "rejected"
      ? `The proof you submitted for milestone ${args.milestoneNumber} on <strong>${safeTitle}</strong> needs revision. Please review the feedback below and resubmit.`
      : `We have some questions about your milestone ${args.milestoneNumber} submission for <strong>${safeTitle}</strong> before we can approve it.`;

  const feedbackBlock = args.feedbackText
    ? `
      <div style="background:#F3F4F6;padding:16px;border-radius:8px;margin-top:16px;">
        <p style="margin:0;font-size:14px;color:#374151;"><strong>Reviewer feedback:</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#1F2937;white-space:pre-wrap;">${escapeHtml(args.feedbackText)}</p>
      </div>
    `
    : "";

  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: `Action needed — milestone ${args.milestoneNumber} (${args.projectTitle})`,
    html: `
      <h2>Hi ${safeName},</h2>
      <p>${intro}</p>
      ${feedbackBlock}
      <a href="${appUrl}/dashboard/projects/${encodeURIComponent(args.projectSlug)}" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Open project
      </a>
    `,
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run lib/email/__tests__/templates.test.ts
```
Expected: 13 passing tests.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add lib/email/templates.ts lib/email/__tests__/templates.test.ts
git commit -m "feat(email): add sendMilestoneNeedsActionEmail (rejected + needs_info)"
```

---

## Task 7: Wire campaign-failed emails in cron

**Files:**
- Modify: `app/api/cron/close-campaigns/route.ts`
- Create: `tests/api/cron/close-campaigns.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/api/cron/close-campaigns.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSendCampaignFailedEmail = vi.fn().mockResolvedValue({});
const mockSendCampaignFailedToBackerEmail = vi.fn().mockResolvedValue({});

vi.mock('@/lib/email/templates', () => ({
  sendCampaignFailedEmail: mockSendCampaignFailedEmail,
  sendCampaignFailedToBackerEmail: mockSendCampaignFailedToBackerEmail,
}));

const mockStripeCancel = vi.fn().mockResolvedValue({});
vi.mock('@/lib/stripe/server', () => ({
  getStripe: () => ({ paymentIntents: { cancel: mockStripeCancel } }),
}));

const mockCaptureProjectPledges = vi.fn().mockResolvedValue({ captured: 0, failed: 0 });
vi.mock('@/app/api/payments/capture/route', () => ({
  captureProjectPledges: mockCaptureProjectPledges,
}));

// Build a chainable Supabase mock. Each query returns a thenable that
// resolves to canned data — Supabase's PostgrestFilterBuilder is PromiseLike,
// so any combination of .eq()/.in()/.is()/.lt() chained before await works.
function thenable(data: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const m of ['eq', 'in', 'is', 'lt', 'gt', 'not', 'order', 'limit', 'range']) {
    chain[m] = () => chain;
  }
  chain.single = async () => ({ data, error: null });
  chain.then = (resolve: (v: unknown) => void) => resolve({ data, error: null });
  return chain;
}

function buildSupabaseMock(scenario: 'failed' | 'funded' | 'no-card-backers') {
  const expiredProjects =
    scenario === 'funded'
      ? [{ id: 'proj-1', amount_pledged_sgd: 10000, funding_goal_sgd: 10000 }]
      : [{ id: 'proj-1', amount_pledged_sgd: 500, funding_goal_sgd: 10000 }];

  const projectFull = {
    id: 'proj-1',
    title: 'Failed Campaign',
    deadline: '2026-05-01T00:00:00Z',
    amount_pledged_sgd: 500,
    funding_goal_sgd: 10000,
    creator: { id: 'creator-1', display_name: 'Jamie', email: 'creator@example.com' },
  };

  const authorizedPledges = [
    { id: 'pledge-1', stripe_payment_intent_id: 'pi_1' },
    { id: 'pledge-2', stripe_payment_intent_id: 'pi_2' },
  ];
  const cardBackers =
    scenario === 'no-card-backers'
      ? []
      : [
          { backer: { display_name: 'Sam', email: 'sam@example.com' } },
          { backer: { display_name: 'Pat', email: 'pat@example.com' } },
        ];

  return {
    from: (table: string) => {
      if (table === 'projects') {
        return {
          select: (cols: string) => {
            const isFullRecordSelect = cols.includes('creator:profiles');
            // The expired-projects query terminates without .single(); the post-fail
            // re-fetch terminates with .single() returning the full record.
            const data = isFullRecordSelect ? projectFull : expiredProjects;
            return thenable(data);
          },
          update: () => thenable(null),
        };
      }
      if (table === 'pledges') {
        return {
          select: (cols: string) => {
            const isCardBackerSelect = cols.includes('backer:profiles');
            return thenable(isCardBackerSelect ? cardBackers : authorizedPledges);
          },
          update: () => thenable(null),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}));

import { GET } from '@/app/api/cron/close-campaigns/route';
import { createServiceClient } from '@/lib/supabase/server';

describe('close-campaigns cron', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    mockSendCampaignFailedEmail.mockClear();
    mockSendCampaignFailedToBackerEmail.mockClear();
    mockStripeCancel.mockClear();
  });

  it('emails creator + card-pledge backers when a project fails', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(buildSupabaseMock('failed'));

    const req = new Request('http://localhost/api/cron/close-campaigns', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockSendCampaignFailedEmail).toHaveBeenCalledTimes(1);
    expect(mockSendCampaignFailedEmail.mock.calls[0][0]).toMatchObject({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Failed Campaign',
    });

    expect(mockSendCampaignFailedToBackerEmail).toHaveBeenCalledTimes(2);
    const recipients = mockSendCampaignFailedToBackerEmail.mock.calls.map((c) => c[0].backerEmail);
    expect(recipients).toContain('sam@example.com');
    expect(recipients).toContain('pat@example.com');
  });

  it('does not email failed templates when project funds', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(buildSupabaseMock('funded'));

    const req = new Request('http://localhost/api/cron/close-campaigns', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    await GET(req);

    expect(mockSendCampaignFailedEmail).not.toHaveBeenCalled();
    expect(mockSendCampaignFailedToBackerEmail).not.toHaveBeenCalled();
  });

  it('emails creator only when no card-pledge backers exist', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(buildSupabaseMock('no-card-backers'));

    const req = new Request('http://localhost/api/cron/close-campaigns', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    await GET(req);

    expect(mockSendCampaignFailedEmail).toHaveBeenCalledTimes(1);
    expect(mockSendCampaignFailedToBackerEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run tests/api/cron/close-campaigns.test.ts
```
Expected: FAIL — `sendCampaignFailedToBackerEmail is not called` etc. (the cron doesn't email backers yet).

- [ ] **Step 3: Wire the emails into the cron**

Open `app/api/cron/close-campaigns/route.ts`. Find the failed branch — specifically, look at the bottom of the failed branch where `failedProjects.push(project.id);` happens (around line 122). Insert the email-firing block immediately before that push. Also update the imports at the top of the file:

```ts
import { sendCampaignFailedEmail, sendCampaignFailedToBackerEmail } from "@/lib/email/templates";
```

Then in the failed branch, after the existing `paymentIntents.cancel()` loop and before `failedProjects.push(project.id);`, add:

```ts
      // Notify creator + card-pledge backers
      const { data: projectFull } = await serviceClient
        .from("projects")
        .select(
          "id, title, deadline, amount_pledged_sgd, funding_goal_sgd, creator:profiles!creator_id(id, display_name, email)"
        )
        .eq("id", project.id)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pf = projectFull as any;
      if (pf?.creator?.email) {
        sendCampaignFailedEmail({
          creatorEmail: pf.creator.email,
          creatorName: pf.creator.display_name,
          projectTitle: pf.title,
          projectSlug: "",
          amountRaised: pf.amount_pledged_sgd,
          goal: pf.funding_goal_sgd,
        }).catch(console.error);
      }

      const { data: cardBackers } = await serviceClient
        .from("pledges")
        .select("backer:profiles!backer_id(display_name, email)")
        .eq("project_id", project.id)
        .eq("payment_method", "card")
        .in("status", ["authorized", "released"]);

      for (const pledge of cardBackers ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = (pledge as any).backer;
        if (!b?.email || !pf) continue;
        sendCampaignFailedToBackerEmail({
          backerEmail: b.email,
          backerName: b.display_name,
          projectTitle: pf.title,
          deadline: pf.deadline,
        }).catch(console.error);
      }
```

Note: `sendCampaignFailedEmail`'s existing interface still requires `projectSlug`. Pass `""` since the existing template uses `${appUrl}/projects/create` for the relaunch CTA, not a project-specific URL — `projectSlug` is unused in the template body. (Don't break the interface; leave the value empty.)

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
npx vitest run tests/api/cron/close-campaigns.test.ts
```
Expected: 3 passing tests.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add app/api/cron/close-campaigns/route.ts tests/api/cron/close-campaigns.test.ts
git commit -m "feat(email): wire campaign-failed emails to creator + card-pledge backers"
```

---

## Task 8: Wire `releaseMilestonePayment()` + 3 milestone emails in milestone-approve

**Files:**
- Modify: `app/api/campaigns/[campaignId]/milestone-approve/route.ts`
- Create: `tests/api/campaigns/milestone-approve.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/api/campaigns/milestone-approve.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReleaseMilestonePayment = vi.fn().mockResolvedValue({ success: true, amount_released: 4000 });
vi.mock('@/lib/milestones/escrow', () => ({
  releaseMilestonePayment: mockReleaseMilestonePayment,
}));

const mockSendMilestoneApprovedToCreatorEmail = vi.fn().mockResolvedValue({});
const mockSendMilestoneApprovedToBackerEmail = vi.fn().mockResolvedValue({});
const mockSendMilestoneNeedsActionEmail = vi.fn().mockResolvedValue({});

vi.mock('@/lib/email/templates', () => ({
  sendMilestoneApprovedToCreatorEmail: mockSendMilestoneApprovedToCreatorEmail,
  sendMilestoneApprovedToBackerEmail: mockSendMilestoneApprovedToBackerEmail,
  sendMilestoneNeedsActionEmail: mockSendMilestoneNeedsActionEmail,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { POST } from '@/app/api/campaigns/[campaignId]/milestone-approve/route';
import { createClient, createServiceClient } from '@/lib/supabase/server';

function thenable(data: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const m of ['eq', 'in', 'is', 'order', 'limit', 'range']) {
    chain[m] = () => chain;
  }
  chain.single = async () => ({ data, error: null });
  chain.then = (resolve: (v: unknown) => void) => resolve({ data, error: null });
  return chain;
}

function buildAuthClient(isAdmin = true) {
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1' } } }) },
    from: () => ({
      select: () => thenable({ is_admin: isAdmin }),
    }),
  };
}

interface ServiceMockArgs {
  decision: 'approved' | 'rejected' | 'needs_info';
  backers?: Array<{ status: string; display_name: string; email: string }>;
}

function buildServiceClient({ decision, backers = [] }: ServiceMockArgs) {
  const submission = { id: 'sub-1', campaign_id: 'campaign-1', milestone_number: 1, status: 'pending' };
  const project = {
    id: 'campaign-1',
    title: 'Sourdough',
    slug: 'sourdough',
    amount_pledged_sgd: 10000,
    creator: { display_name: 'Jamie', email: 'creator@example.com' },
  };

  // The route's pledges query: .eq('project_id', x).in('status', ['captured', 'paynow_captured'])
  // Filter our test backers list to match what the .in() filter would return.
  const visibleBackers = backers
    .filter((b) => ['captured', 'paynow_captured'].includes(b.status))
    .map((b) => ({ backer: { display_name: b.display_name, email: b.email } }));

  return {
    from: (table: string) => {
      if (table === 'milestone_submissions') {
        return {
          select: () => thenable(submission),
          update: () => thenable(null),
        };
      }
      if (table === 'milestone_approvals') {
        // Route does .insert(...).select().single() — chain through select to thenable
        return {
          insert: () => ({
            select: () => thenable({ id: 'app-1', submission_id: 'sub-1', decision }),
          }),
        };
      }
      if (table === 'projects') {
        return { select: () => thenable(project) };
      }
      if (table === 'pledges') {
        return { select: () => thenable(visibleBackers) };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe('milestone-approve route', () => {
  beforeEach(() => {
    mockReleaseMilestonePayment.mockClear();
    mockSendMilestoneApprovedToCreatorEmail.mockClear();
    mockSendMilestoneApprovedToBackerEmail.mockClear();
    mockSendMilestoneNeedsActionEmail.mockClear();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(buildAuthClient(true));
  });

  it('on approved, releases escrow + emails creator + emails captured backers', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      buildServiceClient({
        decision: 'approved',
        backers: [
          { status: 'captured', display_name: 'Sam', email: 'sam@example.com' },
          { status: 'paynow_captured', display_name: 'Pat', email: 'pat@example.com' },
          { status: 'authorized', display_name: 'Skip', email: 'skip@example.com' },
        ],
      })
    );

    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

    expect(res.status).toBe(200);
    expect(mockReleaseMilestonePayment).toHaveBeenCalledTimes(1);
    expect(mockReleaseMilestonePayment.mock.calls[0][0]).toEqual({
      campaign_id: 'campaign-1',
      milestone_number: 1,
      campaign_total_sgd: 10000,
    });
    expect(mockSendMilestoneApprovedToCreatorEmail).toHaveBeenCalledTimes(1);
    expect(mockSendMilestoneApprovedToCreatorEmail.mock.calls[0][0].escrowReleasedSgd).toBe(4000);
    expect(mockSendMilestoneApprovedToBackerEmail).toHaveBeenCalledTimes(2);
    const recipients = mockSendMilestoneApprovedToBackerEmail.mock.calls.map((c) => c[0].backerEmail);
    expect(recipients).toContain('sam@example.com');
    expect(recipients).toContain('pat@example.com');
    expect(recipients).not.toContain('skip@example.com');
  });

  it('still sends emails when releaseMilestonePayment fails', async () => {
    mockReleaseMilestonePayment.mockResolvedValueOnce({ success: false, error: 'db error' });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      buildServiceClient({
        decision: 'approved',
        backers: [{ status: 'captured', display_name: 'Sam', email: 'sam@example.com' }],
      })
    );

    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: JSON.stringify({ submission_id: 'sub-1', decision: 'approved' }),
    });
    await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

    expect(mockSendMilestoneApprovedToCreatorEmail).toHaveBeenCalledTimes(1);
    expect(mockSendMilestoneApprovedToCreatorEmail.mock.calls[0][0].escrowReleasedSgd).toBe(0);
    expect(mockSendMilestoneApprovedToBackerEmail).toHaveBeenCalledTimes(1);
  });

  it('on rejected, sends needs-action email and skips approval emails + escrow release', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      buildServiceClient({
        decision: 'rejected',
        backers: [{ status: 'captured', display_name: 'Sam', email: 'sam@example.com' }],
      })
    );

    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: JSON.stringify({
        submission_id: 'sub-1',
        decision: 'rejected',
        feedback_text: 'Photo blurry',
      }),
    });
    await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

    expect(mockReleaseMilestonePayment).not.toHaveBeenCalled();
    expect(mockSendMilestoneApprovedToCreatorEmail).not.toHaveBeenCalled();
    expect(mockSendMilestoneApprovedToBackerEmail).not.toHaveBeenCalled();
    expect(mockSendMilestoneNeedsActionEmail).toHaveBeenCalledTimes(1);
    expect(mockSendMilestoneNeedsActionEmail.mock.calls[0][0]).toMatchObject({
      decision: 'rejected',
      feedbackText: 'Photo blurry',
      milestoneNumber: 1,
    });
  });

  it('on needs_info, sends needs-action email with that decision', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      buildServiceClient({ decision: 'needs_info' })
    );

    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: JSON.stringify({ submission_id: 'sub-1', decision: 'needs_info' }),
    });
    await POST(req as any, { params: Promise.resolve({ campaignId: 'campaign-1' }) });

    expect(mockSendMilestoneNeedsActionEmail).toHaveBeenCalledTimes(1);
    expect(mockSendMilestoneNeedsActionEmail.mock.calls[0][0].decision).toBe('needs_info');
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npx vitest run tests/api/campaigns/milestone-approve.test.ts
```
Expected: FAIL — none of the helpers are wired into the route.

- [ ] **Step 3: Wire `releaseMilestonePayment` + emails into the route**

Open `app/api/campaigns/[campaignId]/milestone-approve/route.ts`. Add imports at the top (after the existing imports):

```ts
import { releaseMilestonePayment } from '@/lib/milestones/escrow';
import {
  sendMilestoneApprovedToCreatorEmail,
  sendMilestoneApprovedToBackerEmail,
  sendMilestoneNeedsActionEmail,
} from '@/lib/email/templates';
```

Then find the existing block that updates `milestone_submissions.status` (around line 98-108). After that block (right before the `return NextResponse.json({ success: true, approval }, ...);` at line 110), insert the post-decision side-effects:

```ts
    // Load project + creator for emails
    const { data: project, error: projectError } = await service
      .from('projects')
      .select('id, title, slug, amount_pledged_sgd, creator:profiles!creator_id(display_name, email)')
      .eq('id', campaignId)
      .single();

    if (projectError || !project) {
      console.error('Failed to load project for milestone email:', projectError);
      return NextResponse.json({ success: true, approval }, { status: 200 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = project as any;
    const creatorEmail = p.creator?.email;
    const creatorName = p.creator?.display_name;
    const projectTitle = p.title;
    const projectSlug = p.slug;
    const milestoneNumber = submission.milestone_number as 1 | 2 | 3;

    if (decision === 'approved') {
      // Insert escrow_releases row
      const releaseResult = await releaseMilestonePayment({
        campaign_id: campaignId,
        milestone_number: milestoneNumber,
        campaign_total_sgd: p.amount_pledged_sgd,
      });
      if (!releaseResult.success) {
        console.error('Escrow release insert failed:', releaseResult.error);
      }
      const escrowReleasedSgd = releaseResult.amount_released ?? 0;

      // Email creator
      if (creatorEmail) {
        sendMilestoneApprovedToCreatorEmail({
          creatorEmail,
          creatorName,
          projectTitle,
          projectSlug,
          milestoneNumber,
          escrowReleasedSgd,
        }).catch(console.error);
      }

      // Email backers whose money is in escrow
      const { data: backers } = await service
        .from('pledges')
        .select('backer:profiles!backer_id(display_name, email)')
        .eq('project_id', campaignId)
        .in('status', ['captured', 'paynow_captured']);

      for (const pledge of backers ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = (pledge as any).backer;
        if (!b?.email) continue;
        sendMilestoneApprovedToBackerEmail({
          backerEmail: b.email,
          backerName: b.display_name,
          creatorName,
          projectTitle,
          projectSlug,
          milestoneNumber,
          escrowReleasedSgd,
        }).catch(console.error);
      }
    } else if (decision === 'rejected' || decision === 'needs_info') {
      if (creatorEmail) {
        sendMilestoneNeedsActionEmail({
          creatorEmail,
          creatorName,
          projectTitle,
          projectSlug,
          milestoneNumber,
          decision,
          feedbackText: feedback_text || undefined,
        }).catch(console.error);
      }
    }
```

The block uses `submission` (loaded earlier in the existing handler at line 64-69) and `decision`/`feedback_text` (parsed from body at line 43). All in scope.

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
npx vitest run tests/api/campaigns/milestone-approve.test.ts
```
Expected: 4 passing tests.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add app/api/campaigns/[campaignId]/milestone-approve/route.ts tests/api/campaigns/milestone-approve.test.ts
git commit -m "feat(milestones): wire releaseMilestonePayment + emails on admin decision"
```

---

## Task 9: Delete `lib/email/milestone-notifications.ts`

**Files:**
- Delete: `lib/email/milestone-notifications.ts`
- Delete: `tests/lib/email/milestone-notifications.test.ts`

- [ ] **Step 1: Confirm nothing imports the deleted module**

```bash
grep -rn "from.*milestone-notifications" /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00/app /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00/lib /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00/components 2>&1 | head
```
Expected: no output (only the test file referenced the module).

If any production caller still references it, stop and report — should not happen given the audit, but verify.

- [ ] **Step 2: Delete the files**

```bash
rm /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00/lib/email/milestone-notifications.ts
rm /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00/tests/lib/email/milestone-notifications.test.ts
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```
Expected: no failures referencing the deleted file.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(email): delete milestone-notifications.ts (content migrated to templates.ts)"
```

---

## Task 10: Final verification + manual smoke test

**Files:** none new. This task validates the integrated work.

- [ ] **Step 1: Full test suite**

```bash
npm test
```
Expected: all milestone + email + cron tests pass. Pre-existing failures in `tests/api/projects/create.test.ts` (the same 7 failing on main today) may still appear but are unrelated; document but do not fix in this PR.

- [ ] **Step 2: Full typecheck**

```bash
npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: 0 new errors on the changed files. Pre-existing 98 errors (in older test files) may still appear; only investigate if a new error is introduced by this PR's code.

- [ ] **Step 4: Manual smoke test (gating release)**

Set up: ensure `RESEND_API_KEY` is set to a working dev key in `.env.local`. Use real email addresses (your own) for backer/creator/admin in test data.

Trigger each new path locally and confirm the actual email arrives:

1. **Failed campaign** — create a test project in dev with a back-dated `deadline` and `status='active'`, then call the cron handler locally:
   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:65207/api/cron/close-campaigns
   ```
   Confirm:
   - Creator receives `sendCampaignFailedEmail` (existing template, but now firing)
   - Card-pledge backers (`payment_method='card'`, status `'authorized'` or `'released'`) receive `sendCampaignFailedToBackerEmail` with "no charge, no action" copy

2. **Milestone approved** — use the admin UI on a test campaign to approve a milestone. Confirm:
   - 1 creator email with milestone number + escrow amount in `S$X,XXX` format
   - N backer emails (where N = backers in `captured` or `paynow_captured` status)
   - In the database, `escrow_releases` has a new row with the right `amount_sgd` (40% / 40% / 20% of `amount_pledged_sgd`)

3. **Milestone rejected** — use the admin UI on a test submission, click reject, include a feedback message. Confirm:
   - 1 creator email with rejection copy + the feedback rendered (escaped)
   - No backer emails
   - No `escrow_releases` row inserted

4. **Milestone needs_info** — same as rejected with `decision='needs_info'`. Confirm "questions about your milestone" copy.

5. **Funded campaign** — trigger via Stripe CLI:
   ```bash
   stripe trigger transfer.created
   ```
   Confirm the resulting `sendCampaignFundedEmail` arrives with the real project slug in the dashboard CTA link, and the actual `backer_count` shown in the body (not "0 backers").

6. **Reply-To verification** — for any email above, hit reply in your mail client. Confirm the To: line shows `hello@getthatbread.sg`.

If any check fails, fix in this task with a follow-up step. Do not declare done until all 6 pass.

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin claude/email-cadence-fix
gh pr create --base main --head claude/email-cadence-fix --title "feat(email): wire missing transactional emails + fix funded-email args + Reply-To" --body "$(cat <<'EOF'
## Summary
- Wires the four missing email triggers found in the email cadence audit: campaign-failed (creator + card-pledge backers), milestone-approved (creator + backers), milestone rejected/needs_info (creator).
- Wires \`releaseMilestonePayment()\` from \`lib/milestones/escrow.ts\` into the milestone-approve admin endpoint. The function existed with tests but had no production caller — without it, no \`escrow_releases\` row was inserted on approval, so the new "S\$X released" emails would have had no audit trail.
- Fixes two correctness bugs in \`sendCampaignFundedEmail\` (\`projectSlug=''\` and \`backerCount=0\` were hardcoded at the call site).
- Adds centralized \`Reply-To: hello@getthatbread.sg\` header in \`sendEmail()\` — every transactional send inherits it.
- Migrates \`lib/email/milestone-notifications.ts\` (plain-text body shape, never wired) to a real HTML template in \`lib/email/templates.ts\`. Deletes the old file + its tests.

Spec: \`docs/superpowers/specs/2026-04-26-email-cadence-fix-design.md\`
Plan: \`docs/superpowers/plans/2026-04-26-email-cadence-fix.md\`

## Out of scope (deferred)
- Milestone late / submitted emails
- Dispute emails (no filing UI exists yet)
- PayNow refund flow on failed campaigns
- Resend webhook receiver for bounces / spam complaints

## Test plan
- [x] All new automated tests pass (\`npm test\`)
- [x] \`npx tsc --noEmit\` clean
- [x] \`npm run lint\` clean on changed files
- [x] Manual smoke test 6 scenarios (failed campaign cron, milestone approved/rejected/needs_info, funded webhook, Reply-To)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review checklist (for the executor)

Before declaring this plan done:

- [ ] Every spec section has a corresponding task: Reply-To (Task 1), funded-email fix (Task 2), 4 new templates (Tasks 3-6), failed-cron wiring (Task 7), milestone-approve wiring + escrow release (Task 8), cleanup (Task 9), final verification (Task 10)
- [ ] All template prop names match between definition and consumer (e.g., `escrowReleasedSgd: number`, `decision: "rejected" | "needs_info"`)
- [ ] Smoke test in Task 10 is gated and required before declaring done
- [ ] No tasks reference helpers, types, or methods not defined in this plan or in the existing codebase
