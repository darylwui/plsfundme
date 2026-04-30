import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/backing']

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co'
const SUPABASE_WS = SUPABASE_URL.replace(/^https/, 'wss')

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
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)
  const cspHeaderName =
    process.env.CSP_REPORT_ONLY === 'true'
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy'

  // Forward nonce to server components so they can apply it to inline <Script> tags
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this call
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Privacy lives at /privacy; permanent redirect for any old /terms?tab=privacy
  // links. Built-in next.config redirects forward unmatched query params, so we
  // do this here to drop `tab=privacy` from the destination.
  if (pathname === '/terms' && request.nextUrl.searchParams.get('tab') === 'privacy') {
    const target = new URL('/privacy', request.url)
    return NextResponse.redirect(target, 308)
  }

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  supabaseResponse.headers.set(cspHeaderName, csp)
  return supabaseResponse
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico|woff|woff2|ttf|eot|css|js|map)).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
