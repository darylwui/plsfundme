/**
 * Friendly error messages for Stripe failures during checkout.
 *
 * Stripe surfaces errors with both a `code` and a `message`. The default
 * messages are written for developers ("Your card's security code is
 * incorrect.") and often expose internal details like
 * `payment_intent_authentication_failure` that don't help a backer
 * recover. This helper translates the most common codes into copy a
 * non-technical user can act on.
 *
 * Unmapped codes fall back to the raw Stripe message so we never hide
 * useful information — we only override the cases where we know we can
 * do better.
 *
 * Source for codes: https://docs.stripe.com/error-codes
 */

interface StripeErrorLike {
  code?: string | null;
  decline_code?: string | null;
  message?: string | null;
  type?: string | null;
}

type FriendlyMessage = {
  /** Short, ~50ch — used as the primary error text. */
  title: string;
  /** Optional one-liner with what to do next. */
  hint?: string;
};

// Mapped on `decline_code` (more specific than `code`) when present.
const DECLINE_CODE_MAP: Record<string, FriendlyMessage> = {
  insufficient_funds: {
    title: "Your card doesn't have enough funds.",
    hint: "Try a different card or pledge a smaller amount.",
  },
  expired_card: {
    title: "This card has expired.",
    hint: "Use a different card to complete your pledge.",
  },
  incorrect_cvc: {
    title: "The security code didn't match.",
    hint: "Double-check the 3-digit code on the back of your card.",
  },
  incorrect_number: {
    title: "That card number isn't valid.",
    hint: "Check the digits and try again.",
  },
  card_velocity_exceeded: {
    title: "Your card has been used too many times recently.",
    hint: "Wait a few hours or try a different card.",
  },
  generic_decline: {
    title: "Your bank declined the payment.",
    hint: "Try a different card, or contact your bank to authorize the charge.",
  },
  do_not_honor: {
    title: "Your bank declined the payment.",
    hint: "This usually means you need to call your bank to authorize the charge.",
  },
  fraudulent: {
    title: "Your bank flagged this payment for review.",
    hint: "Contact your bank or try a different card.",
  },
  lost_card: {
    title: "Your bank says this card has been reported lost.",
    hint: "Try a different card.",
  },
  stolen_card: {
    title: "Your bank says this card has been reported stolen.",
    hint: "Try a different card.",
  },
  pickup_card: {
    title: "Your bank declined the payment.",
    hint: "Contact your bank or try a different card.",
  },
};

// Falls back here when there's no `decline_code` but we recognize `code`.
const CODE_MAP: Record<string, FriendlyMessage> = {
  card_declined: {
    title: "Your card was declined.",
    hint: "Try a different card or contact your bank.",
  },
  expired_card: {
    title: "This card has expired.",
    hint: "Use a different card to complete your pledge.",
  },
  incorrect_cvc: {
    title: "The security code didn't match.",
    hint: "Double-check the 3-digit code on the back of your card.",
  },
  incorrect_number: {
    title: "That card number isn't valid.",
    hint: "Check the digits and try again.",
  },
  invalid_expiry_month: { title: "The expiration month is invalid." },
  invalid_expiry_year: { title: "The expiration year is invalid." },
  invalid_number: { title: "That card number isn't valid." },
  invalid_cvc: { title: "The security code isn't formatted correctly." },
  // 3DS / SCA — most common reason a card-mode pledge fails on first attempt.
  payment_intent_authentication_failure: {
    title: "We couldn't verify you with your bank.",
    hint: "Your bank needs to confirm this payment. Try again and complete the 3D Secure challenge if it appears.",
  },
  setup_intent_authentication_failure: {
    title: "We couldn't verify you with your bank.",
    hint: "Your bank needs to confirm this card. Try again and complete the 3D Secure challenge if it appears.",
  },
  // Network / Stripe-internal hiccups.
  processing_error: {
    title: "Something went wrong processing your card.",
    hint: "Wait a moment and try again — your card hasn't been charged.",
  },
  // The user dismissed/cancelled the redirect or 3DS challenge.
  payment_intent_unexpected_state: {
    title: "Your payment didn't complete.",
    hint: "Tap pay again to retry — your card hasn't been charged.",
  },
};

/**
 * Translate a Stripe error into UI-friendly copy.
 *
 * Returns a single string; if a hint exists, it's appended after the
 * title. Callers that want to render hint as a separate line can use
 * the lower-level `mapStripeError` helper below.
 */
export function getFriendlyStripeError(err: StripeErrorLike | null | undefined): string {
  const mapped = mapStripeError(err);
  if (!mapped) return "Payment failed. Please try again.";
  return mapped.hint ? `${mapped.title} ${mapped.hint}` : mapped.title;
}

export function mapStripeError(err: StripeErrorLike | null | undefined): FriendlyMessage | null {
  if (!err) return null;

  // Most specific first: decline_code beats code beats raw message.
  if (err.decline_code && DECLINE_CODE_MAP[err.decline_code]) {
    return DECLINE_CODE_MAP[err.decline_code];
  }
  if (err.code && CODE_MAP[err.code]) {
    return CODE_MAP[err.code];
  }
  // Fall back to Stripe's raw message — better than a vague "payment failed"
  // since it might still contain useful info (e.g. unmapped decline codes).
  if (err.message) {
    return { title: err.message };
  }
  return null;
}
