import { NextResponse } from "next/server";
import { buildPublicJwks } from "@/lib/singpass/jwks";

// Legacy public JWKS URL — kept live so the staging dev-portal
// registration (which points here) keeps working. New registrations
// (prod linkup) should use `/.well-known/singpass-jwks.json` instead.
//
// Both routes return the same body via the shared helper.

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
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
