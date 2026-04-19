import { ArrowRight, Lightbulb } from "lucide-react";

const MAILTO =
  "mailto:hello@getthatbread.sg?subject=Feature%20request&body=Hi%20team%2C%0A%0AHere%27s%20an%20idea%20I%20think%20would%20make%20get%20that%20bread%20better%3A%0A%0A%0A%0AThanks%21";

export function FeatureRequestCard() {
  return (
    <a
      href={MAILTO}
      className="group bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] hover:border-[var(--color-brand-golden)] hover:bg-[var(--color-brand-golden)]/5 transition-colors p-5 flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-full bg-[var(--color-brand-golden)]/10 flex items-center justify-center shrink-0">
        <Lightbulb className="w-5 h-5 text-[var(--color-brand-golden)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[var(--color-ink)]">Got an idea for the platform?</p>
        <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
          Tell us what would make get that bread even better — we read every message.
        </p>
      </div>
      <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-crust)] group-hover:gap-2 transition-all">
        Share idea <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </a>
  );
}
