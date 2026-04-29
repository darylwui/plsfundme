import type { Metadata } from "next";
import { LegalTabs, type LegalTabId } from "@/components/legal/LegalTabs";
import { TermsContent } from "@/components/legal/TermsContent";
import { RefundContent } from "@/components/legal/RefundContent";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";

const META: Record<LegalTabId, { title: string; description: string }> = {
  terms: {
    title: "Terms of Service — get that bread",
    description: "Terms of Service for get that bread, Singapore's reward-based crowdfunding platform.",
  },
  refund: {
    title: "Refund & dispute policy — get that bread",
    description:
      "When and how backers get refunded on get that bread — milestone-based escrow, two-stage disputes, full refunds including platform fee.",
  },
};

const HERO: Record<LegalTabId, { eyebrow: string; heading: string; lede: string }> = {
  terms: {
    eyebrow: "Terms of Service",
    heading: "The rules of the road, in plain language.",
    lede: "What you agree to when you back a campaign or launch one. Written to be read, not just to satisfy a lawyer.",
  },
  refund: {
    eyebrow: "Refund & dispute policy",
    heading: "When and how money comes back to you.",
    lede: "Milestone-based escrow, a two-stage dispute process, and full pledge refunds — including our 5% platform fee — when things go wrong.",
  },
};

interface TermsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ searchParams }: TermsPageProps): Promise<Metadata> {
  const { tab } = await searchParams;
  const key: LegalTabId = tab === "refund" ? "refund" : "terms";
  return META[key];
}

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const { tab } = await searchParams;
  const activeTab: LegalTabId = tab === "refund" ? "refund" : "terms";
  const hero = HERO[activeTab];

  const content = {
    terms: <TermsContent />,
    refund: <RefundContent />,
  };

  return (
    <div className="bg-[var(--color-surface)]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.16} size="640px 320px" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <Eyebrow variant="brand" className="mb-3.5">
            {hero.eyebrow}
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.02] text-[clamp(36px,6vw,56px)] m-0 text-[var(--color-ink)]">
            {hero.heading}
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            {hero.lede}
          </p>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface-raised)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <LegalTabs activeTab={activeTab}>{content[activeTab]}</LegalTabs>
        </div>
      </section>

      <div className="flex justify-center py-10 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <BackToTop />
      </div>
    </div>
  );
}
