import { describe, it, expect } from "vitest";
import {
  getFriendlyStripeError,
  mapStripeError,
} from "@/lib/stripe/error-messages";

describe("getFriendlyStripeError", () => {
  it("returns a fallback when error is null/undefined", () => {
    expect(getFriendlyStripeError(null)).toBe("Payment failed. Please try again.");
    expect(getFriendlyStripeError(undefined)).toBe("Payment failed. Please try again.");
  });

  it("prefers decline_code over code when both are present", () => {
    const result = getFriendlyStripeError({
      code: "card_declined",
      decline_code: "insufficient_funds",
      message: "Your card was declined.",
    });
    expect(result).toContain("doesn't have enough funds");
  });

  it("falls back to code when no decline_code", () => {
    const result = getFriendlyStripeError({
      code: "expired_card",
      message: "Card expired.",
    });
    expect(result).toContain("expired");
  });

  it("rewrites payment_intent_authentication_failure to actionable copy", () => {
    const result = getFriendlyStripeError({
      code: "payment_intent_authentication_failure",
      message: "We are unable to authenticate your payment method.",
    });
    expect(result).toContain("3D Secure");
  });

  it("falls back to raw message for unmapped codes", () => {
    const result = getFriendlyStripeError({
      code: "some_brand_new_code_we_dont_know",
      message: "Stripe says: try again later.",
    });
    expect(result).toBe("Stripe says: try again later.");
  });

  it("uses generic fallback when the error has no usable info", () => {
    const result = getFriendlyStripeError({});
    expect(result).toBe("Payment failed. Please try again.");
  });
});

describe("mapStripeError", () => {
  it("returns null for empty input", () => {
    expect(mapStripeError(null)).toBe(null);
    expect(mapStripeError({})).toBe(null);
  });

  it("returns title + hint for known decline codes", () => {
    const result = mapStripeError({ decline_code: "insufficient_funds" });
    expect(result?.title).toBeTruthy();
    expect(result?.hint).toBeTruthy();
  });

  it("returns just the raw message wrapped as title for unmapped errors", () => {
    const result = mapStripeError({ message: "Some unmapped error." });
    expect(result).toEqual({ title: "Some unmapped error." });
  });
});
