import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const DELETABLE_STATUSES = new Set([
  "draft",
  "pending_review",
  "failed",
  "cancelled",
  "removed",
]);

/**
 * POST /api/projects/[id]/delete
 *
 * Soft-deletes a creator's project by setting deleted_at = now().
 * Only the original creator can delete, and only while the project
 * is in a non-funded, non-active state. Funded / active projects
 * must be cancelled through a separate flow (not implemented here).
 */
export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, creator_id, status, deleted_at")
    .eq("id", id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any;

  if (p.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (p.deleted_at) {
    return NextResponse.json({ ok: true, alreadyDeleted: true });
  }

  if (!DELETABLE_STATUSES.has(p.status)) {
    return NextResponse.json(
      {
        error:
          "Only draft, pending, failed, or cancelled campaigns can be deleted. Active and funded campaigns must go through support.",
      },
      { status: 409 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
