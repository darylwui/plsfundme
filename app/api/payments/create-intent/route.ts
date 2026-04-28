import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe, toCents, calculateApplicationFee } from "@/lib/stripe/server";
import { createPledgeSchema } from "@/lib/validations/pledge";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  maybeSweep();
  const rl = rateLimit(request, "payments:create-intent", {
    windowMs: 60_000,
    max: 10,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  const stripe = getStripe();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPledgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { project_id, reward_id, amount_sgd, payment_method, is_anonymous, backer_note } =
    parsed.data;

  // Validate project is active
  const { data: project } = await supabase
    .from("projects")
    .select("id, status, deadline, funding_goal_sgd, creator_id")
    .eq("id", project_id)
    .single();

  if (!project || project.status !== "active" || new Date(project.deadline) <= new Date()) {
    return NextResponse.json(
      { error: "This project is not accepting pledges." },
      { status: 400 }
    );
  }

  // Validate reward if provided
  if (reward_id) {
    const { data: reward } = await supabase
      .from("rewards")
      .select("minimum_pledge_sgd, max_backers, claimed_count, is_active")
      .eq("id", reward_id)
      .eq("project_id", project_id)
      .single();

    if (!reward || !reward.is_active) {
      return NextResponse.json({ error: "Reward not available." }, { status: 400 });
    }
    if (amount_sgd < reward.minimum_pledge_sgd) {
      return NextResponse.json(
        { error: `Minimum pledge for this reward is S$${reward.minimum_pledge_sgd}.` },
        { status: 400 }
      );
    }
    if (reward.max_backers !== null && reward.claimed_count >= reward.max_backers) {
      return NextResponse.json({ error: "This reward tier is sold out." }, { status: 400 });
    }
  }

  const serviceClient = createServiceClient();

  // Get or create Stripe customer
  let stripeCustomerId: string | undefined;
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_customer_id) {
    stripeCustomerId = profile.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;
    await serviceClient
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", user.id);
  }

  const amountCents = toCents(amount_sgd);
  const platformFeeCents = calculateApplicationFee(amountCents);
  const platformFeeSgd = amount_sgd * 0.05;

  // Get creator's Stripe Connect account
  const { data: creatorProfile } = await serviceClient
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", project.creator_id)
    .single();

  if (payment_method === "paynow") {
    // PayNow: immediate capture
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: "sgd",
        payment_method_types: ["paynow"],
        customer: stripeCustomerId,
        metadata: {
          project_id,
          backer_id: user.id,
          reward_id: reward_id ?? "",
        },
        ...(creatorProfile?.stripe_account_id && {
          application_fee_amount: platformFeeCents,
          transfer_data: { destination: creatorProfile.stripe_account_id },
        }),
      },
      // Deterministic idempotency key — a fast double-click with the same
      // pledge values will reuse the same PaymentIntent rather than creating
      // duplicates. Date.now() previously produced a fresh key per request,
      // silently breaking Stripe's dedup guarantee.
      { idempotencyKey: `paynow-${user.id}-${project_id}-${reward_id ?? "none"}-${amountCents}` }
    );

    // Create pledge record
    const { data: pledge, error: pledgeError } = await serviceClient
      .from("pledges")
      .insert({
        project_id,
        backer_id: user.id,
        reward_id: reward_id ?? null,
        amount_sgd,
        platform_fee_sgd: platformFeeSgd,
        stripe_payment_intent_id: paymentIntent.id,
        payment_method: "paynow",
        status: "pending",
        is_anonymous,
        backer_note: backer_note ?? null,
      })
      .select()
      .single();

    if (pledgeError || !pledge) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      return NextResponse.json({ error: "Failed to create pledge." }, { status: 500 });
    }

    return NextResponse.json({
      pledge_id: pledge.id,
      client_secret: paymentIntent.client_secret,
      type: "payment_intent",
    });
  } else {
    // Card: SetupIntent (saves payment method for deferred capture)
    const setupIntent = await stripe.setupIntents.create(
      {
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        usage: "off_session",
        metadata: {
          project_id,
          backer_id: user.id,
          reward_id: reward_id ?? "",
          amount_sgd: String(amount_sgd),
        },
      },
      // Deterministic idempotency key — see paynow branch above.
      { idempotencyKey: `setup-${user.id}-${project_id}-${reward_id ?? "none"}-${amountCents}` }
    );

    // Create pledge record
    const { data: pledge, error: pledgeError } = await serviceClient
      .from("pledges")
      .insert({
        project_id,
        backer_id: user.id,
        reward_id: reward_id ?? null,
        amount_sgd,
        platform_fee_sgd: platformFeeSgd,
        stripe_setup_intent_id: setupIntent.id,
        payment_method: "card",
        status: "pending",
        is_anonymous,
        backer_note: backer_note ?? null,
      })
      .select()
      .single();

    if (pledgeError || !pledge) {
      await stripe.setupIntents.cancel(setupIntent.id);
      return NextResponse.json({ error: "Failed to create pledge." }, { status: 500 });
    }

    return NextResponse.json({
      pledge_id: pledge.id,
      client_secret: setupIntent.client_secret,
      type: "setup_intent",
    });
  }
}
