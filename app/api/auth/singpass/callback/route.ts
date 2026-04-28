import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, verifyIdToken } from "@/lib/singpass/oidc";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

function errorRedirect(reason: string) {
  return NextResponse.redirect(
    `${APP_URL}/auth/singpass/error?reason=${reason}`
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return errorRedirect("failed");
  }

  if (!code || !returnedState) {
    return errorRedirect("failed");
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("sp_state")?.value;
  const savedNonce = cookieStore.get("sp_nonce")?.value;

  // CSRF check
  if (!savedState || savedState !== returnedState || !savedNonce) {
    return errorRedirect("expired");
  }

  // Clear state cookies immediately
  cookieStore.delete("sp_state");
  cookieStore.delete("sp_nonce");

  // Require authenticated getthatbread session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorRedirect("expired");
  }

  let claims: { sub: string; name?: string };
  try {
    const tokens = await exchangeCodeForTokens(code);
    claims = await verifyIdToken(tokens.id_token, savedNonce);
  } catch {
    return errorRedirect("failed");
  }

  const { sub, name } = claims;

  // HMAC-SHA256 the NRIC/FIN with a pepper — never store raw UINFIN
  const encoder = new TextEncoder();
  const pepper = process.env.SINGPASS_UINFIN_PEPPER ?? "";
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const hashBuffer = await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(sub));
  const uinfinHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const service = createServiceClient();

  // Anti-fraud: check if this identity is already linked to a different account
  const { data: existing } = await service
    .from("creator_verifications")
    .select("profile_id")
    .eq("uinfin_hash", uinfinHash)
    .maybeSingle();

  if (existing && existing.profile_id !== user.id) {
    return errorRedirect("duplicate");
  }

  // Upsert verification record
  const { error: verifyError } = await service
    .from("creator_verifications")
    .upsert(
      {
        profile_id: user.id,
        method: "singpass",
        uinfin_hash: uinfinHash,
        verified_name: name ?? "",
        verified_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );

  if (verifyError) {
    return errorRedirect("failed");
  }

  // Update creator_profiles
  await service
    .from("creator_profiles")
    .update({ singpass_verified: true, singpass_sub: sub })
    .eq("id", user.id);

  return NextResponse.redirect(`${APP_URL}/dashboard?singpass=verified`);
}
