import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { singpassConfig } from "@/lib/singpass/config";
import { pushAuthorizationRequest } from "@/lib/singpass/oidc";

function randomHex(bytes: number) {
  return crypto
    .getRandomValues(new Uint8Array(bytes))
    .reduce((acc, b) => acc + b.toString(16).padStart(2, "0"), "");
}

function base64url(buf: ArrayBuffer) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generatePkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer);
  const challenge = base64url(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  );
  return { verifier, challenge };
}

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

  const state = randomHex(32);
  const nonce = randomHex(16);
  const { verifier, challenge } = await generatePkce();

  let requestUri: string;
  try {
    requestUri = await pushAuthorizationRequest({ state, nonce, codeChallenge: challenge });
  } catch (err) {
    console.error("SingPass PAR failed:", err);
    return NextResponse.redirect(
      new URL("/auth/singpass/error?reason=failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  cookieStore.set("sp_state", state, cookieOpts);
  cookieStore.set("sp_nonce", nonce, cookieOpts);
  cookieStore.set("sp_cv", verifier, cookieOpts);

  const url = new URL(singpassConfig.authEndpoint);
  url.searchParams.set("client_id", singpassConfig.clientId);
  url.searchParams.set("request_uri", requestUri);

  return NextResponse.redirect(url.toString());
}
