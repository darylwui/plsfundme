import type { Metadata } from "next";
import { CheckCircle2, Rocket, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ — get that bread",
  description:
    "Answers to the most common questions from backers and creators on get that bread — Singapore's reward-based crowdfunding platform.",
};

type Faq = { q: string; a: React.ReactNode; plain: string };

const BACKER_FAQS: Faq[] = [
  {
    q: "When am I charged for my pledge?",
    a: "It depends on the payment method. With a credit or debit card, we place a hold on your card and only charge it if the campaign reaches its goal by the deadline. With PayNow, the payment is collected immediately — if the campaign doesn't hit its goal, we refund the full amount to you.",
    plain:
      "It depends on the payment method. With a credit or debit card, we place a hold on your card and only charge it if the campaign reaches its goal by the deadline. With PayNow, the payment is collected immediately — if the campaign doesn't hit its goal, we refund the full amount to you.",
  },
  {
    q: "What happens if the campaign doesn't reach its goal?",
    a: "All-or-nothing means no one is on the hook. Card holds are released automatically. PayNow pledges are refunded in full within 5–7 business days. Creators receive nothing.",
    plain:
      "All-or-nothing means no one is on the hook. Card holds are released automatically. PayNow pledges are refunded in full within 5–7 business days. Creators receive nothing.",
  },
  {
    q: "What if the creator doesn't deliver their rewards?",
    a: (
      <>
        Creators are legally responsible for fulfilling their promises to backers. We vet every campaign before it goes live, and we step in if a creator goes dark — including pausing payouts and facilitating refunds where possible. If you have a concern about a campaign you&apos;ve backed, email{" "}
        <a
          href="mailto:hello@getthatbread.sg"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          hello@getthatbread.sg
        </a>
        .
      </>
    ),
    plain:
      "Creators are legally responsible for fulfilling their promises to backers. We vet every campaign before it goes live, and we step in if a creator goes dark — including pausing payouts and facilitating refunds where possible. If you have a concern about a campaign you've backed, email hello@getthatbread.sg.",
  },
  {
    q: "Can I cancel or change my pledge?",
    a: "Yes, you can change or cancel your pledge at any time before the campaign ends. Once the campaign successfully closes and funds are captured, refunds are at the creator's discretion.",
    plain:
      "Yes, you can change or cancel your pledge at any time before the campaign ends. Once the campaign successfully closes and funds are captured, refunds are at the creator's discretion.",
  },
  {
    q: "Is my pledge tax-deductible?",
    a: "No. Pledges on get that bread are not donations — they're pre-purchases of a product or experience in exchange for a reward. They're not tax-deductible in Singapore.",
    plain:
      "No. Pledges on get that bread are not donations — they're pre-purchases of a product or experience in exchange for a reward. They're not tax-deductible in Singapore.",
  },
];

const CREATOR_FAQS: Faq[] = [
  {
    q: "Who can launch a campaign?",
    a: "Anyone based in Singapore with a valid idea and the ability to fulfill rewards. Creators complete a short verification step before their first campaign goes live, usually within 1–2 business days.",
    plain:
      "Anyone based in Singapore with a valid idea and the ability to fulfill rewards. Creators complete a short verification step before their first campaign goes live, usually within 1–2 business days.",
  },
  {
    q: "When do I receive the funds?",
    a: "Once a campaign successfully closes, we hold funds briefly to guard against chargebacks and then release the net amount (total raised minus our 5% platform fee) to your verified Stripe account. Creators typically receive funds within 7–10 business days of a successful close.",
    plain:
      "Once a campaign successfully closes, we hold funds briefly to guard against chargebacks and then release the net amount (total raised minus our 5% platform fee) to your verified Stripe account. Creators typically receive funds within 7–10 business days of a successful close.",
  },
  {
    q: "What are the fees for creators?",
    a: "A flat 5% platform fee on the funds raised — only charged if the campaign reaches its goal. Standard payment processing is included. No setup fees, monthly fees, or hidden costs.",
    plain:
      "A flat 5% platform fee on the funds raised — only charged if the campaign reaches its goal. Standard payment processing is included. No setup fees, monthly fees, or hidden costs.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [...BACKER_FAQS, ...CREATOR_FAQS].map(({ q, plain }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: {
      "@type": "Answer",
      text: plain,
    },
  })),
};

export default function FaqPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-50 via-[#FFFBF5] to-orange-50 dark:from-[#0f0f0f] dark:via-[#0a0a0a] dark:to-[#111111] border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)] text-xs uppercase tracking-[0.12em] font-medium mb-6">
            Good to know
          </div>
          <h1 className="text-[40px] md:text-[52px] font-black tracking-tight leading-[1.1] mb-4">
            Frequently asked questions
          </h1>
          <p className="text-lg text-[var(--color-ink-muted)] leading-relaxed">
            The answers backers and creators ask us most, in one place.
          </p>
        </div>
      </section>

      {/* ── Backer FAQs ──────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <FaqGroup
            label="For backers"
            heading="Before you pledge"
            accent="golden"
            Icon={Users}
            items={BACKER_FAQS}
          />
        </div>
      </section>

      {/* ── Creator FAQs ─────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <FaqGroup
            label="For creators"
            heading="Launching your campaign"
            accent="crust"
            Icon={Rocket}
            items={CREATOR_FAQS}
          />
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-[var(--radius-card)] bg-[var(--color-brand-crust)] flex items-center justify-center shadow-[var(--shadow-cta)] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--color-ink)]">
                Still have questions?
              </h2>
              <p className="mt-1 text-[var(--color-ink-muted)] leading-relaxed">
                Email us at{" "}
                <a
                  href="mailto:hello@getthatbread.sg"
                  className="font-semibold text-[var(--color-brand-crust)] hover:underline"
                >
                  hello@getthatbread.sg
                </a>{" "}
                — we answer every message within a business day.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqGroup({
  label,
  heading,
  accent,
  Icon,
  items,
}: {
  label: string;
  heading: string;
  accent: "golden" | "crust";
  Icon: React.ComponentType<{ className?: string }>;
  items: Faq[];
}) {
  const accentColor =
    accent === "golden" ? "var(--color-brand-golden)" : "var(--color-brand-crust)";
  const accentBg =
    accent === "golden"
      ? "bg-[var(--color-brand-golden)] shadow-[0_4px_20px_0_rgba(217,119,6,0.35)]"
      : "bg-[var(--color-brand-crust)] shadow-[var(--shadow-cta)]";
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div
          className={`w-11 h-11 rounded-[var(--radius-card)] ${accentBg} flex items-center justify-center`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p
            className="text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: accentColor }}
          >
            {label}
          </p>
          <h2 className="text-2xl font-black text-[var(--color-ink)]">{heading}</h2>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((faq) => (
          <details
            key={faq.q}
            className="group p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
          >
            <summary className="cursor-pointer rounded-[var(--radius-card)] bg-[var(--color-surface)] px-5 py-4 flex items-center justify-between gap-4 list-none">
              <span className="font-bold text-[var(--color-ink)] text-sm sm:text-base">
                {faq.q}
              </span>
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
    </div>
  );
}
