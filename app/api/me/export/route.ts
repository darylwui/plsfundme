import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Self-service PDPA data-portability export.
 *
 * The PDPA gives users the right to access the personal data we hold
 * about them and to request a structured, machine-readable copy. This
 * endpoint fulfils both rights for the strictly self-owned subset of
 * data (i.e. data scoped to `auth.uid()`) without requiring the user
 * to email the DPO and wait for a manual fulfilment.
 *
 * Returns a single JSON document with one section per user-owned
 * relation. Sets `Content-Disposition: attachment` so browsers offer
 * a download rather than rendering inline.
 *
 * Things this endpoint deliberately does NOT include:
 * - Other users' personal data, even if it was visible to this user
 *   (e.g. backers of a creator's campaign — exporting that would let
 *   one user dump another user's data).
 * - Internal admin notes, milestone-approval audit trail, etc. —
 *   those belong to platform operations, not the user's own record.
 * - Stripe customer / payment-method tokens — these are pointers into
 *   Stripe's vault, not data we hold "about" the user in the PDPA
 *   sense.
 *
 * For data we cannot export here (records held by Creators, by
 * payment processors, etc.), Section 10 of the privacy policy
 * directs the user to email the DPO who will route the request to
 * the responsible party.
 */
export async function GET(request: Request) {
  // Modest rate limit — exports are expensive and a misbehaving
  // client could hammer the endpoint and inflate Supabase egress.
  // Real users only ever click this a handful of times.
  maybeSweep();
  const rl = rateLimit(request, "me-export", { windowMs: 60_000, max: 3 });
  if (!rl.ok) return rateLimitResponse(rl);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });
  }

  // Use service-role for the read fan-out so we don't fight RLS on
  // every table — auth has already enforced "this is the user's own
  // data," and we explicitly scope every query to user.id below.
  const service = createServiceClient();
  const userId = user.id;

  // Fan out reads in parallel — the export is one synchronous
  // response, so latency = max(individual queries).
  const [
    profileRes,
    creatorProfileRes,
    creatorVerificationRes,
    pledgesRes,
    campaignReportsRes,
    disputeConcernsRes,
    campaignDraftsRes,
    projectsRes,
    intlInterestRes,
  ] = await Promise.all([
    service.from("profiles").select("*").eq("id", userId).maybeSingle(),
    service.from("creator_profiles").select("*").eq("id", userId).maybeSingle(),
    service.from("creator_verifications").select("*").eq("profile_id", userId).maybeSingle(),
    service.from("pledges").select("*").eq("backer_id", userId).order("created_at", { ascending: true }),
    service.from("campaign_reports").select("*").eq("reporter_id", userId).order("created_at", { ascending: true }),
    service.from("dispute_concerns").select("*").eq("backer_id", userId).order("created_at", { ascending: true }),
    service.from("campaign_drafts").select("*").eq("user_id", userId).order("updated_at", { ascending: true }),
    service.from("projects").select("*").eq("creator_id", userId).is("deleted_at", null).order("created_at", { ascending: true }),
    // International-interest records are matched by email since the
    // form is open (no auth). Skip if no email on auth record.
    user.email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (service as any).from("international_creator_interest").select("*").eq("email", user.email.toLowerCase()).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Some of these tables may not exist in older preview branches; tolerate
  // 42P01 (undefined_table) by treating as "no rows". Anything else is a
  // genuine error worth surfacing.
  function safeRows<T>(res: { data: T | T[] | null; error?: { code?: string } | null }): T | T[] | null {
    if (res.error && res.error.code !== "42P01") {
      console.error("[me/export] read error", res.error);
    }
    return res.data;
  }

  const exportPayload = {
    export_metadata: {
      generated_at: new Date().toISOString(),
      user_id: userId,
      email: user.email ?? null,
      schema_version: 1,
      notes: [
        "This is a self-service PDPA data-portability export of personal data we hold about you.",
        "It includes only data scoped to your own user_id. Data held by Creators, payment processors,",
        "or other independent data controllers is not included — see Section 10 of /privacy.",
      ].join(" "),
    },
    profile: safeRows(profileRes),
    creator_profile: safeRows(creatorProfileRes),
    creator_verification: safeRows(creatorVerificationRes),
    pledges: safeRows(pledgesRes) ?? [],
    campaign_reports: safeRows(campaignReportsRes) ?? [],
    dispute_concerns: safeRows(disputeConcernsRes) ?? [],
    campaign_drafts: safeRows(campaignDraftsRes) ?? [],
    projects_as_creator: safeRows(projectsRes) ?? [],
    international_creator_interest: safeRows(intlInterestRes),
  };

  const filename = `getthatbread-data-export-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
  const body = JSON.stringify(exportPayload, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      // Treat the response as user-private — no caching anywhere.
      "cache-control": "private, no-store",
    },
  });
}
