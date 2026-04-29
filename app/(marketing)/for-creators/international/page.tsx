import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { InternationalInterestForm } from "@/components/marketing/InternationalInterestForm";

export const metadata = {
  title: "International creators — get that bread",
  description:
    "get that bread is Singapore-only for now. Tell us where you're based and we'll let you know when we open in your country.",
};

export default function InternationalCreatorsPage() {
  return (
    <div className="bg-[var(--color-surface)]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.18} size="640px 320px" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <div className="mb-6 flex justify-center">
            <BackLink href="/for-creators">Back to For Creators</BackLink>
          </div>
          <Eyebrow variant="brand" className="mb-3.5">
            International creators
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.02] text-[clamp(36px,6vw,56px)] m-0 text-[var(--color-ink)]">
            We&apos;re Singapore-first — for now.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            Reward-based crowdfunding regulations, payment rails, and creator
            verification differ by country. We&apos;re doing Singapore properly
            before opening elsewhere — but we&apos;d love to know you&apos;re
            interested. Drop your details and we&apos;ll email you when we open
            in your country.
          </p>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <InternationalInterestForm />
          </div>
        </section>
      </ScrollReveal>

      {/* ── Reassurance ──────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
            <Eyebrow variant="muted" className="mb-3">
              While you wait
            </Eyebrow>
            <h2 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-[var(--color-ink)]">
              Curious how the platform works?
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)]">
              The same mechanics — milestone-based escrow, all-or-nothing funding,
              local payments — will apply when you launch with us later.
            </p>
            <p className="mt-5">
              <Link
                href="/how-it-works"
                className="text-sm sm:text-base font-semibold text-[var(--color-brand-crust)] hover:underline inline-flex items-center gap-1.5 hover:gap-2 transition-all"
              >
                See how a campaign runs
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </section>
      </ScrollReveal>

      <div className="flex justify-center py-10 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <BackToTop />
      </div>
    </div>
  );
}
