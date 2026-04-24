import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugifyUnique } from "@/lib/utils/slugify";
import { sanitizeRichHtml } from "@/lib/utils/sanitize";
import { sendAdminNewProjectSubmittedEmail } from "@/lib/email/templates";
import { maybeSweep, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { milestoneSchema, projectMilestonesSchema } from "@/lib/validations/project";

const rewardSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  minimum_pledge_sgd: z.number().int().positive().max(1_000_000),
  estimated_delivery_date: z.string().optional().nullable(),
  max_backers: z.number().int().positive().nullable().optional(),
  includes_physical_item: z.boolean().optional().default(false),
});

const bodySchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().trim().min(5).max(100),
  short_description: z.string().trim().min(20).max(200),
  full_description: z.string().min(50).max(100_000),
  cover_image_url: z.string().url().nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  funding_goal_sgd: z.number().int().min(500).max(10_000_000),
  payout_mode: z.enum(["manual", "automatic"]).optional().default("automatic"),
  start_date: z.string().nullable().optional(),
  deadline: z.string(),
  milestones: z.array(milestoneSchema).length(3),
  rewards: z.array(rewardSchema).min(1).max(50),
});

export async function POST(request: NextRequest) {
  maybeSweep();
  const rl = rateLimit(request, "project-create", { windowMs: 60_000, max: 5 });
  if (!rl.ok) return rateLimitResponse(rl);

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Single join: profile + creator_profile status in one round-trip.
  // creator_profiles has three FKs back to profiles (id, reviewed_by,
  // reviewer_id) so the embed is ambiguous without an explicit FK hint —
  // PostgREST silently drops the relation, the status check falls through,
  // and every submit returns 403.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, creator_profiles!creator_profiles_id_fkey(status)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "creator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creatorProfile = Array.isArray(profile.creator_profiles)
    ? profile.creator_profiles[0]
    : profile.creator_profiles;

  if (!creatorProfile || creatorProfile.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    parsed = bodySchema.parse(raw);
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (new Date(parsed.deadline) <= new Date()) {
    return NextResponse.json({ error: "Deadline must be in the future." }, { status: 400 });
  }

  // Date-ordering refinement on milestones (future + strictly increasing).
  const milestonesParse = projectMilestonesSchema.safeParse({ milestones: parsed.milestones });
  if (!milestonesParse.success) {
    return NextResponse.json(
      {
        error:
          "Milestones are invalid. Please double-check all 3 milestones before submitting.",
      },
      { status: 400 },
    );
  }

  const slug = slugifyUnique(parsed.title);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      creator_id: user.id,
      category_id: parsed.category_id,
      title: parsed.title,
      slug,
      short_description: parsed.short_description,
      full_description: sanitizeRichHtml(parsed.full_description),
      cover_image_url: parsed.cover_image_url ?? null,
      video_url: parsed.video_url ?? null,
      funding_goal_sgd: parsed.funding_goal_sgd,
      payout_mode: parsed.payout_mode,
      start_date: parsed.start_date ?? null,
      deadline: parsed.deadline,
      milestones: milestonesParse.data.milestones,
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

  const rewardRows = parsed.rewards.map((r, i) => ({
    project_id: project.id,
    title: r.title,
    description: r.description,
    minimum_pledge_sgd: r.minimum_pledge_sgd,
    estimated_delivery_date: r.estimated_delivery_date || null,
    max_backers: r.max_backers ?? null,
    includes_physical_item: r.includes_physical_item,
    display_order: i,
  }));

  const { error: rewardError } = await supabase.from("rewards").insert(rewardRows);
  if (rewardError) {
    return NextResponse.json(
      { error: "Project created, but some rewards failed to save. Check your dashboard." },
      { status: 207 }
    );
  }

  sendAdminNewProjectSubmittedEmail({
    creatorName: profile.display_name,
    projectTitle: parsed.title,
    projectSlug: slug,
    fundingGoal: parsed.funding_goal_sgd,
  }).catch(() => {});

  return NextResponse.json({ slug });
}
