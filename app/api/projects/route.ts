import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugifyUnique } from "@/lib/utils/slugify";
import { sanitizeRichHtml } from "@/lib/utils/sanitize";
import { sendAdminNewProjectSubmittedEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the caller is an approved creator
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "creator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (!creatorProfile || creatorProfile.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    category_id,
    title,
    short_description,
    full_description,
    cover_image_url,
    video_url,
    funding_goal_sgd,
    payout_mode,
    start_date,
    deadline,
    rewards = [],
  } = body;

  const slug = slugifyUnique(title);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      creator_id: user.id,
      category_id,
      title,
      slug,
      short_description,
      full_description: sanitizeRichHtml(full_description ?? ""),
      cover_image_url,
      video_url,
      funding_goal_sgd,
      payout_mode,
      start_date,
      deadline,
      status: "pending_review",
      launched_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: projectError?.message ?? "Failed to create project." },
      { status: 500 }
    );
  }

  if (rewards.length > 0) {
    const rewardRows = rewards.map(
      (r: { title: string; description: string; minimum_pledge_sgd: number; estimated_delivery_date?: string; max_backers: number; includes_physical_item: boolean; display_order?: number }, i: number) => ({
        project_id: project.id,
        title: r.title,
        description: r.description,
        minimum_pledge_sgd: r.minimum_pledge_sgd,
        estimated_delivery_date: r.estimated_delivery_date || null,
        max_backers: r.max_backers,
        includes_physical_item: r.includes_physical_item,
        display_order: i,
      })
    );

    const { error: rewardError } = await supabase.from("rewards").insert(rewardRows);
    if (rewardError) {
      return NextResponse.json(
        { error: "Project created, but some rewards failed to save. Check your dashboard." },
        { status: 207 }
      );
    }
  }

  // Fire-and-forget admin notification
  sendAdminNewProjectSubmittedEmail({
    creatorName: profile.display_name,
    projectTitle: title,
    projectSlug: slug,
    fundingGoal: funding_goal_sgd,
  }).catch(() => {});

  return NextResponse.json({ slug });
}
