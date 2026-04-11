import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Ensure next is a relative path to prevent open redirects
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    // Code exchange failed — if this was a password reset, send to expired screen
    if (safeNext === "/reset-password") {
      return NextResponse.redirect(`${origin}/reset-password?error=expired`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
