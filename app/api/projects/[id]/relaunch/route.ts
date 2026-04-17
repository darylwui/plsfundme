import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/projects/[id]/relaunch
 *
 * Copies a failed campaign's data into the creator's campaign_drafts row
 * so they land on /projects/create with everything pre-filled.
 * Only the original creator can do this, and only for failed campaigns.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the failed project + its rewards
  const { data: project } = await supabase
    .from("projects")
    .select("*, rewards(*)")
    .eq("id", id)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((project as any).creator_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if ((project as any).status !== "failed") {
    return NextResponse.json({ error: "Only failed campaigns can be relaunched" }, { status: 400 });
  }

  const p = project as any;

  // Build a fresh draft from the failed campaign's data
  const draftData = {
    title: p.title,
    category_id: p.category_id,
    short_description: p.short_description,
    full_description: p.full_description,
    cover_image_url: p.cover_image_url,
    video_url: p.video_url,
    funding_goal_sgd: p.funding_goal_sgd,
    start_date: null,
    deadline: "",           // force them to set a new deadline
    payout_mode: p.payout_mode,
  };

  const rewardsData = (p.rewards ?? []).map((r: any) => ({
    title: r.title,
    description: r.description ?? "",
    minimum_pledge_sgd: r.minimum_pledge_sgd,
    estimated_delivery_date: r.estimated_delivery_date ?? "",
    max_backers: r.max_backers,
    includes_physical_item: r.includes_physical_item,
    image_url: r.image_url,
  }));

  // Upsert into campaign_drafts
  const { error } = await (supabase as any)
    .from("campaign_drafts")
    .upsert(
      {
        user_id: user.id,
        draft_data: draftData,
        rewards_data: rewardsData,
        step: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
