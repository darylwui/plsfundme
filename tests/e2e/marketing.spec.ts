import { test, expect } from "@playwright/test";

/**
 * Marketing surface smoke tests.
 *
 * Goal: catch regressions in public, pre-auth pages — the first
 * thing every visitor hits. Anything broken here is broken for
 * 100% of traffic.
 *
 * These tests are deliberately shallow:
 *  - no DB seeding
 *  - no Stripe / PayNow flows
 *  - no auth
 * Deeper end-to-end coverage (signup → pledge, creator apply →
 * approve → publish, milestone submit → release) is a follow-up
 * and lives in its own spec files once we have test fixtures.
 */

test.describe("marketing pages", () => {
  test("home renders with brand headline + primary CTAs", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status(), "homepage should not 4xx/5xx").toBeLessThan(400);

    // Headline copy lives in two spans — match the orange "get that bread"
    // half since it's the most distinctive.
    await expect(page.getByRole("heading", { name: /get that bread/i })).toBeVisible();

    // Both primary CTAs reachable from the hero.
    await expect(page.getByRole("link", { name: /Start for free/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Explore projects/i })).toBeVisible();
  });

  test("explore renders the gallery shell", async ({ page }) => {
    const response = await page.goto("/explore");
    expect(response?.status()).toBeLessThan(400);

    await expect(
      page.getByRole("heading", { name: /Explore projects/i }),
    ).toBeVisible();
  });

  test("for-creators renders the conversion hero", async ({ page }) => {
    const response = await page.goto("/for-creators");
    expect(response?.status()).toBeLessThan(400);

    // Hero headline.
    await expect(page.getByRole("heading", { name: /Be one of the first/i })).toBeVisible();

    // Primary CTA + the international-creators escape hatch we just
    // landed (#123). Catches regressions if either link goes 404.
    await expect(page.getByRole("link", { name: /Apply to launch/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /overseas founder/i }),
    ).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
