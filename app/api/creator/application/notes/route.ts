import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendAdminCreatorRepliedEmail } from "@/lib/email/templates";

async function requireCreator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  // Must have a creator_profiles row — i.e. they actually applied
  const { data: cp } = await supabase
    .from("creator_profiles")
    .select("id, status")
    .eq("id", user.id)
    .single();

  if (!cp) return { error: NextResponse.json({ error: "Not an applicant" }, { status: 403 }) };

  return { user, creatorProfile: cp };
}

export async function GET() {
  const auth = await requireCreator();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const service = createServiceClient();

  const { data: notes, error } = await service
    .from("creator_review_notes")
    .select("id, author_id, author_role, body, created_at")
    .eq("creator_id", user.id)
    .eq("visibility", "shared")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authorIds = Array.from(new Set((notes ?? []).map((n) => n.author_id)));
  const { data: authors } = authorIds.length
    ? await service.from("profiles").select("id, display_name, avatar_url").in("id", authorIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };
  const authorMap = new Map(
    (authors ?? []).map((a) => [a.id, { display_name: a.display_name, avatar_url: a.avatar_url }])
  );

  return NextResponse.json({
    notes: (notes ?? []).map((n) => ({
      ...n,
      author: authorMap.get(n.author_id) ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireCreator();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { body } = (await req.json()) as { body?: string };
  const trimmed = body?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: note, error } = await service
    .from("creator_review_notes")
    .insert({
      creator_id: user.id,
      author_id: user.id,
      author_role: "creator",
      visibility: "shared",
      body: trimmed,
    })
    .select("id, author_id, author_role, body, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify admin
  const { data: applicant } = await service
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  try {
    await sendAdminCreatorRepliedEmail({
      applicantName: (applicant as { display_name: string } | null)?.display_name ?? "Applicant",
      applicantEmail: user.email ?? "(unknown)",
      reply: trimmed,
    });
  } catch (err) {
    console.error("[creator/application/notes] admin notify failed", err);
  }

  const { data: author } = await service
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    note: {
      ...note,
      author: author ?? null,
    },
  });
}
