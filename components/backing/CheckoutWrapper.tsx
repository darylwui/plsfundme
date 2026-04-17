"use client";

import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe/client";
import { CheckoutForm } from "./CheckoutForm";
import { Button } from "@/components/ui/button";
import { formatSgd } from "@/lib/utils/currency";
import type { ProjectWithRelations } from "@/types/project";
import type { Reward } from "@/types/reward";
import type { PaymentMethodType } from "@/types/database.types";
import type { CreatePledgeResponse } from "@/types/pledge";

/** Safe PayNow logo with image fallback (no innerHTML) */
function PayNowLogo() {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-2xl" aria-label="PayNow">📱</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/paynow-logo.png"
      alt="PayNow"
      className="w-10 h-10 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

interface PledgeSummaryProps {
  project: ProjectWithRelations;
  selectedReward: Reward | null;
  amount: number;
}

/**
 * Always-visible summary so backers know exactly what they're pledging
 * before they pick a payment method.
 */
function PledgeSummary({ project, selectedReward, amount }: PledgeSummaryProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 flex gap-3">
      {project.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.cover_image_url}
          alt={project.title}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-[var(--color-surface-overlay)] flex items-center justify-center text-2xl shrink-0">
          🍞
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          You&apos;re pledging
        </p>
        <p className="font-black text-xl text-[var(--color-ink)] font-mono">
          {formatSgd(amount)}
        </p>
        <p className="text-sm text-[var(--color-ink-muted)] truncate">
          to <span className="font-semibold text-[var(--color-ink)]">{project.title}</span>
        </p>
        <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5 truncate">
          {selectedReward
            ? `Reward: ${selectedReward.title}`
            : "No reward selected"}
        </p>
      </div>
    </div>
  );
}

interface CheckoutWrapperProps {
  project: ProjectWithRelations;
  selectedReward: Reward | null;
  initialAmount: number;
}

type PayMethod = "card" | "paynow";

export function CheckoutWrapper({
  project,
  selectedReward,
  initialAmount,
}: CheckoutWrapperProps) {
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [data, setData] = useState<CreatePledgeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function selectMethod(method: PayMethod) {
    setPayMethod(method);
    setError(null);
    setLoading(true);

    const res = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: project.id,
        reward_id: selectedReward?.id ?? null,
        amount_sgd: initialAmount,
        payment_method: method as PaymentMethodType,
        is_anonymous: false,
        backer_note: null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to initialize checkout.");
      setPayMethod(null);
    } else {
      setData(json as CreatePledgeResponse);
    }
    setLoading(false);
  }

  // Phase 1: Payment method selector
  if (!payMethod || (!data && !loading)) {
    return (
      <div className="flex flex-col gap-5">
        <PledgeSummary
          project={project}
          selectedReward={selectedReward}
          amount={initialAmount}
        />

        <div>
          <h3 className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
            How would you like to pay?
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* PayNow */}
            <button
              onClick={() => selectMethod("paynow")}
              disabled={loading}
              className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 text-left transition-all hover:border-[var(--color-brand-amber)] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EB2226]/10 flex items-center justify-center">
                <PayNowLogo />
              </div>
              <div>
                <p className="font-bold text-[var(--color-ink)] text-sm">PayNow</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Scan QR to pay
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--color-brand-coral)] bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                Charged now · refunded if goal fails
              </span>
            </button>

            {/* Card */}
            <button
              onClick={() => selectMethod("card")}
              disabled={loading}
              className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 text-left transition-all hover:border-[var(--color-brand-amber)] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl">
                💳
              </div>
              <div>
                <p className="font-bold text-[var(--color-ink)] text-sm">Credit / Debit</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Visa, Mastercard, Amex
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--color-brand-lime)] bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                Only charged if goal is met
              </span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--color-brand-violet)] border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-[var(--radius-btn)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-[var(--color-brand-coral)]">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Phase 2: Loading intent
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-violet)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--color-ink-muted)]">
          Preparing secure checkout…
        </p>
      </div>
    );
  }

  // Phase 3: Stripe Elements
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: data.client_secret,
        fonts: [
          {
            cssSrc:
              "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap",
          },
        ],
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#92400E",
            colorBackground: "var(--color-surface, #FFFBF5)",
            colorText: "#1C1208",
            colorDanger: "#C2410C",
            borderRadius: "10px",
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSizeBase: "14px",
          },
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <PledgeSummary
          project={project}
          selectedReward={selectedReward}
          amount={initialAmount}
        />

        {/* Back to method selector */}
        <button
          onClick={() => { setPayMethod(null); setData(null); }}
          className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors w-fit"
        >
          ← Change payment method
        </button>

        <CheckoutForm
          project={project}
          selectedReward={selectedReward}
          initialAmount={initialAmount}
          clientSecret={data.client_secret}
          pledgeId={data.pledge_id}
          intentType={data.type}
          paymentMethod={payMethod}
        />
      </div>
    </Elements>
  );
}
