import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { singpassConfig } from "@/lib/singpass/config";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  const state = crypto
    .getRandomValues(new Uint8Array(32))
    .reduce((acc, b) => acc + b.toString(16).padStart(2, "0"), "");
  const nonce = crypto
    .getRandomValues(new Uint8Array(16))
    .reduce((acc, b) => acc + b.toString(16).padStart(2, "0"), "");

  const cookieStore = await cookies();
  cookieStore.set("sp_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  cookieStore.set("sp_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const url = new URL(singpassConfig.authEndpoint);
  url.searchParams.set("client_id", singpassConfig.clientId);
  url.searchParams.set("redirect_uri", singpassConfig.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid name");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);

  return NextResponse.redirect(url.toString());
}
