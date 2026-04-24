import {
  CreditCard,
  Landmark,
  CheckCircle2,
  Truck,
  type LucideIcon,
} from "lucide-react";

type Stage = {
  Icon: LucideIcon;
  label: string;
  title: string;
  body: string;
  tone: "golden" | "crust";
};

const STAGES: Stage[] = [
  {
    Icon: CreditCard,
    label: "01",
    title: "Pledge placed",
    body: "Card authorised, not charged. PayNow held on-platform. Cancel or change any time before the campaign closes.",
    tone: "golden",
  },
  {
    Icon: Landmark,
    label: "02",
    title: "Campaign funds",
    body: "Funds move into escrow. Nothing released to the creator yet — we hold everything until they hit their first milestone.",
    tone: "golden",
  },
  {
    Icon: CheckCircle2,
    label: "03",
    title: "Milestone approved",
    body: "When the creator proves they've hit a milestone (M1 / M2 / M3), that share is released — 40 / 40 / 20. The rest stays in escrow.",
    tone: "golden",
  },
  {
    Icon: Truck,
    label: "04",
    title: "Delivery window",
    body: "If a creator goes silent or misrepresents the project, open a dispute. Milestones 45+ days overdue with no update auto-trigger one.",
    tone: "crust",
  },
];

function toneClasses(tone: Stage["tone"]) {
  if (tone === "golden") {
    return {
      bg: "bg-[var(--color-brand-golden)]",
      shadow: "shadow-[0_10px_30px_-8px_rgba(217,119,6,0.6)]",
      label: "text-[var(--color-brand-golden)]",
    };
  }
  return {
    bg: "bg-[var(--color-brand-crust)]",
    shadow: "shadow-[var(--shadow-cta)]",
    label: "text-[var(--color-brand-crust)]",
  };
}

export function BackerProtectionTimeline() {
  return (
    <div className="not-prose relative">
      {/* Desktop: horizontal stages with connecting line */}
      <div className="hidden md:grid grid-cols-4 gap-0 relative items-stretch">
        <div className="absolute top-[28px] left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-[var(--color-brand-golden)]/30 via-[var(--color-brand-golden)]/70 to-[var(--color-brand-crust)]/50" />

        {STAGES.map(({ Icon, label, title, body, tone }) => {
          const t = toneClasses(tone);
          return (
            <div
              key={label}
              className="relative flex flex-col items-center text-center px-3 h-full"
            >
              <div
                className={`relative z-10 w-14 h-14 rounded-full ${t.bg} text-white flex items-center justify-center ring-4 ring-[var(--color-surface-raised)] ${t.shadow}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="mt-4 w-full flex-1 flex">
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 w-full flex flex-col gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${t.label}`}
                  >
                    Stage {label}
                  </span>
                  <h3 className="font-bold text-[var(--color-ink)] leading-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical stack with connector */}
      <div className="md:hidden flex flex-col">
        {STAGES.map(({ Icon, label, title, body, tone }, i) => {
          const t = toneClasses(tone);
          const isLast = i === STAGES.length - 1;
          return (
            <div key={label} className="relative flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-12 h-12 rounded-full ${t.bg} text-white flex items-center justify-center ${t.shadow}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {!isLast && (
                  <div className="flex-1 w-0.5 bg-[var(--color-brand-golden)]/30 my-2 min-h-[24px]" />
                )}
              </div>
              <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${t.label}`}
                  >
                    Stage {label}
                  </span>
                  <h3 className="font-bold text-[var(--color-ink)] mt-1 leading-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mt-1.5">
                    {body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
