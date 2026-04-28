import { test, expect, type Page } from "@playwright/test";

/**
 * Link & CTA health check.
 *
 * Visits every public route, asserts no 4xx/5xx response, then
 * collects all internal <a href> links on the page and checks each
 * one resolves without a 404. Auth-gated paths (dashboard, admin)
 * are excluded — they correctly redirect to /login when unauthenticated,
 * which is expected behaviour, not a broken link.
 *
 * Run against prod/preview:
 *   PLAYWRIGHT_BASE_URL=https://getthatbread.sg npm run test:e2e -- link-check
 */

const PUBLIC_ROUTES = [
  "/",
  "/explore",
  "/for-creators",
  "/for-creators/launch-guide",
  "/how-it-works",
  "/backer-protection",
  "/faq",
  "/terms",
  "/apply/creator",
  "/register",
  "/login",
  "/this-route-does-not-exist-404-check",
];

// Paths we explicitly skip when crawling links found on pages.
// These either require auth (redirect to /login — correct) or are
// external domains.
const SKIP_PREFIXES = [
  "/dashboard",
  "/admin",
  "/projects/create",
  "/api/",
  "mailto:",
  "http://",
  "https://",
  "#",
];

function shouldSkip(href: string): boolean {
  return SKIP_PREFIXES.some((p) => href.startsWith(p));
}

async function collectInternalLinks(page: Page): Promise<string[]> {
  const hrefs = await page.$$eval("a[href]", (els) =>
    els.map((el) => el.getAttribute("href") ?? "").filter(Boolean)
  );
  return [...new Set(hrefs.filter((h) => !shouldSkip(h)))];
}

// ── Route smoke tests ────────────────────────────────────────────

test.describe("public route health", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`GET ${route}`, async ({ page }) => {
      const res = await page.goto(route);
      if (route.includes("404-check")) {
        expect(res?.status(), `${route} should be 404`).toBe(404);
      } else {
        expect(res?.status(), `${route} should not 4xx/5xx`).toBeLessThan(400);
      }
    });
  }
});

// ── CTA link crawl ───────────────────────────────────────────────

test.describe("internal links on public pages", () => {
  // High-traffic pages only — crawling every page would be redundant
  // since navlinks appear on all of them.
  const CRAWL_PAGES = ["/", "/explore", "/for-creators", "/how-it-works", "/faq"];

  for (const route of CRAWL_PAGES) {
    test(`all internal links on ${route} resolve`, async ({ page, request }) => {
      await page.goto(route);
      const links = await collectInternalLinks(page);

      const broken: string[] = [];
      await Promise.all(
        links.map(async (href) => {
          try {
            const res = await request.get(href);
            if (res.status() >= 400) broken.push(`${href} → ${res.status()}`);
          } catch {
            broken.push(`${href} → network error`);
          }
        })
      );

      expect(
        broken,
        `Broken links on ${route}:\n${broken.join("\n")}`
      ).toHaveLength(0);
    });
  }
});

// ── Redirect chain check ──────────────────────────────��──────────

test.describe("redirect chains", () => {
  const REDIRECTS: Array<{ from: string; to: string; finalContains: string }> = [
    { from: "/sign-up",      to: "/register",       finalContains: "/register" },
    { from: "/signup",       to: "/register",       finalContains: "/register" },
    // /admin redirects to /dashboard which is auth-gated → /login?redirectTo=/dashboard
    { from: "/admin",        to: "/dashboard",      finalContains: "dashboard" },
    { from: "/refund-policy", to: "/terms",         finalContains: "/terms" },
    // /apply/pm → /apply/creator → /register?role=creator (apply/creator redirects to register)
    { from: "/apply/pm",    to: "/apply/creator",   finalContains: "creator" },
  ];

  for (const { from, to, finalContains } of REDIRECTS) {
    test(`${from} → ${to}`, async ({ page }) => {
      await page.goto(from);
      expect(page.url(), `${from} should redirect toward ${to}`).toContain(finalContains);
    });
  }
});
