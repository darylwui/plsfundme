import { Search, CreditCard, Gift, ArrowRight, type LucideIcon } from "lucide-react";

type Step = {
  Icon: LucideIcon;
  step: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    Icon: Search,
    step: "01",
    title: "Discover projects",
    description:
      "Browse trending campaigns from Singapore entrepreneurs across all categories.",
  },
  {
    Icon: CreditCard,
    step: "02",
    title: "Back with confidence",
    description:
      "Pledge via Credit Card (only charged if the campaign hits its goal) or PayNow (charged instantly; refunded in full if it doesn't).",
  },
  {
    Icon: Gift,
    step: "03",
    title: "Receive your rewards",
    description:
      "Get exclusive rewards from creators as a thank-you for your support.",
  },
];

export function BackerStepper() {
  return (
    <div className="relative">
      {/* Desktop: horizontal connected cards */}
      <div className="hidden md:grid grid-cols-3 gap-0 relative">
        <div className="absolute top-[58px] left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-[var(--color-brand-golden)]/30 via-[var(--color-brand-golden)] to-[var(--color-brand-golden)]/30" />

        {STEPS.map(({ Icon, step, title, description }, i) => (
          <div key={step} className="relative flex flex-col items-center text-center px-4">
            <div className="relative z-10 w-14 h-14 rounded-full bg-[var(--color-brand-golden)] text-white flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(217,119,6,0.6)] ring-4 ring-[var(--color-surface)]">
              <Icon className="w-6 h-6" />
            </div>
            {i < STEPS.length - 1 && (
              <div className="absolute top-[52px] -right-3 z-20 w-6 h-6 rounded-full bg-[var(--color-brand-golden)] flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="mt-4 p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] w-full">
              <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 h-full flex flex-col gap-2">
                <span className="font-mono text-[10px] font-bold text-[var(--color-brand-golden)] uppercase tracking-[0.2em]">
                  Step {step}
                </span>
                <h3 className="font-bold text-[var(--color-ink)]">{title}</h3>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical with connectors */}
      <div className="md:hidden flex flex-col gap-3">
        {STEPS.map(({ Icon, step, title, description }, i) => (
          <div key={step} className="relative">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brand-golden)] text-white flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 w-0.5 bg-[var(--color-brand-golden)]/30 my-2" />
                )}
              </div>
              <div className="flex-1 p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] mb-2">
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
                  <span className="font-mono text-[10px] font-bold text-[var(--color-brand-golden)] uppercase tracking-[0.2em]">
                    Step {step}
                  </span>
                  <h3 className="font-bold text-[var(--color-ink)] mt-1">{title}</h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mt-1.5">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
