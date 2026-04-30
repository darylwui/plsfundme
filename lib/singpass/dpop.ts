import { SignJWT, importJWK } from "jose";
import type { JWK } from "jose";
import { singpassConfig } from "./config";

/**
 * Build a DPoP proof JWT for a single SingPass request.
 *
 * SingPass FAPI 2.0 requires a `DPoP` header on the PAR, token, and
 * userinfo/Person requests. The proof is a JWT that:
 *  - is signed with our private key (we reuse the sig key)
 *  - includes the public key in the header (`jwk`)
 *  - binds the proof to a specific HTTP method + URL via `htm` / `htu`
 *  - optionally includes a server-issued `nonce` (returned via the
 *    `DPoP-Nonce` header on a 401 with `error=use_dpop_nonce`)
 *  - optionally includes an `ath` claim (base64url-sha256 of the
 *    access token) when the proof accompanies a resource request
 *
 * @param htm  HTTP method (e.g. "POST")
 * @param htu  Full target URL (no query string per RFC 9449)
 * @param opts.nonce        Server-issued nonce (DPoP-Nonce header)
 * @param opts.accessToken  Access token to bind via the `ath` claim
 */
export async function buildDpopProof(
  htm: string,
  htu: string,
  opts: { nonce?: string; accessToken?: string } = {}
): Promise<string> {
  // Reuse the existing signing key from SINGPASS_PRIVATE_KEY_BASE64
  const raw = JSON.parse(
    Buffer.from(singpassConfig.privateKeyBase64, "base64").toString("utf8")
  ) as { sig: JWK; enc: JWK };

  const privateKey = await importJWK(
    raw.sig as Parameters<typeof importJWK>[0],
    "ES256"
  );

  // Public-key fields (no `d`) embedded in the DPoP header per RFC 9449.
  // We pull these from the raw JWK directly because `importJWK` returns a
  // non-extractable CryptoKey that can't be re-exported.
  const headerJwk = {
    kty: raw.sig.kty,
    crv: raw.sig.crv,
    x: raw.sig.x,
    y: raw.sig.y,
  };

  const now = Math.floor(Date.now() / 1000);

  // Strip query string per RFC 9449 §4.2 — `htu` must be the URI without
  // the query and fragment components.
  const cleanedHtu = htu.split("?")[0].split("#")[0];

  const claims: Record<string, string> = {
    htm,
    htu: cleanedHtu,
    jti: crypto.randomUUID(),
  };

  if (opts.nonce) {
    claims.nonce = opts.nonce;
  }

  if (opts.accessToken) {
    // RFC 9449 §4.1: `ath` is base64url(sha256(access_token))
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(opts.accessToken)
    );
    claims.ath = Buffer.from(hash)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  return new SignJWT(claims)
    .setProtectedHeader({
      alg: "ES256",
      typ: "dpop+jwt",
      jwk: headerJwk,
    })
    .setIssuedAt(now)
    .setExpirationTime(now + 60) // short-lived per spec
    .sign(privateKey as Parameters<SignJWT["sign"]>[0]);
}

/**
 * Wrap a `fetch` call that needs a DPoP proof, transparently handling the
 * server-issued nonce dance: if the server returns 401 with a `DPoP-Nonce`
 * header (RFC 9449 §8), we rebuild the proof with the nonce and retry once.
 *
 * The caller passes a `buildProof(nonce?)` callback so each retry gets a
 * fresh proof (new `jti`, new `iat`).
 */
export async function fetchWithDpop(
  url: string,
  init: Omit<RequestInit, "headers"> & {
    headers: Record<string, string>;
    buildProof: (nonce?: string) => Promise<string>;
  }
): Promise<Response> {
  const { buildProof, headers, ...rest } = init;

  const firstProof = await buildProof();
  const first = await fetch(url, {
    ...rest,
    headers: { ...headers, DPoP: firstProof },
  });

  if (first.status !== 401) return first;

  const nonce = first.headers.get("DPoP-Nonce");
  if (!nonce) return first;

  // Second attempt with server-issued nonce. If this still fails the caller
  // gets the response and can decide whether to surface or log.
  const retryProof = await buildProof(nonce);
  return fetch(url, {
    ...rest,
    headers: { ...headers, DPoP: retryProof },
  });
}
