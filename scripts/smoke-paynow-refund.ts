/**
 * Smoke test: PayNow refund flow on failed campaigns
 *
 * Run from the worktree root:
 *   npx tsx --tsconfig tsconfig.json scripts/smoke-paynow-refund.ts
 *
 * Requires .env.local to be sourced (or set env vars inline):
 *   set -a; source .env.local; set +a
 *   npx tsx --tsconfig tsconfig.json scripts/smoke-paynow-refund.ts
 *
 * What it does:
 *  1. Creates a Stripe test PaymentIntent (card, so it captures immediately)
 *  2. Seeds a paynow_captured pledge in Supabase pointing at that PI
 *  3. Marks the project as active, past deadline, and below goal
 *  4. Calls the GET handler directly (no HTTP auth needed)
 *  5. Waits 5 s for the charge.refunded webhook (if Stripe CLI is running)
 *  6. Verifies project status, Stripe refund, and (if webhook ran) pledge status
 *  7. Rolls back test data regardless of outcome
 */

// Load .env.local automatically
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ── config ────────────────────────────────────────────────────────────────────
const STRIPE_KEY   = process.env.STRIPE_SECRET_KEY!;
const SUPA_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROJECT_ID   = 'e3996811-a6a7-4919-8f42-356f67ffc106'; // MochiCloud

if (!STRIPE_KEY || !SUPA_URL || !SUPA_SERVICE) {
  console.error('❌  Missing env vars. Make sure .env.local is sourced.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2026-03-25.dahlia' });
const db     = createClient(SUPA_URL, SUPA_SERVICE);

