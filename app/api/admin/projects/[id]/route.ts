import { NextResponse } from "next/server";
import { revalidatePath, updateTag } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import {
  sendProjectApprovedEmail,
  sendProjectRejectedEmail,
  sendProjectRemovedEmail,
} from "@/lib/email/templates";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Flush every cached surface that depends on the active-project list.
 * Called after any admin status change (approve / reject / remove /
 * revert_to_draft) so /explore, the homepage discovery section, and the
 * project detail page reflect the new state immediately instead of
 * waiting up to 60s for unstable_cache to revalidate.
 */
function invalidateProjectCaches(slug: string) {
  // Next 16 split the cache invalidation API:
  //   - updateTag(tag) — purges a tag's cached entries immediately
  //   - revalidateTag(tag, profile) — schedules revalidation against a
  //     CacheLifeConfig profile (we don't use profiles, so updateTag fits)
  //
  // Tags used by unstable_cache wrappers in app/(marketing)/page.tsx
  updateTag("projects-trending");
  updateTag("projects-newest");
  updateTag("projects-ending_soon");
  updateTag("platform-stats");

  // Path-level invalidations for routes that aren't tag-cached
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/projects/${slug}`);
}

/** Verify the caller is an admin */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}

// PATCH — approve | reject | remove
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, reasonCode, message, reason } = await request.json() as { action: string; reasonCode?: string; message?: string; reason?: string };

  const service = createServiceClient();

  // Fetch the project + creator for email notification
  const { data: project } = await service
    .from("projects")
    .select("id, title, slug, creator_id, status")
    .eq("id", id)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (action === "approve") {
    const { error } = await service
      .from("projects")
      .update({ status: "active" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    invalidateProjectCaches(project.slug);

    // Email the creator
    const { data: approveAuthData } = await service.auth.admin.getUserById(project.creator_id);
    const { data: approveProfile } = await service.from("profiles").select("display_name").eq("id", project.creator_id).single();
    if (approveAuthData?.user?.email && approveProfile) {
      await sendProjectApprovedEmail({
        creatorEmail: approveAuthData.user.email,
        creatorName: (approveProfile as any).display_name,
        projectTitle: project.title,
        projectSlug: project.slug,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    if (!reasonCode?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Reason category and message are required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (service as any)
      .from("projects")
      .update({
        status: "cancelled",
        rejection_reason_code: reasonCode.trim(),
        rejection_reason: message.trim(),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    invalidateProjectCaches(project.slug);

    const { data: rejectAuthData } = await service.auth.admin.getUserById(project.creator_id);
    const { data: rejectProfile } = await service.from("profiles").select("display_name").eq("id", project.creator_id).single();
    if (rejectAuthData?.user?.email && rejectProfile) {
      await sendProjectRejectedEmail({
        creatorEmail: rejectAuthData.user.email,
        creatorName: (rejectProfile as any).display_name,
        projectTitle: project.title,
        reasonCode: reasonCode.trim(),
        message: message.trim(),
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    if (!reason?.trim()) return NextResponse.json({ error: "Reason is required" }, { status: 400 });

    const { error } = await service
      .from("projects")
      .update({ status: "removed" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    invalidateProjectCaches(project.slug);

    const { data: removeAuthData } = await service.auth.admin.getUserById(project.creator_id);
    const { data: removeProfile } = await service.from("profiles").select("display_name").eq("id", project.creator_id).single();
    if (removeAuthData?.user?.email && removeProfile) {
      await sendProjectRemovedEmail({
        creatorEmail: removeAuthData.user.email,
        creatorName: (removeProfile as any).display_name,
        projectTitle: project.title,
        reason: reason,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "revert_to_draft") {
    // Going back to draft un-publishes the campaign and makes it editable
    // again. Used for cleaning up test data and shelving campaigns we want
    // to relaunch later. Skip the creator email — typical use is admin
    // staging cleanup, not creator-facing moderation.
    //
    // Safety: refuse if any pledges hold real money. Allowing revert in
    // that case would let a creator silently edit a campaign that backers
    // have already pledged to.
    const { count, error: pledgeErr } = await service
      .from("pledges")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id)
      .in("status", ["authorized", "captured", "paynow_captured"]);

    if (pledgeErr) return NextResponse.json({ error: pledgeErr.message }, { status: 500 });
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Can't revert — ${count} pledge${count === 1 ? "" : "s"} still hold money. Refund or release them first.`,
        },
        { status: 409 },
      );
    }

    const { error } = await service
      .from("projects")
      .update({ status: "draft" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    invalidateProjectCaches(project.slug);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE — hard delete
//
// Default mode: refuses when any active pledge (authorized / captured) exists.
// Use this for campaigns that never drew real money.
//
// Force mode (?force=true): reverses Stripe state for every pledge
// (cancels authorized holds, refunds captured charges), reverses any
// processed payouts, and then hard-deletes the project. Built for wiping
// test campaigns; in production, only use after the creator has agreed
// to cancel a live campaign and the Stripe connected account holds enough
// balance to absorb the refunds.
export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";

  const service = createServiceClient();

  if (!force) {
    // Safety check: no active pledges
    const { count } = await service
      .from("pledges")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id)
      .in("status", ["authorized", "paynow_captured", "captured"]);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a project with active pledges. Use Remove (ToS) or call this endpoint with ?force=true to refund and wipe.",
        },
        { status: 400 }
      );
    }
  } else {
    // Force mode: reverse all Stripe state, then cascade-wipe child rows.
    const stripe = getStripe();

    const { data: pledges, error: pledgesErr } = await service
      .from("pledges")
      .select("id, status, stripe_payment_intent_id")
      .eq("project_id", id);

    if (pledgesErr) {
      return NextResponse.json({ error: pledgesErr.message }, { status: 500 });
    }

    const stripeErrors: string[] = [];

    // Cap parallelism to stay well under Stripe's 100 req/sec rate limit
    // while still cutting wall-clock time by ~8x vs the prior serial loop.
    const STRIPE_CONCURRENCY = 8;
    async function runBatched<T>(items: T[], fn: (item: T) => Promise<void>) {
      for (let i = 0; i < items.length; i += STRIPE_CONCURRENCY) {
        await Promise.all(items.slice(i, i + STRIPE_CONCURRENCY).map(fn));
      }
    }

    await runBatched(pledges ?? [], async (pledge) => {
      if (!pledge.stripe_payment_intent_id) return;

      try {
        if (pledge.status === "authorized" || pledge.status === "pending") {
          // Card hold — cancel releases the hold, no money moved
          await stripe.paymentIntents.cancel(pledge.stripe_payment_intent_id);
        } else if (
          pledge.status === "captured" ||
          pledge.status === "paynow_captured"
        ) {
          // Funds already moved — issue a refund back to the backer
          await stripe.refunds.create({
            payment_intent: pledge.stripe_payment_intent_id,
          });
        }
        // released / refunded / failed — nothing to do on Stripe
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[force-delete ${id}] Stripe reversal failed for pledge ${pledge.id} (intent ${pledge.stripe_payment_intent_id}):`,
          err
        );
        stripeErrors.push(`pledge ${pledge.id}: ${msg}`);
      }
    });

    // Reverse any processed payouts (Stripe Connect transfers).
    const { data: payouts, error: payoutsErr } = await service
      .from("payouts")
      .select("id, status, stripe_transfer_id")
      .eq("project_id", id);

    if (payoutsErr) {
      return NextResponse.json({ error: payoutsErr.message }, { status: 500 });
    }

    await runBatched(payouts ?? [], async (payout) => {
      if (payout.status !== "paid" || !payout.stripe_transfer_id) return;
      try {
        await stripe.transfers.createReversal(payout.stripe_transfer_id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[force-delete ${id}] Stripe transfer reversal failed for payout ${payout.id} (transfer ${payout.stripe_transfer_id}):`,
          err
        );
        stripeErrors.push(`payout ${payout.id}: ${msg}`);
      }
    });

    // Pledges and payouts have ON DELETE RESTRICT, so explicitly delete them
    // before the project row. Rewards / stretch_goals / project_updates /
    // project_feedback have ON DELETE CASCADE and clean themselves up.
    const { error: pledgesDeleteErr } = await service
      .from("pledges")
      .delete()
      .eq("project_id", id);
    if (pledgesDeleteErr) {
      return NextResponse.json(
        { error: `Failed to delete pledges: ${pledgesDeleteErr.message}`, stripeErrors },
        { status: 500 }
      );
    }

    const { error: payoutsDeleteErr } = await service
      .from("payouts")
      .delete()
      .eq("project_id", id);
    if (payoutsDeleteErr) {
      return NextResponse.json(
        { error: `Failed to delete payouts: ${payoutsDeleteErr.message}`, stripeErrors },
        { status: 500 }
      );
    }

    const { error: projectDeleteErr } = await service
      .from("projects")
      .delete()
      .eq("id", id);
    if (projectDeleteErr) {
      return NextResponse.json(
        { error: projectDeleteErr.message, stripeErrors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      forced: true,
      pledgesReversed: pledges?.length ?? 0,
      payoutsReversed: payouts?.length ?? 0,
      stripeErrors,
    });
  }

  // Non-force path: child rows clear themselves via cascade, project goes last.
  await service.from("rewards").delete().eq("project_id", id);
  await service.from("stretch_goals").delete().eq("project_id", id);
  await service.from("project_updates").delete().eq("project_id", id);

  const { error } = await service.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
