import { NextResponse } from "next/server";
import { buildPublicJwks } from "@/lib/singpass/jwks";

// Public JWKS endpoint at the RFC 8615 standard URL. Singpass fetches
// this to verify our client_assertion signatures and to pick the
// encryption key when minting JWE-wrapped ID tokens / Person responses
// for us. This is the URL we register for the prod linkup; the legacy
// `/api/jwks` stays live for staging continuity.

// Force dynamic so we always read the current env var at request time.
// (Static optimisation isn't safe here — a redeployed env var must
// take effect immediately rather than being baked into a build cache.)
export const dynamic = "force-dynamic";

export async function GET() {
  const result = buildPublicJwks();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return new NextResponse(JSON.stringify(result.body), {
    status: 200,
    headers: {
      "Content-Type": "application/jwk-set+json",
      // 1-hour CDN cache. Annual rotation goes on the calendar; an
      // emergency rotation propagates within the hour after redeploy.
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
