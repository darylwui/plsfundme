"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSgd } from "@/lib/utils/currency";
import { useCurrency, SGD_TO_USD, USD_TO_SGD } from "@/contexts/CurrencyContext";
import type { ProjectWithRelations } from "@/types/project";
import type { Reward } from "@/types/reward";
import type { PaymentMethodType } from "@/types/database.types";
import type { CreatePledgeResponse } from "@/types/pledge";

interface CheckoutFormProps {
  project: ProjectWithRelations;
  selectedReward: Reward | null;
  initialAmount: number;
  clientSecret: string;
  pledgeId: string;
  intentType: "payment_intent" | "setup_intent";
  paymentMethod?: "card" | "paynow";
}

export function CheckoutForm({
  project,
  selectedReward,
  initialAmount,
  clientSecret,
  pledgeId,
  intentType,
  paymentMethod = "card",
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // displayAmount is what the user sees/types in their chosen currency
  const [displayAmount, setDisplayAmount] = useState(
    currency === "USD"
      ? Math.ceil(initialAmount * SGD_TO_USD)
      : initialAmount
  );

  // The real SGD amount used for Stripe — always rounded to whole dollars
  const sgdAmount = currency === "USD"
    ? Math.round(displayAmount * USD_TO_SGD)
    : displayAmount;

  const platformFee = sgdAmount * 0.05;

  // Minimum in display currency
  const minSgd = selectedReward?.minimum_pledge_sgd ?? 1;
  const minDisplay = currency === "USD" ? Math.ceil(minSgd * SGD_TO_USD) : minSgd;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const returnUrl = `${window.location.origin}/backing/confirmation?pledge=${pledgeId}`;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Payment failed.");
      setLoading(false);
      return;
    }

    let result;
    if (intentType === "setup_intent") {
      result = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
      });
    } else {
      result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
      });
    }

    if (result.error) {
      setError(result.error.message ?? "Payment failed.");
      setLoading(false);
    }
  }

  const currencyPrefix = currency === "USD" ? "US$" : "S$";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Order summary */}
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-5">
        <h3 className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
          Your pledge
        </h3>
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1">
            <p className="font-bold text-[var(--color-ink)]">{project.title}</p>
            {selectedReward && (
              <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
                Reward: {selectedReward.title}
              </p>
            )}
          </div>
        </div>

        {/* Amount input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-ink)]">
            Pledge amount ({currency})
            {selectedReward && (
              <span className="text-[var(--color-ink-subtle)] font-normal ml-1">
                — min {currencyPrefix}{minDisplay}
              </span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-ink-muted)]">
              {currencyPrefix}
            </span>
            <input
              type="number"
              min={minDisplay}
              step={1}
              value={displayAmount}
              onChange={(e) => setDisplayAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] pl-10 pr-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
            />
          </div>
          {currency === "USD" && (
            <p className="text-xs text-[var(--color-ink-subtle)]">
              ≈ {formatSgd(sgdAmount)} SGD charged · Rate: 1 USD = {USD_TO_SGD.toFixed(2)} SGD
            </p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-[var(--color-ink-muted)]">
            <span>Platform fee (5%)</span>
            <span>{formatSgd(platformFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-[var(--color-ink)]">
            <span>Total charged (SGD)</span>
            <span>{formatSgd(sgdAmount)}</span>
          </div>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
          {paymentMethod === "paynow" ? "Scan to pay" : "Card details"}
        </h3>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <PaymentElement
            options={{
              layout: "auto",
            }}
          />
        </div>
        {paymentMethod === "paynow" && (
          <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
            Open your bank app and scan the QR code to complete payment instantly. Refunded automatically if the campaign misses its goal — see our{" "}
            <a href="/backer-protection" className="underline hover:text-[var(--color-ink-muted)]">
              backer protection
            </a>
            .
          </p>
        )}
        {paymentMethod === "card" && (
          <p className="mt-2 text-xs text-[var(--color-ink-subtle)]">
            Your card will only be charged if the campaign reaches its goal. See our{" "}
            <a href="/backer-protection" className="underline hover:text-[var(--color-ink-muted)]">
              backer protection
            </a>
            .
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-[var(--color-brand-danger)]">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth loading={loading || !stripe}>
        Confirm pledge — {formatSgd(sgdAmount)}
      </Button>

      <p className="text-xs text-center text-[var(--color-ink-subtle)] flex items-center justify-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        You&apos;re only charged if the campaign reaches its goal by{" "}
        {new Date(project.deadline).toLocaleDateString("en-SG")}
      </p>

      <p className="text-xs text-center text-[var(--color-ink-subtle)] leading-relaxed">
        By confirming, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-[var(--color-ink)]">
          Terms of Service
        </Link>
        ,{" "}
        <Link href="/privacy" className="underline hover:text-[var(--color-ink)]">
          Privacy Policy
        </Link>
        , and{" "}
        <Link href="/terms?tab=refund" className="underline hover:text-[var(--color-ink)]">
          Refund &amp; Dispute Policy
        </Link>
        .
      </p>
    </form>
  );
}
