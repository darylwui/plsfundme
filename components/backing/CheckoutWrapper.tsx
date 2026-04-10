"use client";

import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe/client";
import { CheckoutForm } from "./CheckoutForm";
import type { ProjectWithRelations } from "@/types/project";
import type { Reward } from "@/types/reward";
import type { PaymentMethodType } from "@/types/database.types";
import type { CreatePledgeResponse } from "@/types/pledge";

interface CheckoutWrapperProps {
  project: ProjectWithRelations;
  selectedReward: Reward | null;
  initialAmount: number;
}

export function CheckoutWrapper({
  project,
  selectedReward,
  initialAmount,
}: CheckoutWrapperProps) {
  const [data, setData] = useState<CreatePledgeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function createIntent() {
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          reward_id: selectedReward?.id ?? null,
          amount_sgd: initialAmount,
          payment_method: "card" as PaymentMethodType,
          is_anonymous: false,
          backer_note: null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to initialize checkout.");
      } else {
        setData(json as CreatePledgeResponse);
      }
      setLoading(false);
    }
    createIntent();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-violet)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[var(--radius-card)] bg-red-50 border border-red-200 p-5 text-sm text-red-600">
        {error ?? "Something went wrong. Please try again."}
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: data.client_secret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#7C3AED",
            borderRadius: "10px",
            fontFamily: "inherit",
          },
        },
      }}
    >
      <CheckoutForm
        project={project}
        selectedReward={selectedReward}
        initialAmount={initialAmount}
        clientSecret={data.client_secret}
        pledgeId={data.pledge_id}
        intentType={data.type}
      />
    </Elements>
  );
}
