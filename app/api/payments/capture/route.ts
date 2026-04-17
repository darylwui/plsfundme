import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Capture all authorized pledges for a project.
 * Accepts an optional pre-created service client to avoid creating a new one
 * when called from the cron job.
 */
export async function captureProjectPledges(
  project_id: string,
  serviceClient: SupabaseClient<Database>
): Promise<{ captured: number; failed: number }> {
  const stripe = getStripe();

  const { data: pledges, error: fetchError } = await serviceClient
    .from("pledges")
    .select("id, stripe_payment_intent_id")
    .eq("project_id", project_id)
    .eq("status", "authorized");

  if (fetchError) {
    throw new Error(`Failed to fetch pledges: ${fetchError.message}`);
  }

  let captured = 0;
  let failed = 0;

  for (const pledge of pledges ?? []) {
    if (!pledge.stripe_payment_intent_id) {
      await serviceClient
        .from("pledges")
        .update({ status: "failed" })
        .eq("id", pledge.id);
      failed++;
      continue;
    }

    try {
      await stripe.paymentIntents.capture(pledge.stripe_payment_intent_id);

      const { error: updateError } = await serviceClient
        .from("pledges")
        .update({ status: "captured" })
        .eq("id", pledge.id);

      if (updateError) {
        console.error(
          `Failed to update pledge ${pledge.id} to captured:`,
          updateError
        );
        failed++;
      } else {
        captured++;
      }
    } catch (err) {
      console.error(
        `Stripe capture failed for pledge ${pledge.id} (intent ${pledge.stripe_payment_intent_id}):`,
        err
      );

      await serviceClient
        .from("pledges")
        .update({ status: "failed" })
        .eq("id", pledge.id);

      failed++;
    }
  }

  return { captured, failed };
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify authenticated admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let project_id: string;
  try {
    const body = await request.json();
    project_id = body.project_id;
    if (!project_id || typeof project_id !== "string") {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const serviceClient = createServiceClient();
    const result = await captureProjectPledges(project_id, serviceClient);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Capture error:", err);
    return NextResponse.json(
      { error: "Failed to process captures" },
      { status: 500 }
    );
  }
}
