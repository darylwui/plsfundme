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

    // Look up existing user by email. listUsers() paginates at 1000/page;
    // iterate until we find a match or exhaust pages.
    let existingUser: Awaited<ReturnType<typeof service.auth.admin.listUsers>>["data"]["users"][number] | undefined;
    let page = 1;
    while (!existingUser) {
      const { data: userList } = await service.auth.admin.listUsers({ page, perPage: 1000 });
      existingUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (!userList?.users?.length || userList.users.length < 1000) break;
      page++;
    }

    if (existingUser) {
      // This endpoint is unauthenticated — it must never modify an existing
      // account's credentials. Any re-application path (including for
      // rejected creators) must run from a logged-in session through a
      // separate authenticated endpoint, or the user must reset their
      // password via the email-link flow first. Without that gate, anyone
      // who knows a victim's email could overwrite their password here.
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in to continue your application." },
        { status: 400 }
      );
    }

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
    const userId = created.user.id;

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
