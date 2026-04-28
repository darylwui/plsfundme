import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendCreatorApplicationSubmittedEmail, sendAdminNewCreatorApplicationEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  maybeSweep();
  const rl = rateLimit(req, "creator-apply", { windowMs: 60_000, max: 5 });
  if (!rl.ok) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const {
      email,
      password,
      displayName,
      bio,
      linkedin_url,
      company_name,
      company_website,
      project_type,
      project_description,
      id_document_url,
      photo_url,
    } = body;

    if (!email || !password || !displayName || !bio || !project_type || !project_description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Only allow URLs pointing to our own Supabase storage to prevent
    // storing arbitrary external URLs (tracking pixels, competitor images, etc.)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    const storagePrefix = `${supabaseUrl}/storage/v1/object/public/`;
    for (const [field, value] of [["photo_url", photo_url], ["id_document_url", id_document_url]] as const) {
      if (value && !value.startsWith(storagePrefix)) {
        return NextResponse.json({ error: `${field} must be a Supabase storage URL` }, { status: 400 });
      }
    }

    const service = createServiceClient();

    // Look up existing user by email to avoid duplicates
    const { data: userList } = await service.auth.admin.listUsers();
    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      // Check if they already have a creator application in good standing
      const { data: existingCreator } = await service
        .from("creator_profiles")
        .select("status")
        .eq("id", existingUser.id)
        .maybeSingle();

      if (existingCreator?.status === "approved" || existingCreator?.status === "pending_review") {
        return NextResponse.json({ error: "An application with this email already exists. Please log in." }, { status: 400 });
      }

      // Allow re-apply for rejected/needs_info — update password and re-submit
      const { error: updateErr } = await service.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: { full_name: displayName.trim(), role: "creator" },
        email_confirm: true,
      });
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      userId = existingUser.id;
    } else {
      // Create user atomically via admin API with email auto-confirmed.
      // (Creators require admin approval anyway, so email confirmation is redundant.)
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName.trim(), role: "creator" },
      });
      if (createErr || !created?.user) {
        return NextResponse.json({ error: createErr?.message ?? "Failed to create user" }, { status: 500 });
      }
      userId = created.user.id;
    }

    // Ensure profile row exists (handle_new_user trigger should fire on email_confirm=true,
    // but upsert defensively so retries / edge cases work).
    const { error: profileErr } = await service.from("profiles").upsert(
      {
        id: userId,
        display_name: displayName.trim(),
        role: "creator",
        ...(photo_url ? { avatar_url: photo_url } : {}),
      },
      { onConflict: "id" }
    );
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // Upsert creator profile — always reset to pending_review so rejected creators can re-apply
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

    // Send emails (fire-and-forget, don't block response)
    sendCreatorApplicationSubmittedEmail({
      creatorEmail: email,
      creatorName: displayName.trim(),
    }).catch(console.error);
    sendAdminNewCreatorApplicationEmail({
      applicantName: displayName.trim(),
      applicantEmail: email,
      projectType: project_type,
      projectDescription: project_description,
    }).catch(console.error);

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error("[creator-apply] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
