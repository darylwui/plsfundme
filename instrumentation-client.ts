// Next.js 16 client-side instrumentation. Runs after HTML is loaded
// but before React hydration, which makes it the right place to set
// up error tracking so we capture errors thrown during hydration.
//
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Attach headers + IP so we can triage by browser/location.
    sendDefaultPii: true,

    // Same sampling as the server. Browser traces are cheap on our
    // traffic levels; bump down later if we hit Sentry quotas.
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // NOTE: replayIntegration is intentionally NOT in the integrations
    // list — it's lazy-loaded below. The Replay SDK adds ~200KB to the
    // initial Sentry chunk, which was hurting LCP across every page.
    // Since `replaysSessionSampleRate: 0` means Replay only fires on
    // errors, eager-loading it is pure overhead. Lazy-loading from
    // Sentry's CDN after the page is idle keeps initial JS lean while
    // still giving us full replay coverage on the rare error.
    integrations: [],

    // Session replay is error-only: we do not record sessions under
    // normal conditions, only when an error fires. Narrows PDPA
    // disclosure surface and cuts Sentry replay volume.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,

    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });

  // Lazy-load Replay after the main thread is idle so the heavy
  // Replay SDK doesn't compete with hydration for parse time. If
  // an error fires in the first ~1–2s of a session, before Replay
  // attaches, we'll miss the replay for *that* error only — every
  // subsequent error in the same session gets the full replay.
  // Acceptable trade-off for a meaningful LCP improvement.
  const attachReplay = async () => {
    try {
      const replayIntegration = await Sentry.lazyLoadIntegration("replayIntegration");
      Sentry.getClient()?.addIntegration(
        replayIntegration({
          maskAllInputs: true,
          blockAllMedia: false,
        }),
      );
    } catch {
      // Replay failed to load (CDN blocked, offline, ad blocker).
      // We're now collecting errors without replay — a perfectly
      // valid degraded mode, no need to surface this.
    }
  };

  if (typeof window !== "undefined") {
    // requestIdleCallback runs the work when the browser is genuinely
    // idle — typically a few hundred ms after FCP. Fall back to a
    // setTimeout for Safari, which still ships without RIC support.
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(attachReplay, { timeout: 5000 });
    } else {
      setTimeout(attachReplay, 2000);
    }
  }
}

// Instrument client-side navigations so traces span the full journey
// rather than resetting at every route change.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
