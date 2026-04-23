import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendCreatorApprovedEmail, sendCreatorRejectedEmail } from "@/lib/email/templates";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, rejection_reason } = await req.json();

  const service = createServiceClient();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const finalRejectionReason = rejection_reason || "Application did not meet requirements.";

  const { error } = await service
    .from("creator_profiles")
    .update(
      action === "approve"
        ? { status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id }
        : { status: "rejected", rejection_reason: finalRejectionReason, reviewed_at: new Date().toISOString(), reviewed_by: user.id }
    )
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Email the creator
  const { data: { user: creatorAuth } } = await service.auth.admin.getUserById(id);
  const { data: creatorProfile } = await service.from("profiles").select("display_name").eq("id", id).single();
  if (creatorAuth?.email && creatorProfile) {
    if (action === "approve") {
      await sendCreatorApprovedEmail({
        creatorEmail: creatorAuth.email,
        creatorName: (creatorProfile as { display_name: string }).display_name,
      }).catch(console.error);
    } else {
      await sendCreatorRejectedEmail({
        creatorEmail: creatorAuth.email,
        creatorName: (creatorProfile as { display_name: string }).display_name,
        rejectionReason: finalRejectionReason,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true });
}
