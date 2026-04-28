import { unstable_cache } from "next/cache";

/**
 * Live USD → SGD exchange-rate fetcher with conservative defaults.
 *
 * The display rate on the marketing surface (used by `CurrencyContext`
 * to convert pledge amounts when a backer toggles to USD) was hardcoded
 * to 1.35 — fine on day one, increasingly wrong as the market drifts.
 * This helper fetches the rate from a free public endpoint, caches the
 * result for 24h via `unstable_cache`, and falls back to the hardcoded
 * value if the fetch fails so the site never breaks on a transient
 * upstream hiccup.
 *
 * Caller side (root layout server component):
 *   const rate = await getUsdToSgdRate();
 *   <CurrencyProvider initialUsdToSgd={rate}>...</CurrencyProvider>
 *
 * The displayed rate is intentionally the *display only* — actual
 * Stripe charges always settle in SGD, so a small drift here doesn't
 * affect what the backer is billed, only what they see in the UI.
 */

const FALLBACK_USD_TO_SGD = 1.35;

// Sane bounds — anything wildly outside this range is almost certainly
// a bad upstream response (parse error, decimal-shift, etc.). Reject
// and use the fallback rather than display nonsense.
const MIN_PLAUSIBLE_USD_TO_SGD = 1.1;
const MAX_PLAUSIBLE_USD_TO_SGD = 1.6;

const fetchRate = async (): Promise<number> => {
  try {
    // open.er-api.com is free, no API key needed, ~99% uptime, returns
    // ECB rates updated daily. If we hit reliability issues later we
    // can swap to exchangerate.host or a paid tier — same shape.
    const res = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      // 5s timeout via AbortSignal — never hold up a page render on
      // a slow upstream. Falls through to FALLBACK on timeout.
      { signal: AbortSignal.timeout(5_000) },
    );
    if (!res.ok) return FALLBACK_USD_TO_SGD;
    const json: unknown = await res.json();
    if (
      typeof json === "object" &&
      json !== null &&
      "rates" in json &&
      typeof (json as { rates?: unknown }).rates === "object"
    ) {
      const rates = (json as { rates: Record<string, unknown> }).rates;
      const sgd = rates.SGD;
      if (
        typeof sgd === "number" &&
        sgd >= MIN_PLAUSIBLE_USD_TO_SGD &&
        sgd <= MAX_PLAUSIBLE_USD_TO_SGD
      ) {
        return sgd;
      }
    }
    return FALLBACK_USD_TO_SGD;
  } catch {
    // Network error, JSON parse error, AbortSignal timeout, etc. —
    // silent fallback. Currency display drift is a UX issue, not a
    // page-blocker.
    return FALLBACK_USD_TO_SGD;
  }
};

/**
 * Cached for 24 hours via `unstable_cache`. The actual upstream API
 * updates daily, so anything tighter than that is wasted work.
 */
export const getUsdToSgdRate = unstable_cache(
  fetchRate,
  ["usd-to-sgd-rate-v1"],
  { revalidate: 86_400, tags: ["fx-rate"] },
);

export const FALLBACK_USD_TO_SGD_RATE = FALLBACK_USD_TO_SGD;
