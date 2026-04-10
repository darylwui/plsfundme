"use client";

import { createContext, useContext, useState } from "react";

export type Currency = "SGD" | "USD";

// 1 USD = ~1.35 SGD (fixed display rate — actual charges always in SGD)
export const USD_TO_SGD = 1.35;
export const SGD_TO_USD = 1 / USD_TO_SGD;

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
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
  convert: (n) => n,
  format: (n) => `S$${n}`,
  toSgd: (n) => n,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("SGD");

  function convert(sgd: number): number {
    return currency === "USD" ? sgd * SGD_TO_USD : sgd;
  }

  function format(value: number): string {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function toSgd(amount: number): number {
    return currency === "USD" ? amount * USD_TO_SGD : amount;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, toSgd }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
