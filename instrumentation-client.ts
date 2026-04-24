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

    integrations: [
      // Session Replay: records DOM + network of the last ~60s before
      // an error, so we can see what the user actually did.
      Sentry.replayIntegration({
        // Mask form inputs by default — payment forms, Singpass
        // callbacks, email signups. Unmask only explicitly-safe elements.
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],

    // Session replay is error-only: we do not record sessions under
    // normal conditions, only when an error fires. Narrows PDPA
    // disclosure surface and cuts Sentry replay volume.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,

    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

// Instrument client-side navigations so traces span the full journey
// rather than resetting at every route change.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
