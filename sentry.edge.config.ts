// Sentry SDK initialization for the Edge runtime.
//
// Imported lazily from `instrumentation.ts` when Next.js detects the
// runtime is `edge`. This covers Edge route handlers and the Next.js
// proxy/middleware file if one exists. Node.js-only APIs are
// unavailable here, so we keep the config minimal.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    enableLogs: true,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
