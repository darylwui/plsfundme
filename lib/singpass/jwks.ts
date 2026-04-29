// Public JWKS construction shared by the two JWKS routes:
//   /.well-known/singpass-jwks.json   (RFC 8615 standard URL — preferred
//                                      for the prod-tier registration)
//   /api/jwks                         (legacy URL — kept working so the
//                                      existing staging registration is
//                                      not broken)
//
// Both routes return the same body. The helper here owns the kid
// constants, the alg advertisements, and the public-only field
// projection — never spread the source JWK, always pick named fields
// so that any future addition of private fields cannot leak.

// Kid coordination:
//   SIG_KID matches the kid hardcoded in `lib/singpass/oidc.ts` when we
//   build the client_assertion. If you change one, change the other.
//   ENC_KID is for our own tracking — Singpass picks the encryption
//   key from JWKS by `use=enc`, but having a stable kid simplifies
//   audits and supports future rotation strategies.
export const SIG_KID = "gtb-sig-1";
export const ENC_KID = "gtb-enc-1";

type EcJwk = {
  kty?: string;
  crv?: string;
  x?: string;
  y?: string;
  // `d` (private scalar) is intentionally NOT included on the public
  // type. Picking by named fields below also drops it at runtime.
};

type PrivateBundle = { sig: EcJwk; enc: EcJwk };

function publicSig(jwk: EcJwk) {
  return {
    kty: jwk.kty,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
    use: "sig",
    alg: "ES256",
    kid: SIG_KID,
  };
}

function publicEnc(jwk: EcJwk) {
  return {
    kty: jwk.kty,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
    use: "enc",
    // Singpass JWE: alg=ECDH-ES+A256KW, enc=A256GCM. The JWK `alg`
    // here advertises the key-management alg the key is registered for.
    alg: "ECDH-ES+A256KW",
    kid: ENC_KID,
  };
}

export type JwksBuildResult =
  | { ok: true; body: { keys: ReturnType<typeof publicSig>[] } }
  | { ok: false; status: number; error: string };

/**
 * Read SINGPASS_PRIVATE_KEY_BASE64, return the public JWKS body.
 *
 * Returns a discriminated result rather than throwing so the route
 * handlers can map errors to clean HTTP responses without a try/catch
 * each.
 */
export function buildPublicJwks(): JwksBuildResult {
  const raw = process.env.SINGPASS_PRIVATE_KEY_BASE64;
  if (!raw) {
    return { ok: false, status: 500, error: "JWKS not configured" };
  }

  let bundle: PrivateBundle;
  try {
    bundle = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    ) as PrivateBundle;
  } catch {
    return { ok: false, status: 500, error: "JWKS bundle malformed" };
  }

  if (!bundle.sig || !bundle.enc) {
    return {
      ok: false,
      status: 500,
      error: "JWKS bundle missing sig or enc key",
    };
  }

  return {
    ok: true,
    body: {
      // Order: enc first, sig second. Matches the order the legacy
      // route used; Singpass doesn't care, but kept for stability.
      keys: [publicEnc(bundle.enc), publicSig(bundle.sig)],
    },
  };
}
