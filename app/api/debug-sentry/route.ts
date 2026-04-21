// Smoke-test route for verifying the Sentry pipeline end-to-end.
//
// Hitting GET /api/debug-sentry throws on purpose so we can confirm:
//   1. The error lands in https://get-that-bread.sentry.io/issues/
//   2. The stack trace is readable (source maps mapped correctly)
//   3. The release tag matches the current deployment's git SHA
//
// DELETE THIS FILE AFTER ONE SUCCESSFUL TEST. It's a deliberate error
// source — leaving it in prod means every crawler, link preview, and
// uptime monitor that hits it floods Sentry with noise.
//
// Not removed automatically because we want the test to be explicit:
// the deletion PR ships right after this one, gated on the user
// confirming they saw the error in Sentry.

export const dynamic = "force-dynamic";

export function GET() {
  const timestamp = new Date().toISOString();
  throw new Error(
    `[sentry-smoke-test] Deliberate server error at ${timestamp}. ` +
      `If you're seeing this in Sentry: the pipeline works. ` +
      `Delete /api/debug-sentry after verifying.`
  );
}
