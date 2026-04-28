import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { FROM, getResend } from "@/lib/email/resend";
import { renderInternationalInterestEmail } from "@/lib/email/international-interest-emails";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface SubmitBody {
  email?: unknown;
  displayName?: unknown;
  country?: unknown;
  projectDescription?: unknown;
  referrer?: unknown;
}

const MIN_DESC_LEN = 0; // optional field
const MAX_DESC_LEN = 1000;
const MAX_NAME_LEN = 100;
const MAX_COUNTRY_LEN = 60;

// Basic email shape check — Supabase will catch malformed emails too,
// this is just a fast-fail before the DB write.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  // Public, no-auth POST — without a rate limit anyone can script tens
  // of thousands of fake submissions and bury real signal. 3/min/IP
  // matches the bug-reports pattern; legitimate users only hit this
  // once.
  maybeSweep();
  const rl = rateLimit(req, "international-interest", { windowMs: 60_000, max: 3 });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "";
  const projectDescription =
    typeof body.projectDescription === "string"
      ? body.projectDescription.trim()
      : "";
  const referrer = typeof body.referrer === "string" ? body.referrer : null;

  // ── Validation ──────────────────────────────────────────────────
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!displayName || displayName.length > MAX_NAME_LEN) {
    return NextResponse.json(
      { error: `Name is required (max ${MAX_NAME_LEN} characters).` },
      { status: 400 },
    );
  }
  if (!country || country.length < 2 || country.length > MAX_COUNTRY_LEN) {
    return NextResponse.json(
      { error: "Tell us which country you're based in." },
      { status: 400 },
    );
  }
  if (projectDescription && projectDescription.length > MAX_DESC_LEN) {
    return NextResponse.json(
      { error: `Project description must be under ${MAX_DESC_LEN} characters.` },
      { status: 400 },
    );
  }

  // ── Insert (idempotent on email) ────────────────────────────────
  // Service-role client so we don't need a logged-in user (the form
  // is open to anyone). RLS is on the table but service role bypasses.
  const service = createServiceClient();

  // Upsert: if the same email signs up twice (different country guess,
  // refreshed page, etc.), we update their record rather than 409. The
  // `email` column is UNIQUE so a plain insert would fail.
  //
  // Cast to any: this table is added in migration 026; the generated
  // database.types.ts will include it on the next regen. Matches the
  // pattern used by other routes that touch newly-added tables.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (service as any)
    .from("international_creator_interest")
    .upsert(
      {
        email,
        display_name: displayName,
        country,
        project_description: projectDescription || null,
        referrer,
      },
      { onConflict: "email" },
    );

  if (insertError) {
    console.error("[international-interest] insert failed:", insertError);
    return NextResponse.json(
      { error: "Could not save your interest. Try again in a minute." },
      { status: 500 },
    );
  }

  // ── Confirmation email (best-effort) ────────────────────────────
  // If the email send fails we still return success — the row is in
  // the DB, an admin can re-contact manually. Don't block the user
  // on transient Resend hiccups.
  try {
    const html = await renderInternationalInterestEmail({
      displayName,
      country,
    });

    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: "You're on the list — get that bread",
      html,
    });
  } catch (err) {
    console.warn("[international-interest] confirmation email failed", err);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