// ── helpers ───────────────────────────────────────────────────────────────────
function ok(msg: string)   { console.log(`  ✅ ${msg}`); }
function warn(msg: string) { console.log(`  ⚠️  ${msg}`); }
function fail(msg: string) { console.error(`  ❌ ${msg}`); }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── state for cleanup ─────────────────────────────────────────────────────────
let pledgeId: string | null = null;
let piId:     string | null = null;
let origProjectState: Record<string, unknown> | null = null;

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🧪  PayNow refund smoke test\n');

  // Step 1: Snapshot original project state
  console.log('Step 1: Snapshotting original project state…');
  const { data: proj, error: projErr } = await db
    .from('projects')
    .select('status, deadline, start_date, amount_pledged_sgd, funding_goal_sgd')
    .eq('id', PROJECT_ID)
    .single();
  if (projErr || !proj) throw new Error(`Can't read project: ${projErr?.message}`);
  origProjectState = proj as Record<string, unknown>;
  ok(`Snapshotted (status=${proj.status})`);

  // Step 2: Create a captured Stripe PaymentIntent using a test card
  console.log('\nStep 2: Creating + capturing Stripe test PaymentIntent…');
  const pi = await stripe.paymentIntents.create({
    amount: 500,   // SGD $5.00
    currency: 'sgd',
    payment_method_types: ['card'],
    payment_method: 'pm_card_visa',
    confirm: true,
    return_url: 'https://example.com',
  });
  piId = pi.id;
  ok(`PaymentIntent created: ${piId} (status=${pi.status})`);

  // Ensure it's succeeded (capture if needed)
  if (pi.status !== 'succeeded') {
    try {
      await stripe.paymentIntents.capture(piId);
      ok('Captured');
    } catch (e) {
      warn(`capture: ${(e as Error).message}`);
    }
  }

  // Step 3: Seed a paynow_captured pledge
  console.log('\nStep 3: Seeding paynow_captured pledge…');
  const { data: profiles } = await db.from('profiles').select('id').limit(1);
  if (!profiles?.length) throw new Error('No profiles in DB');
  const backerId = profiles[0].id;

  const { data: inserted, error: insertErr } = await db
    .from('pledges')
    .insert({
      project_id:               PROJECT_ID,
      backer_id:                backerId,
      amount_sgd:               5,
      payment_method:           'paynow',
      status:                   'paynow_captured',
      stripe_payment_intent_id: piId,
    })
    .select('id')
    .single();
  if (insertErr || !inserted) throw new Error(`Insert pledge failed: ${insertErr?.message}`);
  pledgeId = inserted.id;
  ok(`Pledge seeded: ${pledgeId}`);

  // Step 4: Set project to active + past deadline + below goal
  // The DB has CHECK (deadline > COALESCE(start_date, now())).
  // We satisfy it by setting start_date to 3 days ago and deadline to 2 hours ago.
  console.log('\nStep 4: Setting project to active, past deadline, below goal…');
  const startDate   = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
  const pastDeadline = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();     // 2 hours ago
  const { error: updateErr } = await db
    .from('projects')
    .update({
      status:              'active',
      start_date:          startDate,
      deadline:            pastDeadline,
      funding_goal_sgd:    99999,
      amount_pledged_sgd:  5,
    })
    .eq('id', PROJECT_ID);
  if (updateErr) throw new Error(`Update project failed: ${updateErr.message}`);
  ok(`deadline=${pastDeadline.slice(0, 19)}Z, goal=99999, pledged=5`);

  // Step 5: Run the cron handler directly (bypasses HTTP / auth)
  console.log('\nStep 5: Running close-campaigns cron handler…');
  process.env.CRON_SECRET = 'smoke-test';
  // Dynamic import so the module picks up the env vars we just set
  const { GET } = await import('@/app/api/cron/close-campaigns/route');
  const cronReq = new Request('http://localhost/api/cron/close-campaigns', {
    headers: { Authorization: 'Bearer smoke-test' },
  });
  const cronRes = await GET(cronReq);
  const cronJson = await cronRes.json();
  if (cronRes.status !== 200) throw new Error(`Cron returned ${cronRes.status}: ${JSON.stringify(cronJson)}`);
  ok(`Cron 200 OK → ${JSON.stringify(cronJson)}`);

  // Step 6: Wait a moment for webhook (only needed if stripe CLI is forwarding)
  console.log('\nStep 6: Pausing 5 s for charge.refunded webhook (if Stripe CLI is running)…');
  await sleep(5000);

  // Step 7: Verify
  console.log('\nStep 7: Verifying results…');
  let allPassed = true;

  // Project status
  const { data: projAfter } = await db
    .from('projects').select('status').eq('id', PROJECT_ID).single();
  if (projAfter?.status === 'failed') {
    ok(`Project status → 'failed'`);
  } else {
    fail(`Project status = '${projAfter?.status}', expected 'failed'`);
    allPassed = false;
  }

  // Stripe refund
  const refunds = await stripe.refunds.list({ payment_intent: piId!, limit: 5 });
  if (refunds.data.length > 0) {
    ok(`Stripe refund created: ${refunds.data[0].id} (status=${refunds.data[0].status})`);
  } else {
    fail('No refund found on Stripe PI — stripe.refunds.create was not called');
    allPassed = false;
  }

  // Pledge status (may still be paynow_captured if webhook isn't forwarding locally)
  const { data: pledgeAfter } = await db
    .from('pledges').select('status').eq('id', pledgeId!).single();
  if (pledgeAfter?.status === 'refunded') {
    ok(`Pledge status → 'refunded' (webhook fired)`);
  } else {
    warn(
      `Pledge status = '${pledgeAfter?.status}' — the charge.refunded webhook\n` +
      `     writes this field; it only fires when Stripe CLI is forwarding events.\n` +
      `     Cron + Stripe refund both passed, so the core flow works.`,
    );
  }

  if (allPassed) {
    console.log('\n🎉  All critical checks passed.\n');
  } else {
    console.log('\n💥  Some checks failed — see ❌ lines above.\n');
    process.exitCode = 1;
  }
}

// ── cleanup ───────────────────────────────────────────────────────────────────
async function cleanup() {
  console.log('\n🧹  Cleaning up test data…');
  if (pledgeId) {
    const { error } = await db.from('pledges').delete().eq('id', pledgeId);
    if (error) warn(`Delete pledge: ${error.message}`);
    else ok(`Pledge ${pledgeId} deleted`);
  }
  if (origProjectState) {
    const { error } = await db.from('projects').update(origProjectState).eq('id', PROJECT_ID);
    if (error) warn(`Restore project: ${error.message}`);
    else ok(`Project restored (status=${origProjectState.status})`);
  }
}

main()
  .catch(e => { fail(String(e)); process.exitCode = 1; })
  .finally(() => cleanup().catch(console.error));
