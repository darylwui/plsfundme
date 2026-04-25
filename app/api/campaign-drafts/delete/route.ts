import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/campaign-drafts/delete
 *
 * Deletes the current user's wizard draft row in `campaign_drafts`.
 * The schema has UNIQUE(user_id), so each user has at most one row;
 * delete-by-user_id is the natural shape.
 *
 * Used by the dashboard's draft-continuation card when the source is
 * a wizard draft (no projects.status='draft' row exists yet).
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("campaign_drafts")
    .delete()
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
