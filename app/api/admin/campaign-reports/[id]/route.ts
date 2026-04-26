import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ["open", "reviewing", "dismissed", "action_taken"] as const;
type Status = (typeof VALID_STATUSES)[number];
const ADMIN_NOTES_MAX = 5000;

interface PatchBody {
  status?: unknown;
  admin_notes?: unknown;
}

function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (VALID_STATUSES as readonly string[]).includes(v);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const patch: { status?: Status; admin_notes?: string | null } = {};

  if (body.status !== undefined) {
    if (!isStatus(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    patch.status = body.status;
  }

  if (body.admin_notes !== undefined) {
    if (body.admin_notes !== null && typeof body.admin_notes !== "string") {
      return NextResponse.json({ error: "admin_notes must be a string or null." }, { status: 400 });
    }
    if (typeof body.admin_notes === "string" && body.admin_notes.length > ADMIN_NOTES_MAX) {
      return NextResponse.json(
        { error: `admin_notes must be at most ${ADMIN_NOTES_MAX} characters.` },
        { status: 400 },
      );
    }
    patch.admin_notes = body.admin_notes;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("campaign_reports")
    .update(patch)
    .eq("id", id)
    .select("id, status, admin_notes, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not update report." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, report: data });
}
