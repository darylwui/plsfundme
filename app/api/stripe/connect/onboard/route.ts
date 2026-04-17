import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export async function POST() {
  const stripe = getStripe();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("stripe_account_id, display_name")
    .eq("id", user.id)
    .single();

  let accountId = profile?.stripe_account_id;

  // Create Stripe Connect Express account if not exists
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "SG",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: profile?.display_name ?? undefined,
      },
      metadata: { supabase_user_id: user.id },
    });

    accountId = account.id;
    await serviceClient
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  // Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payouts?refresh=1`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payouts?connected=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
