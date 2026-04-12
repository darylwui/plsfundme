import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PreFooterCTA() {
  return (
    <section className="bg-gradient-to-br from-[var(--color-brand-violet)] to-[#7A3409]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-[11px] uppercase tracking-[0.15em] font-medium text-white/70 mb-6">
            Ready to launch?
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight mb-4">
            Your campaign could be<br className="hidden sm:block" /> live in 48 hours.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
            No upfront costs. No risk to your backers. All-or-nothing funding means everyone wins or no one pays.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/projects/create">
              <Button
                size="lg"
                className="bg-[var(--color-brand-gold)] text-[var(--color-ink)] hover:bg-[#F5D090] active:scale-[0.98] active:shadow-none shadow-lg font-bold"
              >
                Start for free
                <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button
                size="lg"
                className="bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-[0.98]"
              >
                Learn how it works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
