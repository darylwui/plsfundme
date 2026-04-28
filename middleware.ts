import { NextRequest, NextResponse } from "next/server";

/**
 * CSP via middleware so we can mint a fresh nonce per request and
 * bake it into both the response header and a request header that
 * server components read via `headers()`.
 *
 * Allowlist sources:
 * - script-src:    self, nonce, GA4, HubSpot, Stripe Elements, Sentry Replay CDN
 * - style-src:     self + 'unsafe-inline' (Stripe Elements + Tailwind JIT need it; style-only XSS is hard to weaponize)
 * - img-src:       self, supabase storage, Google avatars, Stripe icons, GA pixel, data:, blob:
 * - font-src:      self, data:, Google Fonts (Stripe Elements imports Inter from googleapis)
 * - connect-src:   self, supabase REST/Realtime, Stripe API, GA, currency rate API, Sentry CDN
 * - frame-src:     YouTube/Vimeo (campaign embeds), Stripe Elements
 * - frame-ancestors: 'none' (matches existing X-Frame-Options: DENY)
 *
 * `strict-dynamic` is intentionally NOT used because GA4's loader
 * issues additional scripts from googletagmanager that we want
 * explicitly allowlisted rather than transitively trusted.
 *
 * If something breaks in prod, flip CSP_REPORT_ONLY=true in env to
 * downgrade to Content-Security-Policy-Report-Only — browser logs
 * violations to the console without blocking.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";
const SUPABASE_WS = SUPABASE_URL.replace(/^https/, "wss");

function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://js.hs-scripts.com https://*.googletagmanager.com https://*.google-analytics.com https://js.stripe.com https://m.stripe.com https://browser.sentry-cdn.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://*.googleusercontent.com https://q.stripe.com https://*.google-analytics.com https://*.googletagmanager.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' ${SUPABASE_URL} ${SUPABASE_WS} https://api.stripe.com https://m.stripe.com https://*.google-analytics.com https://*.analytics.google.com https://browser.sentry-cdn.com https://open.er-api.com`,
    `frame-src https://www.youtube.com https://player.vimeo.com https://js.stripe.com https://hooks.stripe.com`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export function middleware(request: NextRequest) {
  // crypto.randomUUID is available in the Edge runtime — gives us a
  // 128-bit unguessable nonce per request.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Forward the nonce to server components via a request header so
  // they can apply it to inline <Script nonce={...}> tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  const headerName =
    process.env.CSP_REPORT_ONLY === "true"
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";
  response.headers.set(headerName, csp);

  return response;
}

export const config = {
  // Run on every page request EXCEPT static assets, image optimisation,
  // favicon, and API routes. API routes don't render HTML so CSP isn't
  // meaningful there.
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico|woff|woff2|ttf|eot|css|js|map)).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
