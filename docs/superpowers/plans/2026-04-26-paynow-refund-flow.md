# PayNow Refund Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the close-campaigns cron flips a campaign to "failed" because it didn't hit goal by deadline, refund all `paynow_captured` pledges via Stripe. (Card pledges are already handled via auth cancellation in the same cron — that path stays untouched.)

**Architecture: thin cron, fat webhook.** The cron calls `stripe.refunds.create()` for each PayNow pledge with a per-pledge idempotency key. The existing `charge.refunded` webhook handler does everything else: flips pledge status to `refunded`, decrements project totals, releases reward slots, and sends the refund email. No duplicated logic, naturally idempotent.

**Tech Stack:** Next.js (App Router; per `AGENTS.md` this is a custom Next.js fork — but this task is pure logic inside an existing route, no Next.js conventions touched), Supabase service client, Stripe SDK (Node), Vitest + hoisted mocks, Sentry (`@sentry/nextjs`).

---

## Context the implementer must know

### What's already built (do NOT re-build)

| Piece | Location | What it does |
|---|---|---|
| Campaign-fail branch of cron | `app/api/cron/close-campaigns/route.ts:68-162` | Flips project to `failed`, cancels card auths, emails creator + card backers |
| `charge.refunded` webhook handler | `app/api/webhooks/stripe/route.ts:173-224` | Status flip → `refunded`, decrement totals RPC, release reward slot RPC, send refund email |
| `sendPledgeRefundedEmail` | `lib/email/templates.ts:558-572` (`PledgeRefundedArgs` interface at `:31-36`) | "Your pledge to X has been refunded" email — **fired by the webhook, not the cron** |
| Stripe event idempotency | `app/api/webhooks/stripe/route.ts:25-37` | Inserts each `event.id` into `processed_stripe_events`; duplicate on `23505` returns 200 |
| Existing cron test | `tests/api/cron/close-campaigns.test.ts` (157 lines) | Use as template for new test cases (extend, don't fork) |
| Sentry SDK | `import * as Sentry from "@sentry/nextjs"` (used in `sentry.server.config.ts`, `app/api/sentry-example-api/route.ts`) | Call `Sentry.captureException(err, { extra: {...} })` for error capture |

### Key behavioral details (read before coding)

1. **Card pledges have `status = "authorized"`** (auth held, not captured). The cron at `:81-85` queries those and calls `stripe.paymentIntents.cancel(pi)` to release the auth. **Do not change this.**

2. **PayNow pledges have `status = "paynow_captured"`** (funds already taken). For these, `paymentIntents.cancel()` would fail — the intent is succeeded, not requires_capture. We need `stripe.refunds.create({ payment_intent })` instead.

3. **Why we don't update the pledge row in the cron:** the existing `charge.refunded` webhook does it (`app/api/webhooks/stripe/route.ts:186-200`), and Stripe always fires that event after a successful refund call. Letting the webhook own the DB write means one source of truth and zero race conditions — the cron's only job is to initiate the refund.

4. **Why we don't send the refund email from the cron:** same reason — the webhook fires `sendPledgeRefundedEmail` at `:213-218`. The cron initiates, the webhook completes.

5. **Why card backers still get `sendCampaignFailedToBackerEmail` from the cron but PayNow backers don't:** the current code at `:143-160` filters by `payment_method = "card"` because that template's copy says "your card was never charged" — wrong for PayNow. PayNow backers will get the refund email from the webhook instead. **This is intentional and stays as-is.**

6. **Idempotency key format:** `refund_failed_${pledge.id}`. If the cron retries (e.g., it crashed mid-batch and reran an hour later), Stripe returns the existing refund object instead of creating a duplicate. Pledge IDs are UUIDs, unique per pledge, never reused.

7. **Failure isolation:** if `stripe.refunds.create()` throws for one pledge, capture to Sentry with pledge context and continue with the rest. One bad pledge must not block others.

### Files to modify

- `app/api/cron/close-campaigns/route.ts` (currently 167 lines) — add a paynow-pledge refund loop after the existing card loop. The new code goes between line 119 (close of `for (const pledge of pledges ?? [])`) and line 121 (`// Notify creator + card-pledge backers` comment).
- `tests/api/cron/close-campaigns.test.ts` (currently 157 lines) — extend existing test file with new mocks and new scenarios (do not create a new file)

### File NOT modified

- `app/api/webhooks/stripe/route.ts` — already handles `charge.refunded` correctly. **Do not edit.**
- `lib/email/templates.ts` — `sendPledgeRefundedEmail` already exists. **Do not edit.**

### Stripe SDK note

`stripe.refunds.create(params, options)` — the idempotency key goes in the **second argument** (options), not the first:

```typescript
await stripe.refunds.create(
  { payment_intent: pi },
  { idempotencyKey: `refund_failed_${pledgeId}` },
);
```

Do not put `idempotency_key` (snake_case) inside the params object — that's a different field and won't work.

---

## Task 1: Test scaffolding — add Stripe refund mock and PayNow pledge fixtures

**Goal:** Extend the existing test file's mocks so they can simulate PayNow pledges and Stripe refund calls. No behavioral test yet — just plumbing.

**Files:**
- Modify: `tests/api/cron/close-campaigns.test.ts:3-13` (add hoisted mock), `:21-22` (add to stripe mock), `:42-67` (add scenario data), `:95-103` (handle paynow pledge select)

- [ ] **Step 1: Add `mockStripeRefund` to the hoisted mocks block**

In `tests/api/cron/close-campaigns.test.ts`, replace lines 3-13:

```typescript
const {
  mockSendCampaignFailedEmail,
  mockSendCampaignFailedToBackerEmail,
  mockStripeCancel,
  mockStripeRefund,
  mockCaptureProjectPledges,
} = vi.hoisted(() => ({
  mockSendCampaignFailedEmail: vi.fn().mockResolvedValue({}),
  mockSendCampaignFailedToBackerEmail: vi.fn().mockResolvedValue({}),
  mockStripeCancel: vi.fn().mockResolvedValue({}),
  mockStripeRefund: vi.fn().mockResolvedValue({ id: 're_test' }),
  mockCaptureProjectPledges: vi.fn().mockResolvedValue({ captured: 0, failed: 0 }),
}));
```

- [ ] **Step 2: Wire the refund mock into the Stripe mock**

Replace lines 20-22 of the same file:

```typescript
vi.mock('@/lib/stripe/server', () => ({
  getStripe: () => ({
    paymentIntents: { cancel: mockStripeCancel },
    refunds: { create: mockStripeRefund },
  }),
}));
```

- [ ] **Step 3: Add a `'failed-with-paynow'` scenario to the supabase mock builder**

Replace the `buildSupabaseMock` signature and body (current lines 42-95). The change is: accept a new scenario name, add a `paynowPledges` fixture, and make the `pledges.select()` branch return the right fixture based on which `.eq("status", ...)` the route called.

The current cron reads creator/backer emails directly from the profiles join (no `auth.admin.getUserById`), so the mock has NO `auth` block. Match that shape.

```typescript
function buildSupabaseMock(
  scenario: 'failed' | 'funded' | 'no-card-backers' | 'failed-with-paynow',
) {
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
    { id: 'pledge-1', stripe_payment_intent_id: 'pi_card_1' },
    { id: 'pledge-2', stripe_payment_intent_id: 'pi_card_2' },
  ];
  const paynowPledges =
    scenario === 'failed-with-paynow'
      ? [
          { id: 'pledge-pn-1', stripe_payment_intent_id: 'pi_pn_1' },
          { id: 'pledge-pn-2', stripe_payment_intent_id: 'pi_pn_2' },
        ]
      : [];
  const cardBackers =
    scenario === 'no-card-backers'
      ? []
      : [
          { backer: { display_name: 'Sam', email: 'sam@example.com' } },
          { backer: { display_name: 'Pat', email: 'pat@example.com' } },
        ];

  // Track captured .eq() filter args so the pledges.select() branch can
  // disambiguate "authorized" (card) vs "paynow_captured" (paynow) queries —
  // both queries select the same columns, only the status filter differs.
  type EqArg = [string, unknown];
  function thenableWithFilters(
    resolve: (eqs: EqArg[]) => unknown,
  ) {
    const eqs: EqArg[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {};
    chain.eq = (col: string, val: unknown) => {
      eqs.push([col, val]);
      return chain;
    };
    for (const m of ['in', 'is', 'lt', 'gt', 'not', 'order', 'limit', 'range']) {
      chain[m] = () => chain;
    }
    chain.single = async () => ({ data: resolve(eqs), error: null });
    chain.then = (cb: (v: unknown) => void) => cb({ data: resolve(eqs), error: null });
    return chain;
  }

  return {
    from: (table: string) => {
      if (table === 'projects') {
        return {
          select: (cols: string) => {
            const isFullRecordSelect = cols.includes('creator:profiles');
            const data = isFullRecordSelect ? projectFull : expiredProjects;
            return thenableWithFilters(() => data);
          },
          update: () => thenableWithFilters(() => null),
        };
      }
      if (table === 'pledges') {
        return {
          select: (cols: string) =>
            thenableWithFilters((eqs) => {
              if (cols.includes('backer:profiles')) return cardBackers;
              const statusFilter = eqs.find(([col]) => col === 'status');
              if (statusFilter?.[1] === 'paynow_captured') return paynowPledges;
              return authorizedPledges;
            }),
          update: () => thenableWithFilters(() => null),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}
```

Note: the original `thenable()` helper at lines 31-40 can be deleted — `thenableWithFilters` replaces it. The existing tests (`'failed'`, `'funded'`, `'no-card-backers'`) still pass because their resolver doesn't use the `eqs` argument.

- [ ] **Step 4: Update beforeEach to clear the new mock**

Replace lines 117-122:

```typescript
beforeEach(() => {
  process.env.CRON_SECRET = 'test-secret';
  mockSendCampaignFailedEmail.mockClear();
  mockSendCampaignFailedToBackerEmail.mockClear();
  mockStripeCancel.mockClear();
  mockStripeRefund.mockClear();
  mockStripeRefund.mockResolvedValue({ id: 're_test' });
});
```

The explicit `mockResolvedValue` reset ensures Task 4's failure tests don't leak into Task 2's happy-path test.

- [ ] **Step 5: Run existing tests to confirm scaffolding didn't break anything**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx vitest run tests/api/cron/close-campaigns.test.ts
```

Expected: all 3 existing tests still pass (`emails creator + card-pledge backers when a project fails`, `does not email failed templates when project funds`, `emails creator only when no card-pledge backers exist`).

- [ ] **Step 6: Commit**

```bash
git add tests/api/cron/close-campaigns.test.ts
git commit -m "test(cron): scaffold paynow refund mocks for close-campaigns"
```

---

## Task 2: Failing test — paynow pledges trigger refund with idempotency key

**Goal:** Lock in the contract before implementing: each paynow pledge must produce one `refunds.create` call, with the right `payment_intent` and a unique idempotency key.

**Files:**
- Modify: `tests/api/cron/close-campaigns.test.ts` (append new `it()` block inside the existing `describe`)

- [ ] **Step 1: Add the failing test inside the existing `describe('close-campaigns cron', ...)` block**

Append after the last existing `it()` block (after line 168, before the closing `});`):

```typescript
  it('refunds paynow pledges with per-pledge idempotency keys when project fails', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      buildSupabaseMock('failed-with-paynow'),
    );

    const req = new Request('http://localhost/api/cron/close-campaigns', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    // One refund call per paynow pledge.
    expect(mockStripeRefund).toHaveBeenCalledTimes(2);

    // Each call: first arg has payment_intent; second arg has idempotencyKey
    // tied to the pledge id (so cron retries are safe).
    const calls = mockStripeRefund.mock.calls;
    const paymentIntents = calls.map((c) => c[0].payment_intent).sort();
    expect(paymentIntents).toEqual(['pi_pn_1', 'pi_pn_2']);

    const idempotencyKeys = calls.map((c) => c[1]?.idempotencyKey).sort();
    expect(idempotencyKeys).toEqual([
      'refund_failed_pledge-pn-1',
      'refund_failed_pledge-pn-2',
    ]);

    // Card auth-cancel path is untouched: paynow pledges should NOT also be
    // sent through paymentIntents.cancel.
    const canceledIntents = mockStripeCancel.mock.calls.map((c) => c[0]);
    expect(canceledIntents).not.toContain('pi_pn_1');
    expect(canceledIntents).not.toContain('pi_pn_2');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx vitest run tests/api/cron/close-campaigns.test.ts -t "refunds paynow pledges"
```

Expected: FAIL — `mockStripeRefund` was called 0 times (route doesn't refund yet).

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/api/cron/close-campaigns.test.ts
git commit -m "test(cron): paynow refund triggers stripe.refunds.create with idempotency key"
```

---

## Task 3: Implement the paynow refund loop (happy path only)

**Goal:** Make Task 2's test pass with the minimum viable implementation. No try/catch yet — Task 5 adds error handling. (TDD: implement only what current tests demand.)

**Files:**
- Modify: `app/api/cron/close-campaigns/route.ts` — insert new code between current line 119 and current line 121

- [ ] **Step 1: Insert the paynow refund block in the failed-campaign branch**

In `app/api/cron/close-campaigns/route.ts`, after the existing card-cancel `for (const pledge of pledges ?? [])` loop ends at line 119, **before** the comment `// Notify creator + card-pledge backers` at line 121, insert:

```typescript
      // Refund paynow_captured pledges. Unlike card auths (cancelled above),
      // PayNow funds were captured at pledge time and must be returned via the
      // Stripe refund API. We deliberately do NOT update pledge rows here —
      // the existing charge.refunded webhook handler owns that side effect
      // (status flip, totals decrement, reward slot release, refund email).
      // Idempotency key is per-pledge so cron retries are safe.
      const { data: paynowPledges, error: paynowError } = await serviceClient
        .from("pledges")
        .select("id, stripe_payment_intent_id")
        .eq("project_id", project.id)
        .eq("status", "paynow_captured");

      if (paynowError) {
        console.error(
          `Failed to fetch paynow pledges for failed project ${project.id}:`,
          paynowError,
        );
      } else {
        for (const pledge of paynowPledges ?? []) {
          if (!pledge.stripe_payment_intent_id) continue;
          await stripe.refunds.create(
            { payment_intent: pledge.stripe_payment_intent_id },
            { idempotencyKey: `refund_failed_${pledge.id}` },
          );
        }
      }

```

- [ ] **Step 2: Run the new test to verify it passes**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx vitest run tests/api/cron/close-campaigns.test.ts -t "refunds paynow pledges"
```

Expected: PASS.

- [ ] **Step 3: Run the full test file to verify no regressions**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx vitest run tests/api/cron/close-campaigns.test.ts
```

Expected: all 4 tests pass (3 existing + 1 new).

- [ ] **Step 4: Type-check**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx tsc --noEmit
```

Expected: no errors. (If errors mention the Stripe SDK signature, double-check that `idempotencyKey` is in the second argument, not inside the params object.)

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/close-campaigns/route.ts
git commit -m "feat(cron): refund paynow pledges when campaign fails

Cron initiates stripe.refunds.create with per-pledge idempotency keys.
Existing charge.refunded webhook handles the DB writes and refund email
so there's a single source of truth for refund side effects."
```

---

## Task 4: Failing test — partial-batch failure resilience + Sentry capture

**Goal:** Lock in the contract that one failing refund must not block other refunds, and that the failure is captured to Sentry with pledge context.

**Files:**
- Modify: `tests/api/cron/close-campaigns.test.ts` — add Sentry mock to hoisted block, add a new `it()` test

- [ ] **Step 1: Add Sentry mock to the hoisted block and `vi.mock` registration**

In `tests/api/cron/close-campaigns.test.ts`, update the hoisted block (the one written in Task 1) to include `mockSentryCapture`:

```typescript
const {
  mockSendCampaignFailedEmail,
  mockSendCampaignFailedToBackerEmail,
  mockStripeCancel,
  mockStripeRefund,
  mockCaptureProjectPledges,
  mockSentryCapture,
} = vi.hoisted(() => ({
  mockSendCampaignFailedEmail: vi.fn().mockResolvedValue({}),
  mockSendCampaignFailedToBackerEmail: vi.fn().mockResolvedValue({}),
  mockStripeCancel: vi.fn().mockResolvedValue({}),
  mockStripeRefund: vi.fn().mockResolvedValue({ id: 're_test' }),
  mockCaptureProjectPledges: vi.fn().mockResolvedValue({ captured: 0, failed: 0 }),
  mockSentryCapture: vi.fn(),
}));
```

Add this `vi.mock` registration alongside the others (after the existing `vi.mock` calls, before the `buildSupabaseMock` function):

```typescript
vi.mock('@sentry/nextjs', () => ({
  captureException: mockSentryCapture,
}));
```

Also add `mockSentryCapture.mockClear();` to `beforeEach`:

```typescript
beforeEach(() => {
  process.env.CRON_SECRET = 'test-secret';
  mockSendCampaignFailedEmail.mockClear();
  mockSendCampaignFailedToBackerEmail.mockClear();
  mockStripeCancel.mockClear();
  mockStripeRefund.mockClear();
  mockStripeRefund.mockResolvedValue({ id: 're_test' });
  mockSentryCapture.mockClear();
});
```

- [ ] **Step 2: Add the failing partial-failure test inside the `describe` block**

Append after the test added in Task 2:

```typescript
  it('continues refunding remaining pledges when one refund call throws, and reports to Sentry', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      buildSupabaseMock('failed-with-paynow'),
    );

    // First call (pledge-pn-1) fails, second call (pledge-pn-2) succeeds.
    // Order is determined by the route iterating in array order.
    mockStripeRefund
      .mockRejectedValueOnce(new Error('stripe is on fire'))
      .mockResolvedValueOnce({ id: 're_test_2' });

    const req = new Request('http://localhost/api/cron/close-campaigns', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    const res = await GET(req);

    // Cron must still return 200 — partial failure is not a cron failure.
    expect(res.status).toBe(200);

    // Both pledges were attempted; the throw didn't abort the loop.
    expect(mockStripeRefund).toHaveBeenCalledTimes(2);

    // Sentry got the failure with enough context to investigate.
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const [capturedErr, captureOpts] = mockSentryCapture.mock.calls[0];
    expect(capturedErr).toBeInstanceOf(Error);
    expect((capturedErr as Error).message).toBe('stripe is on fire');
    expect(captureOpts?.extra).toMatchObject({
      pledgeId: 'pledge-pn-1',
      paymentIntentId: 'pi_pn_1',
      projectId: 'proj-1',
    });
  });
```

- [ ] **Step 3: Run the new test to verify it fails**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx vitest run tests/api/cron/close-campaigns.test.ts -t "continues refunding remaining pledges"
```

Expected: FAIL — the route currently has no try/catch around `stripe.refunds.create`, so the first throw bubbles up and the second call never runs. Test fails on `expect(mockStripeRefund).toHaveBeenCalledTimes(2)` (actual: 1) or earlier on the unhandled rejection.

- [ ] **Step 4: Commit the failing test**

```bash
git add tests/api/cron/close-campaigns.test.ts
git commit -m "test(cron): partial paynow refund failure must not abort batch"
```

---

## Task 5: Add try/catch + Sentry capture to the refund loop

**Goal:** Make Task 4's test pass.

**Files:**
- Modify: `app/api/cron/close-campaigns/route.ts` — add Sentry import + wrap the refund call

- [ ] **Step 1: Add Sentry import at the top of the file**

In `app/api/cron/close-campaigns/route.ts`, add to the import block (after line 5):

```typescript
import * as Sentry from "@sentry/nextjs";
```

- [ ] **Step 2: Wrap the refund call in try/catch with Sentry capture**

Replace the `for (const pledge of paynowPledges ?? [])` loop body added in Task 3 with:

```typescript
        for (const pledge of paynowPledges ?? []) {
          if (!pledge.stripe_payment_intent_id) continue;
          try {
            await stripe.refunds.create(
              { payment_intent: pledge.stripe_payment_intent_id },
              { idempotencyKey: `refund_failed_${pledge.id}` },
            );
          } catch (err) {
            console.error(
              `Failed to refund paynow pledge ${pledge.id} (intent ${pledge.stripe_payment_intent_id}):`,
              err,
            );
            Sentry.captureException(err, {
              extra: {
                pledgeId: pledge.id,
                paymentIntentId: pledge.stripe_payment_intent_id,
                projectId: project.id,
              },
            });
            // Do not rethrow — keep refunding the remaining pledges.
          }
        }
```

- [ ] **Step 3: Run the new test to verify it passes**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx vitest run tests/api/cron/close-campaigns.test.ts -t "continues refunding remaining pledges"
```

Expected: PASS.

- [ ] **Step 4: Run the full test file**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx vitest run tests/api/cron/close-campaigns.test.ts
```

Expected: all 5 tests pass (3 existing + Task 2's happy-path + Task 4's resilience test).

- [ ] **Step 5: Run the full test suite to catch unexpected ripple effects**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx vitest run
```

Expected: no new failures vs. baseline. (If pre-existing failures exist on the branch, they're not your concern — only flag NEW failures introduced by these changes.)

- [ ] **Step 6: Type-check**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Lint**

```bash
cd /Users/darylwui/plsfundme/.claude/worktrees/optimistic-lamarr-791e00 && npx next lint --dir app/api/cron/close-campaigns --dir tests/api/cron
```

Expected: no errors. (Warnings about `any` in test mocks are pre-existing and acceptable.)

- [ ] **Step 8: Commit**

```bash
git add app/api/cron/close-campaigns/route.ts
git commit -m "feat(cron): isolate paynow refund failures with Sentry capture

One failing refund no longer aborts the batch — log to console, capture
to Sentry with pledge/intent/project context for ops, and continue with
the remaining pledges."
```

---

## Task 6: Smoke-test in Stripe test mode (manual)

**Goal:** Verify end-to-end in test mode that a failed campaign with a PayNow pledge produces a real Stripe refund and the backer receives the refund email. This is a manual checklist — no code changes.

**Files:** none (verification only)

**Pre-requisites:**
- Stripe is in test mode (confirmed: project not yet live)
- Local dev server running (port 65207 per session context)
- A test creator + test backer account exist
- You can override a project's `deadline` via the Supabase SQL editor to force the cron path

- [ ] **Step 1: Set up the failing campaign**

Create or pick a test project. In the Supabase SQL editor:

```sql
-- Force the project under-goal and past deadline
update projects
set deadline = now() - interval '1 hour',
    funding_goal_sgd = 99999,        -- guarantees under-goal
    amount_pledged_sgd = 50,
    status = 'active'
where id = '<your-test-project-id>';
```

- [ ] **Step 2: Make a PayNow pledge as the test backer**

In the dev UI, sign in as the backer and pledge $50 via PayNow on the test project. Use Stripe's test PayNow flow (the "Authorize" button on the PayNow QR mock). Wait until the pledge row in Supabase shows `status = "paynow_captured"` and `payment_method = "paynow"`.

- [ ] **Step 3: Trigger the cron manually**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:65207/api/cron/close-campaigns
```

Expected response (project ID will differ):

```json
{ "funded": [], "failed": ["<your-test-project-id>"] }
```

- [ ] **Step 4: Verify Stripe received the refund**

In the Stripe test-mode dashboard → Payments → find the PaymentIntent → confirm a Refund row was created with the expected amount. Note the `idempotency_key` should be visible in the request log: `refund_failed_<pledge-id>`.

- [ ] **Step 5: Verify the webhook fired and updated the pledge**

In Supabase, check the pledge:

```sql
select id, status, payment_method, refunded_at
from pledges
where id = '<pledge-id>';
```

Expected: `status = 'refunded'`. **Note:** `refunded_at` will likely be `null` — the `charge.refunded` webhook handler only writes the status flip, not `refunded_at`. That column is set by the milestone-escrow refund path, not the campaign-failed refund path. Don't treat `null` as a failure signal here. The reliable success indicators are: (a) `status = 'refunded'` on this row, (b) Stripe dashboard shows the refund object (Step 4), (c) project totals decremented (Step 7). Setting `refunded_at` from the webhook is a worthwhile follow-up, but it's a pre-existing gap, not a regression.

- [ ] **Step 6: Verify the refund email arrived**

Check the backer's inbox (Resend dashboard → Logs in dev). Expect a `Your pledge to "<project title>" has been refunded` email.

- [ ] **Step 7: Verify project totals decremented**

```sql
select id, amount_pledged_sgd, backer_count
from projects
where id = '<your-test-project-id>';
```

Expected: `amount_pledged_sgd` decreased by the refunded amount (the webhook calls `decrement_pledge_totals`).

- [ ] **Step 8: Re-run the cron to verify idempotency**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:65207/api/cron/close-campaigns
```

Expected:
- The expired-projects query returns nothing (project status is now `failed`, not `active`), so the refund loop doesn't even fire.
- If you wanted to force a second attempt, you could revert `status` to `active` and rerun — Stripe would return the existing refund object thanks to the idempotency key, and no double-refund would occur. (Optional verification — skip unless you want belt-and-braces confirmation.)

- [ ] **Step 9: Document the smoke-test result**

Append to `~/Desktop/changelog/getthatbread-changelog.md` (per user's tone preference, conversational not changelog-bot):

```markdown
## 2026-04-26 — PayNow refund flow live in test mode

The close-campaigns cron now refunds PayNow-captured pledges when a campaign
fails under goal. Smoke-tested end-to-end: pledge → fail campaign → cron →
Stripe refund → webhook flips status → backer gets refund email. Card auth
cancellation flow untouched. Per-pledge idempotency keys mean cron retries
are safe.
```

---

## Self-Review Checklist (controller, before dispatching Task 1)

**Spec coverage:**
- ✅ Cron query extended to `paynow_captured` (Task 3)
- ✅ Per-pledge `stripe.refunds.create` with `idempotencyKey` (Task 3)
- ✅ Try/catch + Sentry capture per pledge (Task 5)
- ✅ Test: refund called with right args (Task 2)
- ✅ Test: partial failure doesn't abort batch (Task 4)
- ✅ Test: idempotency key uses pledge.id (Task 2)
- ✅ Smoke-test docs (Task 6)
- ✅ Existing card flow untouched (Task 3 inserts code without modifying lines 81-119)

**Type consistency:**
- `mockStripeRefund` resolves to `{ id: string }` — matches `Stripe.Refund`'s minimum shape used by tests
- `idempotencyKey` (camelCase) consistent across plan + Stripe SDK signature
- Pledge field names (`id`, `stripe_payment_intent_id`) match `database.types.ts`
- `Sentry.captureException(err, { extra: {...} })` matches `@sentry/nextjs` signature

**Placeholder scan:** No TBDs, no "implement appropriate error handling", no "similar to Task N" — every code step has full code.

**Independent task check:** Each task's tests reference fixtures defined in Task 1; that's intentional (scaffolding then content), and noted in the file headers.
