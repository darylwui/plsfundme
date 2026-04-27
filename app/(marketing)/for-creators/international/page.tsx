import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { InternationalInterestForm } from "@/components/marketing/InternationalInterestForm";

export const metadata = {
  title: "International creators",
  description:
    "get that bread is Singapore-only for now. Tell us where you're based and we'll let you know when we open in your country.",
};

export default function InternationalCreatorsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-8">
          <BackLink href="/for-creators">Back to For Creators</BackLink>
        </div>

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 mb-4">
            <Globe className="w-4 h-4 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
              International creators
            </span>
          </div>
          <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
            We&apos;re Singapore-first — for now
          </h1>
          <p className="mt-4 text-[var(--color-ink-muted)] text-lg leading-relaxed">
            Reward-based crowdfunding regulations, payment rails, and creator
            verification differ by country. We&apos;re doing Singapore properly
            before opening elsewhere — but we&apos;d love to know you&apos;re
            interested. Drop your details and we&apos;ll email you when we open
            in your country.
          </p>
        </div>

        {/* Form */}
        <InternationalInterestForm />

        {/* Reassurance footer */}
        <div className="mt-10 pt-8 border-t border-[var(--color-border)] text-sm text-[var(--color-ink-muted)] leading-relaxed">
          <p>
            Curious how the platform works while you wait?{" "}
            <Link
              href="/how-it-works"
              className="font-semibold text-[var(--color-brand-crust)] hover:underline"
            >
              See how a campaign runs
            </Link>{" "}
            <ArrowRight className="inline w-3 h-3" /> — same mechanics will
            apply when you launch with us later.
          </p>
        </div>
      </div>
    </div>
  );
}
