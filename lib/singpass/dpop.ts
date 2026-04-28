import { SignJWT, importJWK, exportJWK } from "jose";
import type { JWK } from "jose";
import { singpassConfig } from "./config";

/**
 * Build a DPoP proof JWT for a single SingPass request.
 *
 * SingPass FAPI 2.0 requires a `DPoP` header on the PAR, token, and
 * userinfo requests. The proof is a JWT that:
 *  - is signed with our private key (we reuse the sig key)
 *  - includes the public key in the header (`jwk`)
 *  - binds the proof to a specific HTTP method + URL via `htm` / `htu`
 *
 * @param htm  HTTP method (e.g. "POST")
 * @param htu  Full target URL (no query string per RFC 9449)
 */
export async function buildDpopProof(htm: string, htu: string): Promise<string> {
  // Reuse the existing signing key from SINGPASS_PRIVATE_KEY_BASE64
  const raw = JSON.parse(
    Buffer.from(singpassConfig.privateKeyBase64, "base64").toString("utf8")
  ) as { sig: JWK; enc: JWK };

  const privateKey = await importJWK(
    raw.sig as Parameters<typeof importJWK>[0],
    "ES256"
  );

  // Public-key fields (no `d`) embedded in the DPoP header per RFC 9449.
  // exportJWK strips the private `d` scalar automatically.
  const publicJwk = await exportJWK(privateKey as Parameters<typeof exportJWK>[0]);
  // exportJWK on an ES256 private key gives back x/y/crv/kty without d
  const headerJwk = {
    kty: publicJwk.kty,
    crv: publicJwk.crv,
    x: publicJwk.x,
    y: publicJwk.y,
  };

  const now = Math.floor(Date.now() / 1000);

  // Strip query string per RFC 9449 §4.2 — `htu` must be the URI without
  // the query and fragment components.
  const cleanedHtu = htu.split("?")[0].split("#")[0];

  return new SignJWT({
    htm,
    htu: cleanedHtu,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({
      alg: "ES256",
      typ: "dpop+jwt",
      jwk: headerJwk,
    })
    .setIssuedAt(now)
    .setExpirationTime(now + 60) // short-lived per spec
    .sign(privateKey as Parameters<SignJWT["sign"]>[0]);
}
