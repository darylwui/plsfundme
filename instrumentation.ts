// Next.js 16 instrumentation entry point. Runs once per server start,
// before the first request is handled. Used to initialize Sentry for
// the appropriate runtime (Node.js or Edge) and to wire up the
// `onRequestError` hook so uncaught Server Component / route handler
// errors get sent to Sentry automatically.
//
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown during Server Component rendering, Route
// Handlers, Server Actions, and proxy/middleware execution. Without
// this hook Sentry would miss most App Router errors.
export const onRequestError = Sentry.captureRequestError;
