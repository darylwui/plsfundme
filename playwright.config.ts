import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — E2E tests live in `tests/e2e/`.
 *
 * Local: `npm run test:e2e` boots a fresh `next dev` on :3000 (or
 * reuses one if already running) and runs the suite against it.
 *
 * Against a remote env (e.g. a Vercel preview URL):
 *   PLAYWRIGHT_BASE_URL=https://preview-abc.vercel.app npm run test:e2e
 *
 * The `webServer` block is skipped when `PLAYWRIGHT_BASE_URL` is
 * set, so CI can target the real preview deployment instead of
 * spinning up its own dev server.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // E2E tests share a Next dev server, but each spec is independent —
  // parallel runs cut wall-clock dramatically.
  fullyParallel: true,
  // Block accidental `.only` from landing in CI.
  forbidOnly: !!process.env.CI,
  // Flaky-network resilience on CI; instant feedback locally.
  retries: process.env.CI ? 2 : 0,
  // CI keeps it serial to avoid stepping on the dev server's resources;
  // local runs use Playwright's auto-detected default.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    // Capture a trace zip when a test retries — helps diagnose
    // flakes without paying the trace cost on every run.
    trace: "on-first-retry",
    // Always grab a screenshot when a test fails for fast triage.
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Skip the embedded dev server when running against a real URL.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
