import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { captureProjectPledges } from "@/app/api/payments/capture/route";

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  const serviceClient = createServiceClient();

  // Fetch all active projects past their deadline
  const { data: expiredProjects, error: projectsError } = await serviceClient
    .from("projects")
    .select("id, amount_pledged_sgd, funding_goal_sgd")
    .eq("status", "active")
    .is("deleted_at", null)
    .lt("deadline", new Date().toISOString());

  if (projectsError) {
    console.error("Failed to fetch expired projects:", projectsError);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }

  const funded: string[] = [];
  const failedProjects: string[] = [];

  for (const project of expiredProjects ?? []) {
    const goalMet = project.amount_pledged_sgd >= project.funding_goal_sgd;

    if (goalMet) {
      // Mark project as funded
      const { error: updateError } = await serviceClient
        .from("projects")
        .update({ status: "funded", funded_at: new Date().toISOString() })
        .eq("id", project.id);

      if (updateError) {
        console.error(`Failed to mark project ${project.id} as funded:`, updateError);
        continue;
      }

      // Capture all authorized pledges directly
      try {
        const { captured, failed } = await captureProjectPledges(
          project.id,
          serviceClient
        );
        console.log(
          `Project ${project.id} funded: captured=${captured}, failed=${failed}`
        );
        funded.push(project.id);
      } catch (err) {
        console.error(`Failed to capture pledges for project ${project.id}:`, err);
        // Project is already marked funded; capture errors are logged per-pledge above
        funded.push(project.id);
      }
    } else {
      // Mark project as failed
      const { error: updateError } = await serviceClient
        .from("projects")
        .update({ status: "failed", failed_at: new Date().toISOString() })
        .eq("id", project.id);

      if (updateError) {
        console.error(`Failed to mark project ${project.id} as failed:`, updateError);
        continue;
      }

      // Cancel all authorized pledges and release funds back to backers
      const { data: pledges, error: pledgesError } = await serviceClient
        .from("pledges")
        .select("id, stripe_payment_intent_id")
        .eq("project_id", project.id)
        .eq("status", "authorized");

      if (pledgesError) {
        console.error(
          `Failed to fetch pledges for failed project ${project.id}:`,
          pledgesError
        );
        failedProjects.push(project.id);
        continue;
      }

      for (const pledge of pledges ?? []) {
        if (!pledge.stripe_payment_intent_id) {
          await serviceClient
            .from("pledges")
            .update({ status: "released" })
            .eq("id", pledge.id);
          continue;
        }

        try {
          await stripe.paymentIntents.cancel(pledge.stripe_payment_intent_id);

          await serviceClient
            .from("pledges")
            .update({ status: "released" })
            .eq("id", pledge.id);
        } catch (err) {
          console.error(
            `Failed to cancel payment intent for pledge ${pledge.id} (intent ${pledge.stripe_payment_intent_id}):`,
            err
          );
          // Leave pledge status as-is; will need manual resolution
        }
      }

      failedProjects.push(project.id);
    }
  }

  return NextResponse.json({ funded, failed: failedProjects });
}
