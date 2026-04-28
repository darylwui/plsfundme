import { type NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendProjectUpdateEmail } from "@/lib/email/templates";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, is_backers_only = false } = await request.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: project } = await service
    .from("projects")
    .select("id, title, slug, creator_id")
    .eq("id", projectId)
    .single();

  if (!project || project.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: update, error: insertError } = await service
    .from("project_updates")
    .insert({
      project_id: projectId,
      creator_id: user.id,
      title: title.trim(),
      body: body.trim(),
      is_backers_only,
    })
    .select("id")
    .single();

  if (insertError || !update) {
    return NextResponse.json(
      { error: insertError?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  // Fan out to all active, non-refunded backers
  const { data: pledges } = await service
    .from("pledges")
    .select("backer_id, profiles!inner(display_name)")
    .eq("project_id", projectId)
    .in("status", ["authorized", "paynow_captured", "captured"])
    .eq("refunded", false);

  if (pledges?.length) {
    const seen = new Set<string>();
    const unique = pledges.filter((p) => {
      if (seen.has(p.backer_id)) return false;
      seen.add(p.backer_id);
      return true;
    });

    await Promise.allSettled(
      unique.map(async (pledge) => {
        const {
          data: { user: backerAuth },
        } = await service.auth.admin.getUserById(pledge.backer_id);
        if (!backerAuth?.email) return;
        await sendProjectUpdateEmail({
          backerEmail: backerAuth.email,
          backerName: (pledge.profiles as { display_name: string }).display_name,
          projectTitle: project.title,
          projectSlug: project.slug,
          updateTitle: title.trim(),
          updateBody: body.trim(),
          isBackersOnly: is_backers_only,
        });
      })
    );
  }

  return NextResponse.json({ id: update.id });
}
