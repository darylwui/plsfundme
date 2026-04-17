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
  Lock,
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
      "Pledge via Credit Card (only charged if the campaign reaches its goal) or PayNow (charged instantly; refunded in full if the goal isn't met).",
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
  { label: "If goal not reached", value: "Free — backers refunded in full", highlight: true },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "When am I charged for my pledge?",
    a: "It depends on the payment method. With a credit or debit card, we place a hold on your card and only charge it if the campaign reaches its goal by the deadline. With PayNow, the payment is collected immediately — if the campaign doesn't hit its goal, we refund the full amount to you.",
  },
  {
    q: "What happens if the campaign doesn't reach its goal?",
    a: "All-or-nothing means no one is on the hook. Card holds are released automatically. PayNow pledges are refunded in full within 5–7 business days. Creators receive nothing.",
  },
  {
    q: "When does the creator receive the funds?",
    a: "Once a campaign successfully closes, we hold funds briefly to guard against chargebacks and then release the net amount (total raised minus our 5% platform fee) to the creator's verified Stripe account. Creators typically receive funds within 7–10 business days of a successful close.",
  },
  {
    q: "What if the creator doesn't deliver their rewards?",
    a: "Creators are legally responsible for fulfilling their promises to backers. We vet every campaign before it goes live, and we step in if a creator goes dark — including pausing payouts and facilitating refunds where possible. If you have a concern about a campaign you've backed, email hello@getthatbread.sg.",
  },
  {
    q: "Is my pledge tax-deductible?",
    a: "No. Pledges on get that bread are not donations — they're pre-purchases of a product or experience in exchange for a reward. They're not tax-deductible in Singapore.",
  },
  {
    q: "Who can launch a campaign?",
    a: "Anyone based in Singapore with a valid idea and the ability to fulfill rewards. Creators complete a short verification step before their first campaign goes live, usually within 1–2 business days.",
  },
  {
    q: "What are the fees for creators?",
    a: "A flat 5% platform fee on the funds raised — only charged if the campaign reaches its goal. Standard payment processing is included. No setup fees, monthly fees, or hidden costs.",
  },
  {
    q: "Can I cancel or change my pledge?",
    a: "Yes, you can change or cancel your pledge at any time before the campaign ends. Once the campaign successfully closes and funds are captured, refunds are at the creator's discretion.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111] border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs uppercase tracking-[0.12em] font-medium mb-6">
            The model
          </div>
          <h1 className="text-[40px] md:text-[52px] font-black tracking-tight leading-[1.1] mb-4">
            <span className="text-[#b45309] dark:text-amber-300">How </span>
            <span className="text-[#9a3412] dark:text-orange-300">get that bread</span>
            <span className="text-[#b45309] dark:text-amber-300"> works</span>
          </h1>
          <p className="text-lg text-[var(--color-ink-muted)] leading-relaxed">
            All-or-nothing crowdfunding for Singapore entrepreneurs. Simple, safe, and transparent.
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
              <div className="w-full">
                <h2 className="text-xl font-black mb-2 text-[var(--color-ink)]">
                  All-or-nothing funding
                </h2>
                <p className="text-[var(--color-ink-muted)] leading-relaxed text-left">
                  Backers are only charged if a campaign reaches its full funding goal
                  by the deadline. If the goal isn&apos;t met, no one pays a cent. This
                  protects backers and motivates creators to set realistic, achievable goals.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]">
              <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 h-full flex items-start gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-btn)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-4.5 h-4.5 text-[var(--color-brand-amber)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold mb-1.5 text-[var(--color-ink)]">
                    PayNow &amp; Credit Card
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                    Backers can pledge instantly using local PayNow or major credit cards.
                    Creators benefit from lower checkout friction, so supporters can contribute
                    quickly without complicated payment steps.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]">
              <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 h-full flex items-start gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-btn)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4.5 h-4.5 text-[var(--color-brand-violet)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold mb-1.5 text-[var(--color-ink)]">
                    Secured escrow transactions
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                    Pledges are held securely until campaign end. If a project meets its goal,
                    funds are released to the creator. If not, backers are not charged, giving
                    both sides transparent, low-risk protection.
                  </p>
                </div>
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
              <p className="text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-subtle)]">For creators</p>
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
                    <span className="font-mono text-xs font-bold text-[var(--color-ink-subtle)] uppercase tracking-[0.12em]">
                      Step {step}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-ink)] mb-1.5">{title}</h3>
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed max-w-[38ch] mx-auto">
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
            <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-amber)] flex items-center justify-center shadow-[0_4px_20px_0_rgba(217,119,6,0.35)]">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-subtle)]">For backers</p>
              <h2 className="text-2xl font-black text-[var(--color-ink)]">Support what you believe in</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BACKER_STEPS.map(({ Icon, step, title, description }) => (
              <div
                key={step}
                className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
              >
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 h-full flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-btn)] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-[var(--color-brand-amber)]" />
                    </div>
                    <span className="font-mono text-xs font-bold text-[var(--color-ink-subtle)] uppercase tracking-[0.12em]">
                      Step {step}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-ink)] mb-1.5">{title}</h3>
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed max-w-[38ch] mx-auto">
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
              <p className="text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-subtle)]">Transparent</p>
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
                        ? "text-[var(--color-brand-amber)]"
                        : "text-[var(--color-ink)]"
                    }`}
                  >
                    {highlight && (
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-[var(--color-brand-amber)]" />
                    )}
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-violet)] flex items-center justify-center shadow-[var(--shadow-cta)]">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] font-medium text-[var(--color-ink-subtle)]">Good to know</p>
              <h2 className="text-2xl font-black text-[var(--color-ink)]">Frequently asked questions</h2>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
              >
                <summary className="cursor-pointer rounded-[var(--radius-card)] bg-[var(--color-surface)] px-5 py-4 flex items-center justify-between gap-4 list-none">
                  <span className="font-bold text-[var(--color-ink)] text-sm sm:text-base">{faq.q}</span>
                  <span
                    aria-hidden
                    className="w-6 h-6 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0 transition-transform group-open:rotate-45 text-[var(--color-ink-muted)]"
                  >
                    +
                  </span>
                </summary>
                <div className="rounded-b-[var(--radius-card)] bg-[var(--color-surface)] px-5 pb-5 pt-0 text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <p className="mt-8 text-sm text-[var(--color-ink-subtle)]">
            Still have questions? Email us at{" "}
            <a
              href="mailto:hello@getthatbread.sg"
              className="font-semibold text-[var(--color-brand-violet)] hover:underline"
            >
              hello@getthatbread.sg
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">
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
