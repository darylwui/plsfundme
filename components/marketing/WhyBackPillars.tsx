import Link from "next/link";
import { Sparkles, Gift, ShieldCheck, ArrowRight } from "lucide-react";

const PILLARS = [
  {
    icon: Sparkles,
    title: "Back Singapore's next big thing.",
    body: "Singaporean creators are building the next cult product, the next must-try spot, the next thing everyone's talking about. Be there before it's mainstream.",
    tone: "crust" as const,
  },
  {
    icon: Gift,
    title: "Get rewards you can't buy anywhere else.",
    body: "Limited-edition merch. Early-bird pricing. Founder's dinners. Backers get access to things that never hit shelves.",
    tone: "golden" as const,
  },
  {
    icon: ShieldCheck,
    title: "Zero risk. No goal, no charge.",
    body: "Your card is only charged if the campaign hits its full goal. If it doesn't, you don't pay a cent.",
    tone: "crustDark" as const,
    link: { href: "/backer-protection", label: "How your pledge is protected" },
  },
];

const TONE_STYLES = {
  crust: {
    chip: "bg-[var(--color-brand-crust)] text-white",
    shadow: "shadow-[var(--shadow-cta)]",
  },
  golden: {
    chip: "bg-[var(--color-brand-golden)] text-white",
    shadow: "shadow-[0_4px_20px_0_rgba(217,119,6,0.35)]",
  },
  crustDark: {
    chip: "bg-[var(--color-brand-crust-dark)] text-white",
    shadow: "shadow-[0_4px_20px_0_rgba(74,34,8,0.35)]",
  },
};

export function WhyBackPillars() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {PILLARS.map(({ icon: Icon, title, body, tone, link }) => {
        const styles = TONE_STYLES[tone];
        return (
          <div
            key={title}
            className="flex flex-col gap-4 p-6 md:p-7 rounded-[var(--radius-card)] bg-[var(--color-surface)] ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)]"
          >
            <div
              className={`w-11 h-11 rounded-[var(--radius-card)] flex items-center justify-center ${styles.chip} ${styles.shadow}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-[var(--color-ink)] leading-tight">
              {title}
            </h3>
            <p className="text-[var(--color-ink-muted)] leading-relaxed text-[15px] flex-1">
              {body}
            </p>
            {link && (
              <Link
                href={link.href}
                className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)] hover:gap-2 transition-all"
              >
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
