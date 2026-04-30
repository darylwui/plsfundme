import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  verifyIdToken,
  parseUinfinFromSub,
  fetchPerson,
  extractPersonFields,
} from "@/lib/singpass/oidc";
import { singpassConfig } from "@/lib/singpass/config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

function errorRedirect(reason: string) {
  return NextResponse.redirect(
    `${APP_URL}/auth/singpass/error?reason=${reason}`
  );
}

/**
 * HMAC-SHA256(uinfin, pepper) — never store the raw UINFIN.
 *
 * Throws if SINGPASS_UINFIN_PEPPER is unset. A missing pepper would
 * silently degrade to bare SHA-256(UINFIN), which is rainbow-table-able
 * for 9-character NRIC inputs and fails PDPA's "appropriate security
 * arrangements" bar. Better to fail loud than store a weak hash.
 */
async function hashUinfin(uinfin: string): Promise<string> {
  const pepper = process.env.SINGPASS_UINFIN_PEPPER;
  if (!pepper) {
    throw new Error(
      "SINGPASS_UINFIN_PEPPER is not configured — refusing to hash UINFIN with empty pepper"
    );
  }

  const encoder = new TextEncoder();
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const hashBuffer = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(uinfin)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
  const codeVerifier = cookieStore.get("sp_cv")?.value;

  // CSRF check
  if (!savedState || savedState !== returnedState || !savedNonce || !codeVerifier) {
    return errorRedirect("expired");
  }

  // Clear state cookies immediately
  cookieStore.delete("sp_state");
  cookieStore.delete("sp_nonce");
  cookieStore.delete("sp_cv");

  // Require authenticated getthatbread session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorRedirect("expired");
  }

  let claims: { sub: string; name?: string; iat?: number };
  let accessToken: string;
  let grantedScope: string | undefined;

  try {
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    claims = await verifyIdToken(tokens.id_token, savedNonce);
    accessToken = tokens.access_token;
    grantedScope = tokens.scope;
  } catch (err) {
    console.error("SingPass token exchange / id_token verify failed:", err);
    return errorRedirect("failed");
  }

  // `sub` is `s=<UINFIN>,u=<uuid>` in Singpass v5. Strip to bare UINFIN
  // for both the Person API path and the dedup hash.
  const uinfin = parseUinfinFromSub(claims.sub);

  // Fetch the full Myinfo Person record (DOB, nationality, residency).
  // The id_token only carries `sub` + `name`; everything else is gated
  // behind a separate Person API call.
  let person;
  try {
    const raw = await fetchPerson(uinfin, accessToken);
    person = extractPersonFields(raw);
  } catch (err) {
    console.error("SingPass Person fetch failed:", err);
    return errorRedirect("failed");
  }

  let uinfinHash: string;
  try {
    uinfinHash = await hashUinfin(uinfin);
  } catch (err) {
    console.error("SingPass UINFIN hashing failed:", err);
    return errorRedirect("failed");
  }

  const service = createServiceClient();

  // Anti-fraud: this identity must not already be linked to a different
  // account. The unique index on `uinfin_hash` enforces this at the DB
  // level too, but checking first lets us redirect with a friendly
  // `duplicate` reason instead of a 500.
  const { data: existing } = await service
    .from("creator_verifications")
    .select("profile_id")
    .eq("uinfin_hash", uinfinHash)
    .maybeSingle();

  if (existing && existing.profile_id !== user.id) {
    return errorRedirect("duplicate");
  }

  // Use the granted scope from the token response if present; fall back to
  // what we requested. This is what the user actually consented to.
  const consentScopes = (grantedScope ?? singpassConfig.scopeString)
    .split(/\s+/)
    .filter(Boolean);

  // Best proxy for "consent timestamp" is the id_token `iat` — the moment
  // Singpass minted the token after the user clicked Allow.
  const consentGrantedAt = claims.iat
    ? new Date(claims.iat * 1000).toISOString()
    : new Date().toISOString();

  // Upsert verification record. Prefer the Person `name` over the id_token
  // `name` claim — Person is the canonical source.
  const { error: verifyError } = await service
    .from("creator_verifications")
    .upsert(
      {
        profile_id: user.id,
        method: "singpass",
        uinfin_hash: uinfinHash,
        verified_name: person.name ?? claims.name ?? "",
        verified_dob: person.dob,
        nationality: person.nationality,
        residency: person.residency,
        verified_at: new Date().toISOString(),
        consent_granted_at: consentGrantedAt,
        consent_scopes: consentScopes,
        myinfo_txn_id: person.myinfoTxnId,
      },
      { onConflict: "profile_id" }
    );

  if (verifyError) {
    console.error("creator_verifications upsert failed:", verifyError);
    return errorRedirect("failed");
  }

  // Update creator_profiles. Store the full composite `sub` as-is — it's
  // the identifier Singpass returns and useful if we ever need to match
  // back against their audit logs.
  await service
    .from("creator_profiles")
    .update({ singpass_verified: true, singpass_sub: claims.sub })
    .eq("id", user.id);

  return NextResponse.redirect(`${APP_URL}/dashboard?singpass=verified`);
}
