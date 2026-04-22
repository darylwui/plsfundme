import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  maybeSweep();
  const rl = rateLimit(req, "creator-apply", { windowMs: 60_000, max: 5 });
  if (!rl.ok) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const {
      userId,
      bio,
      linkedin_url,
      company_name,
      company_website,
      project_type,
      project_description,
      id_document_url,
      photo_url,
    } = body;

    if (!userId || !bio || !project_type || !project_description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const service = createServiceClient();

    // Block re-submission if already approved or pending review
    const { data: existing } = await service
      .from("creator_profiles")
      .select("status")
      .eq("id", userId)
      .maybeSingle();

    if (existing?.status === "approved" || existing?.status === "pending_review") {
      return NextResponse.json({ error: "Application already submitted" }, { status: 400 });
    }

    // Update role (and avatar if a photo was uploaded)
    const { error: profileError } = await service
      .from("profiles")
      .update(
        photo_url
          ? { role: "creator", avatar_url: photo_url }
          : { role: "creator" }
      )
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Upsert PM profile — always reset to pending_review so rejected creators can re-apply
    const { error } = await service.from("creator_profiles").upsert({
      id: userId,
      bio,
      linkedin_url: linkedin_url || null,
      company_name: company_name || null,
      company_website: company_website || null,
      project_type,
      project_description,
      id_document_url: id_document_url || null,
      status: "pending_review",
      submitted_at: new Date().toISOString(),
      rejection_reason: null,
      reviewed_at: null,
      reviewed_by: null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
