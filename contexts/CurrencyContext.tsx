"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type Currency = "SGD" | "USD";

/**
 * Display-only fallback. Used when the server didn't pass an
 * `initialUsdToSgd` for some reason (legacy callers, or the upstream
 * FX fetch failed and `lib/currency/sgd-rate.ts` returned its own
 * fallback). Actual Stripe charges always settle in SGD — this rate
 * only affects what the backer *sees* when they toggle to USD.
 */
const FALLBACK_USD_TO_SGD = 1.35;

// Re-exported as constants for legacy call sites that imported them
// directly. New code should prefer `useCurrency().usdToSgd` so the
// live rate is used. Kept here as the safe baseline.
export const USD_TO_SGD = FALLBACK_USD_TO_SGD;
export const SGD_TO_USD = 1 / USD_TO_SGD;

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Live USD → SGD rate (24h-cached server-side, falls back to 1.35 on upstream failure). */
  usdToSgd: number;
  /** Convert an SGD amount to the display currency */
  convert: (sgd: number) => number;
  /** Format a value in the display currency */
  format: (value: number) => string;
  /** Convert a user-entered amount back to SGD */
  toSgd: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "SGD",
  setCurrency: () => {},
  usdToSgd: FALLBACK_USD_TO_SGD,
  convert: (n) => n,
  format: (n) => `S$${n}`,
  toSgd: (n) => n,
});

export function CurrencyProvider({
  children,
  initialUsdToSgd,
}: {
  children: React.ReactNode;
  /**
   * Server-fetched USD→SGD rate, passed in from the root layout via
   * `getUsdToSgdRate()`. If omitted, falls back to the hardcoded
   * constant — keeps backward compat for any caller that mounts this
   * provider without the prop.
   */
  initialUsdToSgd?: number;
}) {
  const [currency, setCurrency] = useState<Currency>("SGD");
  const usdToSgd =
    initialUsdToSgd && initialUsdToSgd > 0 ? initialUsdToSgd : FALLBACK_USD_TO_SGD;
  const sgdToUsd = 1 / usdToSgd;

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      usdToSgd,
      convert: (sgd: number) => (currency === "USD" ? sgd * sgdToUsd : sgd),
      format: (v: number) => {
        if (currency === "USD") {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(v);
        }
        return new Intl.NumberFormat("en-SG", {
          style: "currency",
          currency: "SGD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(v);
      },
      toSgd: (amount: number) => (currency === "USD" ? amount * usdToSgd : amount),
    }),
    [currency, usdToSgd, sgdToUsd],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
