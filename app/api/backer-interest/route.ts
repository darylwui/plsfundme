import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { FROM, getResend } from "@/lib/email/resend";
import { renderBackerInterestEmail } from "@/lib/email/backer-interest-emails";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  maybeSweep();
  const rl = rateLimit(req, "backer-interest", { windowMs: 60_000, max: 3 });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: { email?: unknown; referrer?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const referrer = typeof body.referrer === "string" ? body.referrer : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const service = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (service as any)
    .from("backer_interest")
    .upsert({ email, referrer }, { onConflict: "email" });

  if (insertError) {
    console.error("[backer-interest] insert failed:", insertError);
    return NextResponse.json(
      { error: "Could not save your interest. Try again in a minute." },
      { status: 500 },
    );
  }

  try {
    const html = await renderBackerInterestEmail({ email });
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: "You're on the list — get that bread",
      html,
    });
  } catch (err) {
    console.warn("[backer-interest] confirmation email failed", err);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
