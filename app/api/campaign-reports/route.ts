import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, FROM, getResend } from "@/lib/email/resend";
import {
  categoryLabelFor,
  renderCampaignReportAdminEmail,
} from "@/lib/email/campaign-report-emails";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface SubmitBody {
  projectId?: unknown;
  category?: unknown;
  message?: unknown;
}

const MIN_LEN = 10;
const MAX_LEN = 2000;
const VALID_CATEGORIES = [
  "fraud",
  "ip_infringement",
  "illegal_regulated",
  "inappropriate",
  "other",
] as const;

type Category = (typeof VALID_CATEGORIES)[number];

function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (VALID_CATEGORIES as readonly string[]).includes(v);
}

export async function POST(req: NextRequest) {
  // Auth-required, but each call sends an admin email — without a
  // rate limit a compromised account could spam the inbox. 5/min/IP.
  maybeSweep();
  const rl = rateLimit(req, "campaign-reports", { windowMs: 60_000, max: 5 });
  if (!rl.ok) return rateLimitResponse(rl);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to report a campaign." }, { status: 401 });
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const projectId = typeof body.projectId === "string" ? body.projectId : null;
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "Missing project reference." }, { status: 400 });
  }
  if (!isCategory(body.category)) {
    return NextResponse.json({ error: "Pick a category." }, { status: 400 });
  }
  if (message.length < MIN_LEN || message.length > MAX_LEN) {
    return NextResponse.json(
      { error: `Message must be between ${MIN_LEN} and ${MAX_LEN} characters.` },
      { status: 400 },
    );
  }

  // Verify the project exists and pull title/slug/creator for the email +
  // the creator-self check.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, title, slug, creator_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: "Could not verify project." }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (project.creator_id === user.id) {
    return NextResponse.json(
      { error: "You can't report your own campaign." },
      { status: 400 },
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("campaign_reports")
    .insert({
      project_id: project.id,
      reporter_id: user.id,
      category: body.category,
      message,
    })
    .select("id, created_at")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not file report." },
      { status: 500 },
    );
  }

  // Best-effort admin notification. Failure here doesn't fail the request.
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const html = await renderCampaignReportAdminEmail({
      reportId: inserted.id,
      projectTitle: project.title,
      projectSlug: project.slug,
      reporterEmail: user.email ?? "(no email on file)",
      reporterDisplayName: profile?.display_name ?? "Unknown reporter",
      category: body.category,
      message,
      createdAt: inserted.created_at,
    });

    await getResend().emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: user.email ?? undefined,
      subject: `[Report] ${project.title} — ${categoryLabelFor(body.category)}`,
      html,
    });
  } catch (err) {
    console.warn("campaign-report admin email failed", err);
  }

  return NextResponse.json({ success: true, reportId: inserted.id }, { status: 201 });
}
