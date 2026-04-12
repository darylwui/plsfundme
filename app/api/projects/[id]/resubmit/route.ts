import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the caller is the creator and the project is in a resubmittable state
  const { data: project } = await supabase
    .from("projects")
    .select("id, creator_id, status")
    .eq("id", id)
    .single();

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.creator_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (project.status !== "cancelled") {
    return NextResponse.json({ error: "Only rejected campaigns can be resubmitted" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("projects")
    .update({ status: "pending_review", rejection_reason: null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
