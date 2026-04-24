import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendCreatorNewMessageEmail } from "@/lib/email/templates";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const service = createServiceClient();

  const { data: notes, error } = await service
    .from("creator_review_notes")
    .select("id, author_id, author_role, visibility, body, created_at")
    .eq("creator_id", id)
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

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { body, visibility } = (await req.json()) as {
    body?: string;
    visibility?: "internal" | "shared";
  };

  const trimmed = body?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }
  if (visibility !== "internal" && visibility !== "shared") {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: note, error } = await service
    .from("creator_review_notes")
    .insert({
      creator_id: id,
      author_id: user.id,
      author_role: "admin",
      visibility,
      body: trimmed,
    })
    .select("id, author_id, author_role, visibility, body, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (visibility === "shared") {
    // Bump last_contacted_at so stale-review filters still work.
    await service
      .from("creator_profiles")
      .update({ last_contacted_at: new Date().toISOString(), reviewer_id: user.id })
      .eq("id", id);

    // Notify the creator by email.
    const [{ data: creatorAuth }, { data: creatorProfile }] = await Promise.all([
      service.auth.admin.getUserById(id),
      service.from("profiles").select("display_name").eq("id", id).single(),
    ]);
    const creatorEmail = creatorAuth?.user?.email;
    const creatorName =
      (creatorProfile as { display_name: string } | null)?.display_name ?? "there";

    if (creatorEmail) {
      try {
        await sendCreatorNewMessageEmail({
          creatorEmail,
          creatorName,
          message: trimmed,
        });
      } catch (err) {
        console.error("[admin/creator/notes] email send failed", err);
      }
    }
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
