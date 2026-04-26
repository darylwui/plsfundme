import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, FROM, getResend } from "@/lib/email/resend";
import { renderDisputeConcernAdminEmail } from "@/lib/email/dispute-concern-emails";

interface SubmitBody {
  pledgeId?: unknown;
  milestoneNumber?: unknown;
  message?: unknown;
}

const MIN_LEN = 10;
const MAX_LEN = 2000;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to file a concern." }, { status: 401 });
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const pledgeId = typeof body.pledgeId === "string" ? body.pledgeId : null;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const milestoneNumber =
    body.milestoneNumber === null || body.milestoneNumber === undefined
      ? null
      : typeof body.milestoneNumber === "number"
        ? body.milestoneNumber
        : NaN;

  if (!pledgeId) {
    return NextResponse.json({ error: "Missing pledge reference." }, { status: 400 });
  }
  if (message.length < MIN_LEN || message.length > MAX_LEN) {
    return NextResponse.json(
      { error: `Message must be between ${MIN_LEN} and ${MAX_LEN} characters.` },
      { status: 400 },
    );
  }
  if (milestoneNumber !== null && ![1, 2, 3].includes(milestoneNumber)) {
    return NextResponse.json({ error: "Milestone must be 1, 2, or 3." }, { status: 400 });
  }

  // Verify the pledge belongs to this user before insert. RLS would reject
  // an insert for a foreign pledge anyway, but this gives us a clean error
  // and the project_id we need for the row.
  const { data: pledge, error: pledgeError } = await supabase
    .from("pledges")
    .select("id, project_id, backer_id, project:projects(title, slug)")
    .eq("id", pledgeId)
    .eq("backer_id", user.id)
    .maybeSingle();

  if (pledgeError) {
    return NextResponse.json({ error: "Could not verify pledge." }, { status: 500 });
  }
  if (!pledge) {
    return NextResponse.json({ error: "Pledge not found." }, { status: 404 });
  }

  const project = pledge.project as unknown as { title: string; slug: string } | null;
  if (!project) {
    return NextResponse.json({ error: "Pledge is missing project context." }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("dispute_concerns")
    .insert({
      pledge_id: pledge.id,
      project_id: pledge.project_id,
      backer_id: user.id,
      milestone_number: milestoneNumber,
      message,
    })
    .select("id, created_at")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not file concern." },
      { status: 500 },
    );
  }

  // Best-effort admin notification. Failure here doesn't fail the request —
  // the row is the source of truth and the admin can be re-notified later.
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const html = renderDisputeConcernAdminEmail({
      concernId: inserted.id,
      pledgeId: pledge.id,
      projectTitle: project.title,
      projectSlug: project.slug,
      backerEmail: user.email ?? "(no email on file)",
      backerDisplayName: profile?.display_name ?? "Unknown backer",
      milestoneNumber,
      message,
      createdAt: inserted.created_at,
    });

    const subjectScope = milestoneNumber ? `M${milestoneNumber}` : "whole campaign";
    await getResend().emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: user.email ?? undefined,
      subject: `[Concern] ${project.title} — ${subjectScope}`,
      html,
    });
  } catch (err) {
    console.warn("dispute-concern admin email failed", err);
  }

  return NextResponse.json({ success: true, concernId: inserted.id }, { status: 201 });
}
