import Link from "next/link";
import {
  ArrowRight,
  Rocket,
  Users,
  DollarSign,
  Shield,
  FileText,
  Search,
  Target,
  Package,
  CreditCard,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How it works",
  description:
    "All-or-nothing crowdfunding for Singapore entrepreneurs. Simple, safe, and transparent.",
};

const CREATOR_STEPS = [
  {
    Icon: FileText,
    step: "01",
    title: "Create your campaign",
    description:
      "Set your funding goal, deadline, and reward tiers. Tell your story with a compelling description and cover image.",
  },
  {
    Icon: Search,
    step: "02",
    title: "Submit for review",
    description:
      "Our team reviews your campaign within 1–2 business days. Once approved, you go live — then share with your network!",
  },
  {
    Icon: Target,
    step: "03",
    title: "Hit your goal",
    description:
      "If your campaign reaches its funding goal by the deadline, you receive the funds minus our 5% platform fee.",
  },
  {
    Icon: Package,
    step: "04",
    title: "Deliver your rewards",
    description:
      "Fulfill your promises to backers. Keep them updated with campaign posts along the way.",
  },
];

const BACKER_STEPS = [
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
      "Pledge via Credit Card or PayNow. Your payment is only captured if the campaign reaches its goal.",
  },
  {
    Icon: Gift,
    step: "03",
    title: "Receive your rewards",
    description:
      "Get exclusive rewards from creators as a thank-you for your support.",
  },
];

const FEES = [
  { label: "Platform fee", value: "5% of funds raised", highlight: false },
  { label: "Payment processing", value: "Included", highlight: false },
  { label: "If goal not reached", value: "Free — no charges", highlight: true },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111] border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-[0.15em] font-medium mb-6">
            The model
          </div>
          <h1 className="text-[40px] md:text-[52px] font-black tracking-tight leading-[1.1] mb-4">
            <span style={{ color: "#98644F" }}>How </span>
            <span style={{ color: "#C68C5F" }}>get that bread</span>
            <span style={{ color: "#98644F" }}> works</span>
          </h1>
          <p className="text-lg text-[var(--color-ink-muted)] max-w-xl leading-relaxed">
            All-or-nothing crowdfunding for Singapore entrepreneurs.
            Simple, safe, and transparent.
          </p>
        </div>
      </section>

      {/* ── All-or-nothing explainer ──────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]">
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-8 flex gap-5">
              <div className="w-12 h-12 rounded-[var(--radius-card)] bg-[var(--color-brand-violet)] flex items-center justify-center shrink-0 shadow-[var(--shadow-cta)]">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--color-ink)] mb-2">
                  All-or-nothing funding
                </h2>
                <p className="text-[var(--color-ink-muted)] leading-relaxed">
                  Backers are only charged if a campaign reaches its full funding goal
                  by the deadline. If the goal isn&apos;t met, no one pays a cent. This
                  protects backers and motivates creators to set realistic, achievable goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── For creators ─────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-violet)] flex items-center justify-center shadow-[var(--shadow-cta)]">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--color-ink-subtle)]">For creators</p>
              <h2 className="text-2xl font-black text-[var(--color-ink)]">Launch your campaign</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CREATOR_STEPS.map(({ Icon, step, title, description }) => (
              <div
                key={step}
                className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
              >
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 h-full flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-btn)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-[var(--color-brand-violet)]" />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[var(--color-ink-subtle)] uppercase tracking-widest">
                      Step {step}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-ink)] mb-1.5">{title}</h3>
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/projects/create">
              <Button size="lg">
                Start your campaign
                <span className="w-7 h-7 rounded-full bg-[var(--color-brand-violet)]/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── For backers ──────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-teal)] flex items-center justify-center shadow-[0_4px_20px_0_rgba(15,118,110,0.35)]">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--color-ink-subtle)]">For backers</p>
              <h2 className="text-2xl font-black text-[var(--color-ink)]">Support what you believe in</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {BACKER_STEPS.map(({ Icon, step, title, description }) => (
              <div
                key={step}
                className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
              >
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 h-full flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-btn)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-[var(--color-brand-teal)]" />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[var(--color-ink-subtle)] uppercase tracking-widest">
                      Step {step}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-ink)] mb-1.5">{title}</h3>
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/explore">
              <Button variant="secondary" size="lg">
                Explore projects
                <span className="w-7 h-7 rounded-full bg-[var(--color-brand-violet)]/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Fees ─────────────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-amber)] flex items-center justify-center shadow-[0_4px_20px_0_rgba(217,119,6,0.35)]">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--color-ink-subtle)]">Transparent</p>
              <h2 className="text-2xl font-black text-[var(--color-ink)]">Simple, honest fees</h2>
            </div>
          </div>

          <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] max-w-lg">
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] overflow-hidden">
              {FEES.map(({ label, value, highlight }, i) => (
                <div
                  key={label}
                  className={`flex items-center justify-between px-6 py-4 ${
                    i < FEES.length - 1 ? "border-b border-[var(--color-border)]" : ""
                  }`}
                >
                  <span className="text-sm text-[var(--color-ink-muted)]">{label}</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      highlight
                        ? "text-[var(--color-brand-lime)]"
                        : "text-[var(--color-ink)]"
                    }`}
                  >
                    {highlight && (
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-[var(--color-brand-lime)]" />
                    )}
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-[var(--color-ink)] tracking-tight">
              Ready to launch?
            </h2>
            <p className="text-[var(--color-ink-muted)] mt-1">
              Start for free — no upfront costs, no risk to backers.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/projects/create">
              <Button size="lg" variant="inverse">
                Start a project
                <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="secondary">Explore</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
