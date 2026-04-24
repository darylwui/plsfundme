import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  sendCreatorApprovedEmail,
  sendCreatorRejectedEmail,
  sendCreatorRequestInfoEmail,
} from "@/lib/email/templates";
import type { TablesUpdate } from "@/types/database.types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

type Action = "approve" | "reject" | "request_info";

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

  const { action, rejection_reason, question } = (await req.json()) as {
    action?: Action;
    rejection_reason?: string;
    question?: string;
  };

  if (action !== "approve" && action !== "reject" && action !== "request_info") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "request_info" && !question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  let updatePayload: TablesUpdate<"creator_profiles">;
  if (action === "approve") {
    updatePayload = {
      status: "approved",
      reviewed_at: now,
      reviewed_by: user.id,
      reviewer_id: user.id,
    };
  } else if (action === "reject") {
    updatePayload = {
      status: "rejected",
      rejection_reason: rejection_reason?.trim() || "Application did not meet requirements.",
      reviewed_at: now,
      reviewed_by: user.id,
      reviewer_id: user.id,
    };
  } else {
    updatePayload = {
      status: "needs_info",
      info_requested_at: now,
      last_contacted_at: now,
      reviewer_id: user.id,
    };
  }

  const { error: updateErr } = await service
    .from("creator_profiles")
    .update(updatePayload)
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // For request_info, also persist the question as a shared note so the
  // creator-facing timeline has the exact same wording as the email.
  if (action === "request_info" && question) {
    const { error: noteErr } = await service.from("creator_review_notes").insert({
      creator_id: id,
      author_id: user.id,
      author_role: "admin",
      visibility: "shared",
      body: question.trim(),
    });
    if (noteErr) return NextResponse.json({ error: noteErr.message }, { status: 500 });
  }

  // Email the creator
  const [{ data: creatorAuth }, { data: creatorProfile }] = await Promise.all([
    service.auth.admin.getUserById(id),
    service.from("profiles").select("display_name").eq("id", id).single(),
  ]);

  const creatorName = (creatorProfile as { display_name: string } | null)?.display_name ?? "there";
  const creatorEmail = creatorAuth?.user?.email;

  if (creatorEmail) {
    try {
      if (action === "approve") {
        await sendCreatorApprovedEmail({ creatorEmail, creatorName });
      } else if (action === "reject") {
        await sendCreatorRejectedEmail({
          creatorEmail,
          creatorName,
          rejectionReason: updatePayload.rejection_reason ?? "",
        });
      } else if (action === "request_info" && question) {
        await sendCreatorRequestInfoEmail({
          creatorEmail,
          creatorName,
          question: question.trim(),
        });
      }
    } catch (err) {
      console.error("[admin/creator] email send failed", err);
    }
  }

  return NextResponse.json({ success: true });
}
