import { NextRequest, NextResponse } from "next/server";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { ADMIN_EMAIL, FROM, getResend } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  maybeSweep();
  const rl = rateLimit(req, "bug-reports", { windowMs: 60_000, max: 3 });
  if (!rl.ok) return rateLimitResponse(rl);

  let url: string | undefined;
  let desc: string | undefined;
  let email: string | undefined;

  try {
    const body = await req.json();
    url = typeof body.url === "string" ? body.url.slice(0, 500) : undefined;
    desc = typeof body.desc === "string" ? body.desc.trim().slice(0, 500) : undefined;
    email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!desc || desc.length < 5) {
    return NextResponse.json({ error: "Please describe what happened." }, { status: 400 });
  }

  try {
    await getResend().emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: email || undefined,
      subject: `[Bug Report] 404 on ${url ?? "unknown page"}`,
      html: `
        <h2>404 Bug Report</h2>
        <p><strong>Page:</strong> ${url ?? "unknown"}</p>
        <p><strong>Description:</strong><br/>${desc.replace(/\n/g, "<br/>")}</p>
        ${email ? `<p><strong>Reporter email:</strong> ${email}</p>` : "<p><em>No email provided</em></p>"}
      `,
    });
  } catch (err) {
    console.error("[bug-reports] email failed", err);
    return NextResponse.json({ error: "Failed to send report." }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
