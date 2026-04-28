import { NextResponse } from "next/server";

// Public JWKS endpoint — SingPass fetches this to verify our client assertions.
// Returns only public key fields (no "d" private key scalar).
export async function GET() {
  const raw = JSON.parse(
    Buffer.from(process.env.SINGPASS_PRIVATE_KEY_BASE64!, "base64").toString("utf8")
  ) as { sig: Record<string, string>; enc: Record<string, string> };

  const toPublic = (jwk: Record<string, string>, extra: Record<string, string>) => {
    const { d: _d, ...pub } = jwk;
    return { ...pub, ...extra };
  };

  const jwks = {
    keys: [
      toPublic(raw.enc, { use: "enc", alg: "ECDH-ES+A256KW", kid: "gtb-enc-1" }),
      toPublic(raw.sig, { use: "sig", alg: "ES256", kid: "gtb-sig-1" }),
    ],
  };

  return NextResponse.json(jwks, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
