import type { Metadata } from "next";
import { CheckCircle2, Rocket, Sparkles, Users } from "lucide-react";
import { BackToTop } from "@/components/ui/back-to-top";

export const metadata: Metadata = {
  title: "FAQ — get that bread",
  description:
    "Answers to the most common questions from backers and creators on get that bread — Singapore's reward-based crowdfunding platform.",
};

type Faq = { q: string; a: React.ReactNode; plain: string };

const LAUNCH_PITCH_FAQS: Faq[] = [
  {
    q: "Why launch your campaign on get that bread?",
    a: (
      <>
        Three reasons that move the needle when you&apos;re trying to fund a campaign.
        <strong> Milestone-based escrow</strong> doubles as a trust signal — backers
        pledge more readily when they can see funds release as you deliver,
        rather than all at once on day one.{" "}
        <strong>Singapore-first</strong> means your local audience finds you faster, with{" "}
        <a
          href="/backer-protection"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          Singapore Consumer Protection Act coverage
        </a>{" "}
        and PayNow checkout that&apos;s frictionless for SG backers. And{" "}
        <strong>simple all-in pricing</strong> — one flat platform fee, payment
        processing included, only billed if you hit your goal.
      </>
    ),
    plain:
      "Three reasons that move the needle when you're trying to fund a campaign. Milestone-based escrow doubles as a trust signal — backers pledge more readily when they can see funds release as you deliver, rather than all at once on day one. Singapore-first means your local audience finds you faster, with Singapore Consumer Protection Act coverage and PayNow checkout that's frictionless for SG backers. And simple all-in pricing — one flat platform fee, payment processing included, only billed if you hit your goal.",
  },
  {
    q: "How does milestone-based escrow help me as a creator?",
    a: "It's a conversion tool, not just a backer protection. When a backer can see that funds release in stages tied to verified delivery milestones, the pledge feels safer — and they're more likely to back you in the first place. You commit to a small set of milestones up front, and we release each tranche as you submit proof and our team verifies it. Predictable cashflow on your side, structural trust on theirs.",
    plain:
      "It's a conversion tool, not just a backer protection. When a backer can see that funds release in stages tied to verified delivery milestones, the pledge feels safer — and they're more likely to back you in the first place. You commit to a small set of milestones up front, and we release each tranche as you submit proof and our team verifies it. Predictable cashflow on your side, structural trust on theirs.",
  },
  {
    q: "Why is the platform Singapore-only right now?",
    a: (
      <>
        We&apos;re focused on getting Singapore right first — PayNow integration, local
        Consumer Protection Act coverage, ACRA-grounded verification. For Singapore
        creators, that means the platform is built around your audience and you&apos;re
        not competing for attention with global campaigns. Overseas creators can{" "}
        <a
          href="/for-creators/international"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          register interest here
        </a>{" "}
        — we&apos;ll let you know when we open in your country.
      </>
    ),
    plain:
      "We're focused on getting Singapore right first — PayNow integration, local Consumer Protection Act coverage, ACRA-grounded verification. For Singapore creators, that means the platform is built around your audience and you're not competing for attention with global campaigns. Overseas creators can register interest at /for-creators/international — we'll let you know when we open in your country.",
  },
  {
    q: "How does your pricing work?",
    a: "5% of funds raised — payment processing included, no setup fees, no monthly fees, no hidden costs. We only charge if your campaign hits its goal; if it doesn't, you owe nothing. One number, billed once, only on success.",
    plain:
      "5% of funds raised — payment processing included, no setup fees, no monthly fees, no hidden costs. We only charge if your campaign hits its goal; if it doesn't, you owe nothing. One number, billed once, only on success.",
  },
  {
    q: "How does the platform help me build trust with backers?",
    a: (
      <>
        Every layer is designed to reduce backer hesitation. Admin review before launch
        is a vetting signal backers can see. Money sits in escrow after funding,
        released on verified milestones — so backers know you have skin in the game.
        The two-stage dispute process and Singapore Consumer Protection Act coverage
        give backers a clear safety net, which makes pledging feel lower-risk.
        Translation: more pledges, fewer abandoned carts. Full details on our{" "}
        <a
          href="/backer-protection"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          backer protection page
        </a>
        .
      </>
    ),
    plain:
      "Every layer is designed to reduce backer hesitation. Admin review before launch is a vetting signal backers can see. Money sits in escrow after funding, released on verified milestones — so backers know you have skin in the game. The two-stage dispute process and Singapore Consumer Protection Act coverage give backers a clear safety net, which makes pledging feel lower-risk. Translation: more pledges, fewer abandoned carts. Full details on our backer protection page.",
  },
  {
    q: "What does PayNow give me that a card doesn't?",
    a: "From your side as a creator, PayNow charges backers immediately rather than placing a card hold — so committed liquidity is visible from day one, and the campaign feels more momentum-positive to other backers browsing the page. From the backer's side: no card surcharge, no shared card details, and a fast QR flow on mobile. Native to your SG audience.",
    plain:
      "From your side as a creator, PayNow charges backers immediately rather than placing a card hold — so committed liquidity is visible from day one, and the campaign feels more momentum-positive to other backers browsing the page. From the backer's side: no card surcharge, no shared card details, and a fast QR flow on mobile. Native to your SG audience.",
  },
];

