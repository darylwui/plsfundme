import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lightweight endpoint for the creator-application status poller.
 *
 * Returns just `{ status }` so the client can compare against its
 * initial value and trigger a `router.refresh()` when the admin flips
 * the application from `pending_review` → `approved`/`rejected`. Avoids
 * full creator-profile rehydration on every poll (we hit this every
 * 30s while a creator's tab is open on /dashboard/application).
 *
 * Auth: caller must be signed in. Returns 401 otherwise. We never
 * expose another user's status.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cp, error } = await supabase
    .from("creator_profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { status: (cp?.status as string | undefined) ?? null },
    {
      headers: {
        // Force fresh on every poll. Without this, browsers and any
        // intermediary cache could happily serve a stale status for
        // minutes — defeating the entire point of the poller.
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
