import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  sendProjectApprovedEmail,
  sendProjectRejectedEmail,
  sendProjectRemovedEmail,
} from "@/lib/email/templates";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Verify the caller is an admin */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}

// PATCH — approve | reject | remove
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, reason } = await request.json() as { action: string; reason?: string };

  const service = createServiceClient();

  // Fetch the project + creator for email notification
  const { data: project } = await service
    .from("projects")
    .select("id, title, slug, creator_id, status")
    .eq("id", id)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (action === "approve") {
    const { error } = await service
      .from("projects")
      .update({ status: "active" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Email the creator
    const { data: { user: creatorAuth } } = await service.auth.admin.getUserById(project.creator_id);
    const { data: profile } = await service.from("profiles").select("display_name").eq("id", project.creator_id).single();
    if (creatorAuth?.email && profile) {
      await sendProjectApprovedEmail({
        creatorEmail: creatorAuth.email,
        creatorName: (profile as any).display_name,
        projectTitle: project.title,
        projectSlug: project.slug,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    if (!reason?.trim()) return NextResponse.json({ error: "Reason is required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (service as any)
      .from("projects")
      .update({ status: "cancelled", rejection_reason: reason.trim() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: { user: creatorAuth } } = await service.auth.admin.getUserById(project.creator_id);
    const { data: profile } = await service.from("profiles").select("display_name").eq("id", project.creator_id).single();
    if (creatorAuth?.email && profile) {
      await sendProjectRejectedEmail({
        creatorEmail: creatorAuth.email,
        creatorName: (profile as any).display_name,
        projectTitle: project.title,
        reason: reason,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    if (!reason?.trim()) return NextResponse.json({ error: "Reason is required" }, { status: 400 });

    const { error } = await service
      .from("projects")
      .update({ status: "removed" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: { user: creatorAuth } } = await service.auth.admin.getUserById(project.creator_id);
    const { data: profile } = await service.from("profiles").select("display_name").eq("id", project.creator_id).single();
    if (creatorAuth?.email && profile) {
      await sendProjectRemovedEmail({
        creatorEmail: creatorAuth.email,
        creatorName: (profile as any).display_name,
        projectTitle: project.title,
        reason: reason,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE — hard delete (only if no pledges)
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = createServiceClient();

  // Safety check: no pledges
  const { count } = await service
    .from("pledges")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id)
    .in("status", ["authorized", "paynow_captured", "captured"]);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete a project with active pledges. Use Remove (ToS) instead." },
      { status: 400 }
    );
  }

  // Delete rewards first (FK constraint)
  await service.from("rewards").delete().eq("project_id", id);
  await service.from("stretch_goals").delete().eq("project_id", id);
  await service.from("project_updates").delete().eq("project_id", id);

  const { error } = await service.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
