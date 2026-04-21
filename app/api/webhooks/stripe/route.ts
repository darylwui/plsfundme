import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe/webhooks";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  sendCampaignFundedEmail,
  sendCampaignFailedEmail,
  sendPledgeConfirmedEmail,
  sendPledgeRefundedEmail,
} from "@/lib/email/templates";

export async function POST(request: Request) {
  const stripe = getStripe();
  let event;
  try {
    event = await verifyWebhookSignature(request);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Idempotency guard. Stripe retries failed deliveries; without this the
  // pledge totals would get incremented multiple times for a single payment.
  const { error: dedupeError } = await supabase
    .from("processed_stripe_events")
    .insert({ event_id: event.id, event_type: event.type });

  if (dedupeError) {
    // 23505 = unique_violation → this event was already handled. Ack so
    // Stripe stops retrying. Any other error: surface 500 so Stripe retries.
    if ((dedupeError as { code?: string }).code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Failed to record Stripe event for dedup:", dedupeError);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  switch (event.type) {
    case "setup_intent.succeeded": {
      const si = event.data.object;
      // Save payment method ID to pledge so we can capture later
      await supabase
        .from("pledges")
        .update({
          stripe_payment_method_id: si.payment_method as string,
          status: "authorized",
        })
        .eq("stripe_setup_intent_id", si.id);

      // Update pledge totals
      const { data: pledge } = await supabase
        .from("pledges")
        .select("project_id, amount_sgd")
        .eq("stripe_setup_intent_id", si.id)
        .single();

      if (pledge) {
        await supabase.rpc("increment_pledge_totals", {
          p_project_id: pledge.project_id,
          p_amount_sgd: pledge.amount_sgd,
        });
        await supabase.rpc("check_stretch_goals", {
          p_project_id: pledge.project_id,
        });
        // Claim reward slot if applicable
        const { data: fullPledge } = await supabase
          .from("pledges")
          .select("reward_id")
          .eq("stripe_setup_intent_id", si.id)
          .single();
        if (fullPledge?.reward_id) {
          await supabase.rpc("claim_reward_slot", {
            p_reward_id: fullPledge.reward_id,
          });
        }
      }
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const newStatus =
        pi.payment_method_types?.[0] === "paynow" ? "paynow_captured" : "captured";

      await supabase
        .from("pledges")
        .update({ status: newStatus })
        .eq("stripe_payment_intent_id", pi.id);

      // Update totals for PayNow (card captures already counted at setup_intent.succeeded)
      if (newStatus === "paynow_captured") {
        const { data: pledge } = await supabase
          .from("pledges")
          .select("project_id, amount_sgd, reward_id")
          .eq("stripe_payment_intent_id", pi.id)
          .single();

        if (pledge) {
          await supabase.rpc("increment_pledge_totals", {
            p_project_id: pledge.project_id,
            p_amount_sgd: pledge.amount_sgd,
          });
          await supabase.rpc("check_stretch_goals", {
            p_project_id: pledge.project_id,
          });
          if (pledge.reward_id) {
            await supabase.rpc("claim_reward_slot", {
              p_reward_id: pledge.reward_id,
            });
          }
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      await supabase
        .from("pledges")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", pi.id);
      break;
    }

    case "payment_intent.canceled": {
      const pi = event.data.object;
      const { data: pledge } = await supabase
        .from("pledges")
        .select("project_id, amount_sgd, reward_id, status")
        .eq("stripe_payment_intent_id", pi.id)
        .single();

      if (pledge && pledge.status === "paynow_captured") {
        // Refund path — totals will be decremented via charge.refunded
      }

      await supabase
        .from("pledges")
        .update({ status: "released" })
        .eq("stripe_payment_intent_id", pi.id);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      const pi = typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;

      if (pi) {
        const { data: pledge } = await supabase
          .from("pledges")
          .select("project_id, amount_sgd, reward_id, backer:profiles!backer_id(display_name, id)")
          .eq("stripe_payment_intent_id", pi)
          .single();

        if (pledge) {
          await supabase
            .from("pledges")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", pi);

          await supabase.rpc("decrement_pledge_totals", {
            p_project_id: (pledge as any).project_id,
            p_amount_sgd: (pledge as any).amount_sgd,
          });

          if ((pledge as any).reward_id) {
            await supabase.rpc("release_reward_slot", {
              p_reward_id: (pledge as any).reward_id,
            });
          }

          // Email backer — refund notification
          const backer = (pledge as any).backer;
          if (backer) {
            const { data: backerAuth } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", backer.id)
              .single();
            // Get email from auth.users via service role
            const { data: { user } } = await supabase.auth.admin.getUserById(backer.id);
            const { data: project } = await supabase
              .from("projects")
              .select("title")
              .eq("id", (pledge as any).project_id)
              .single();
            if (user?.email && project) {
              await sendPledgeRefundedEmail({
                backerEmail: user.email,
                backerName: backer.display_name,
                projectTitle: (project as any).title,
                amount: (pledge as any).amount_sgd,
              }).catch(console.error);
            }
          }
        }
      }
      break;
    }

    // Campaign funded — triggered by process_expired_campaigns cron via project status update
    case "transfer.created": {
      // Payout to creator's Connect account — record in payouts table
      const transfer = event.data.object;
      const projectId = transfer.metadata?.project_id;
      if (projectId) {
        const { data: project } = await supabase
          .from("projects")
          .select("creator_id, title, amount_pledged_sgd, funding_goal_sgd")
          .eq("id", projectId)
          .single();
        if (project) {
          const { data: { user } } = await supabase.auth.admin.getUserById((project as any).creator_id);
          const { data: creatorProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", (project as any).creator_id)
            .single();
          if (user?.email && creatorProfile) {
            await sendCampaignFundedEmail({
              creatorEmail: user.email,
              creatorName: (creatorProfile as any).display_name,
              projectTitle: (project as any).title,
              projectSlug: "",
              amountRaised: (project as any).amount_pledged_sgd,
              backerCount: 0,
            }).catch(console.error);
          }
        }
      }
      break;
    }

    default:
      // Unhandled event — log and return 200 to avoid Stripe retries
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
