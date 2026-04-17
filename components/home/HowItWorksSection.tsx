import Link from "next/link";
import { Pencil, Users, Banknote, ArrowRight } from "lucide-react";

const STEPS = [
  {
    Icon: Pencil,
    step: "01",
    title: "Create your campaign",
    description:
      "Set your funding goal, deadline, and reward tiers. Tell your story — our team reviews and approves within 1–2 days.",
  },
  {
    Icon: Users,
    step: "02",
    title: "Backers fund it",
    description:
      "Share your campaign. Backers pledge via PayNow or credit card. All-or-nothing — no one pays unless you hit your goal.",
  },
  {
    Icon: Banknote,
    step: "03",
    title: "Bring it to life",
    description:
      "Hit your goal? Funds are released to you minus our 5% fee. Miss it? Backers are fully refunded, no questions asked.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-[var(--color-surface-raised)] border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-muted)] mb-4">
              How it works
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "#d97706" }}>
              From idea to funded<br />in three steps.
            </h2>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-violet)] hover:underline shrink-0"
          >
            Full guide <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-6">
          {STEPS.map(({ Icon, step, title, description }) => (
            <div key={step} className="relative flex flex-col gap-4">
              {/* Step number + icon */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[var(--radius-card)] bg-[var(--color-brand-violet)] flex items-center justify-center shrink-0 shadow-[var(--shadow-cta)]">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-mono text-sm md:text-[15px] font-bold text-[var(--color-ink-subtle)] uppercase tracking-[0.2em]">
                  Step {step}
                </span>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-bold text-lg text-[var(--color-ink)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
