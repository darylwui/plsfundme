// Sentry SDK initialization for the Node.js runtime (App Router route
// handlers, server components, server actions, middleware fallback).
//
// Imported lazily from `instrumentation.ts` when Next.js detects the
// runtime is `nodejs`. Keep this file free of heavy imports — it runs
// once per cold start and blocks the server from accepting traffic
// until it resolves.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Silently no-op when DSN is absent. Local dev and preview environments
// without the env var should not spam the production Sentry project.
if (dsn) {
  Sentry.init({
    dsn,

    // Attach request headers + IP to events for easier triage.
    sendDefaultPii: true,

    // 10% of transactions in prod, everything locally. Adjust after we see
    // real traffic volume — 10% of Singapore crowdfunding scale is basically
    // free at Sentry's Developer tier.
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Ship structured logs to Sentry so we can correlate errors with
    // surrounding console.log output.
    enableLogs: true,

    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
