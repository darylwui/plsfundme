"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StripeConnectButton({ isConnected }: { isConnected: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
    const { url, error } = await res.json();
    if (error) { setLoading(false); return; }
    window.location.href = url;
  }

  if (isConnected) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-lime)]">
        <CheckCircle className="w-4 h-4" />
        Connected
      </div>
    );
  }

  return (
    <Button loading={loading} onClick={handleConnect}>
      <ExternalLink className="w-4 h-4" />
      Connect Stripe account
    </Button>
  );
}