const BACKER_FAQS: Faq[] = [
  {
    q: "When am I charged for my pledge?",
    a: "It depends on the payment method. With a credit or debit card, we place a hold on your card and only charge it if the campaign reaches its goal by the deadline. With PayNow, the payment is collected immediately — if the campaign doesn't hit its goal, we refund the full amount to you.",
    plain:
      "It depends on the payment method. With a credit or debit card, we place a hold on your card and only charge it if the campaign reaches its goal by the deadline. With PayNow, the payment is collected immediately — if the campaign doesn't hit its goal, we refund the full amount to you.",
  },
  {
    q: "What happens if the campaign doesn't reach its goal?",
    a: "If the campaign misses its funding goal by the deadline, no one is charged. Card authorisations release automatically (usually within a few days, depending on your bank). PayNow pledges — which are captured immediately — are refunded in full within 5–10 business days.",
    plain:
      "If the campaign misses its funding goal by the deadline, no one is charged. Card authorisations release automatically (usually within a few days, depending on your bank). PayNow pledges — which are captured immediately — are refunded in full within 5–10 business days.",
  },
  {
    q: "What if the creator doesn't deliver their rewards?",
    a: (
      <>
        Creators are legally responsible for fulfilling what they promised. Pledges sit in escrow after a campaign funds and are only released to the creator as they hit milestones — so the platform still holds funds when delivery slips. If a creator goes dark or fails to deliver, you can raise a concern via our two-stage dispute process: the creator has 14 days to respond, and if they don&apos;t, a formal dispute opens. Milestones 45+ days overdue with no update auto-trigger a dispute on your behalf. Full rules, refund amounts, and timelines are in our{" "}
        <a
          href="/terms?tab=refund"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          Refund &amp; Dispute Policy
        </a>
        .
      </>
    ),
    plain:
      "Creators are legally responsible for fulfilling what they promised. Pledges sit in escrow after a campaign funds and are only released to the creator as they hit milestones — so the platform still holds funds when delivery slips. If a creator goes dark or fails to deliver, you can raise a concern via our two-stage dispute process: the creator has 14 days to respond, and if they don't, a formal dispute opens. Milestones 45+ days overdue with no update auto-trigger a dispute on your behalf. Full rules, refund amounts, and timelines are in our Refund & Dispute Policy.",
  },
  {
    q: "Can I cancel or change my pledge?",
    a: (
      <>
        Yes — any time before the campaign ends, cancel or adjust your pledge for free. Once a campaign has successfully funded and funds are captured, refunds follow the rules set out in our{" "}
        <a
          href="/terms?tab=refund"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          Refund &amp; Dispute Policy
        </a>
        : full pledge back on fraud or misrepresentation, funds still in escrow back on good-faith failure, platform fee always refunded.
      </>
    ),
    plain:
      "Yes — any time before the campaign ends, cancel or adjust your pledge for free. Once a campaign has successfully funded and funds are captured, refunds follow the rules set out in our Refund & Dispute Policy: full pledge back on fraud or misrepresentation, funds still in escrow back on good-faith failure, platform fee always refunded.",
  },
  {
    q: "How do you vet creators before they launch?",
    a: "Every campaign goes through admin review before going live. Creators start on the Standard tier, and can earn Creator+ status by completing campaigns successfully or providing external proof (portfolio, prior Kickstarter history, manufacturing endorsement). Creator+ unlocks extended campaign duration and higher pledge limits. Admin review covers identity, campaign legitimacy, and compliance with our Terms — campaigns offering regulated financial products, counterfeit goods, or unlicensed activities are rejected.",
    plain:
      "Every campaign goes through admin review before going live. Creators start on the Standard tier, and can earn Creator+ status by completing campaigns successfully or providing external proof (portfolio, prior Kickstarter history, manufacturing endorsement). Creator+ unlocks extended campaign duration and higher pledge limits. Admin review covers identity, campaign legitimacy, and compliance with our Terms — campaigns offering regulated financial products, counterfeit goods, or unlicensed activities are rejected.",
  },
  {
    q: "What if the reward arrives but it's broken or not what was promised?",
    a: (
      <>
        If the product arrived but isn&apos;t what the creator sold — wrong spec, missing components, materially different from the campaign — contact the creator first. They&apos;re responsible for making it right under Singapore&apos;s Consumer Protection (Fair Trading) Act. If the creator won&apos;t engage, escalate to us and we can mediate or, in serious cases of misrepresentation, treat it as a dispute under our{" "}
        <a
          href="/terms?tab=refund"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          Refund &amp; Dispute Policy
        </a>
        . Shipping damage that happened in transit is a separate issue — raise that with the courier or creator directly.
      </>
    ),
    plain:
      "If the product arrived but isn't what the creator sold — wrong spec, missing components, materially different from the campaign — contact the creator first. They're responsible for making it right under Singapore's Consumer Protection (Fair Trading) Act. If the creator won't engage, escalate to us and we can mediate or, in serious cases of misrepresentation, treat it as a dispute under our Refund & Dispute Policy. Shipping damage that happened in transit is a separate issue — raise that with the courier or creator directly.",
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
  {
    q: "How long does creator verification take, and what do you check?",
    a: "Verification usually takes 1–2 business days. We confirm your identity and the basics of your campaign — that you're a real person based in Singapore, that what you're describing matches what you're capable of delivering, and that it doesn't fall into our restricted categories (regulated financial products, unlicensed activities, counterfeit goods). First-time creators may be asked for examples of past work or a quick call. Once approved, you can launch unlimited campaigns afterward without re-verifying each one.",
    plain:
      "Verification usually takes 1–2 business days. We confirm your identity and the basics of your campaign — that you're a real person based in Singapore, that what you're describing matches what you're capable of delivering, and that it doesn't fall into our restricted categories (regulated financial products, unlicensed activities, counterfeit goods). First-time creators may be asked for examples of past work or a quick call. Once approved, you can launch unlimited campaigns afterward without re-verifying each one.",
  },
  {
    q: "Can I edit my campaign after it goes live?",
    a: "Cosmetic edits (typos, image swaps, additional reward tiers, posts in your Updates section) are allowed any time. But the core promises a backer pledged to — funding goal, milestones, what each reward includes, deadline — are locked once the first pledge clears. Material changes after that require admin approval and may trigger a refund window for backers who pledged before the change.",
    plain:
      "Cosmetic edits (typos, image swaps, additional reward tiers, posts in your Updates section) are allowed any time. But the core promises a backer pledged to — funding goal, milestones, what each reward includes, deadline — are locked once the first pledge clears. Material changes after that require admin approval and may trigger a refund window for backers who pledged before the change.",
  },
  {
    q: "Who owns my project's IP?",
    a: "You do, fully. We don't take equity, IP rights, or any claim over what you create or sell. Your campaign content (description, images, video) remains your copyright — we just need a non-exclusive license to display it on the platform while your campaign is active. If you later want to take everything down, you can.",
    plain:
      "You do, fully. We don't take equity, IP rights, or any claim over what you create or sell. Your campaign content (description, images, video) remains your copyright — we just need a non-exclusive license to display it on the platform while your campaign is active. If you later want to take everything down, you can.",
  },
  {
    q: "What happens if my campaign doesn't reach its goal?",
    a: "All pledges are refunded automatically — backers' card authorizations are cancelled and PayNow funds returned. You owe nothing (the 5% fee is only charged on successful campaigns). You can relaunch a revised campaign whenever you're ready — many successful ones are second or third attempts.",
    plain:
      "All pledges are refunded automatically — backers' card authorizations are cancelled and PayNow funds returned. You owe nothing (the 5% fee is only charged on successful campaigns). You can relaunch a revised campaign whenever you're ready — many successful ones are second or third attempts.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [...BACKER_FAQS, ...LAUNCH_PITCH_FAQS, ...CREATOR_FAQS].map(({ q, plain }) => ({
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

      {/* ── Why launch here ──────────────────────────────────────
          Creator pitch section, positioned at the top of the
          creator funnel: convince → operationalize. The "Launching
          your campaign" mechanics section below answers HOW; this
          section answers WHY. Strongest accent (crust-dark) so it
          reads as the lead within the creator-side content. */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <FaqGroup
            label="Why launch here"
            heading="Why launch on get that bread"
            accent="crust-dark"
            Icon={Sparkles}
            items={LAUNCH_PITCH_FAQS}
          />
        </div>
      </section>

      {/* ── Creator FAQs ─────────────────────────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
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
      <section className="bg-[var(--color-surface-raised)]">
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

      <div className="flex justify-center py-10 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <BackToTop />
      </div>
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
  // "crust-dark" is the deepest brand orange — reserved for the
  // top "Why getthatbread" section so it reads as the lead.
  accent: "golden" | "crust" | "crust-dark";
  Icon: React.ComponentType<{ className?: string }>;
  items: Faq[];
}) {
  const accentColor =
    accent === "golden"
      ? "var(--color-brand-golden)"
      : accent === "crust-dark"
        ? "var(--color-brand-crust-dark)"
        : "var(--color-brand-crust)";
  const accentBg =
    accent === "golden"
      ? "bg-[var(--color-brand-golden)] shadow-[0_4px_20px_0_rgba(217,119,6,0.35)]"
      : accent === "crust-dark"
        ? "bg-[var(--color-brand-crust-dark)] shadow-[0_4px_20px_0_rgba(172,88,17,0.45)]"
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
