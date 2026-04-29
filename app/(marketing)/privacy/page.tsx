import type { Metadata } from "next";
import { PrivacyContent } from "@/components/legal/PrivacyContent";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";

export const metadata: Metadata = {
  title: "Privacy Policy — get that bread",
  description:
    "How get that bread collects, uses, and protects your personal data under Singapore's PDPA.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-[var(--color-surface)]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.16} size="640px 320px" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <Eyebrow variant="brand" className="mb-3.5">
            Privacy policy
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.02] text-[clamp(36px,6vw,56px)] m-0 text-[var(--color-ink)]">
            What we collect, and what we never do with it.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            How we handle your personal data under Singapore&apos;s PDPA — what we
            store, how we use it, and the controls you have over it.
          </p>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface-raised)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <PrivacyContent />
        </div>
      </section>

      <div className="flex justify-center py-10 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <BackToTop />
      </div>
    </div>
  );
}
