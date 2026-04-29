import type { Metadata } from "next";
import { Mail, ArrowRight } from "lucide-react";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";

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

// ─── Sidebar nav config — anchors map to <section id="..."> targets ─────────
const GROUPS = [
  { id: "for-backers", label: "For backers", items: BACKER_FAQS, accent: "golden" as const },
  { id: "why-launch", label: "Why launch here", items: LAUNCH_PITCH_FAQS, accent: "crust-dark" as const },
  { id: "for-creators", label: "For creators", items: CREATOR_FAQS, accent: "crust" as const },
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
    <div className="bg-[var(--color-surface)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.18} size="640px 320px" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
          <Eyebrow variant="brand" className="mb-3.5">
            Help &amp; FAQ
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.02] text-[clamp(40px,5.5vw,56px)] m-0 text-[var(--color-ink)]">
            The quick answers, in one place.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            Browse by category on the left. Can&apos;t find what you&apos;re looking for? Email us
            — we answer every message within a business day.
          </p>
        </div>
      </section>

      {/* ── Sidebar + content ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-12 pb-16 md:pb-24 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-14 items-start">
        {/* ── Sticky sidebar nav ──────────────────────────── */}
        <aside className="lg:sticky lg:top-24">
          <Eyebrow variant="muted" className="mb-3.5">
            Browse
          </Eyebrow>
          <nav>
            <ul className="flex flex-col gap-1">
              {GROUPS.map((g) => (
                <li key={g.id}>
                  <a
                    href={`#${g.id}`}
                    className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-[var(--radius-btn)] hover:bg-[var(--color-brand-crumb)] transition-colors"
                  >
                    <span className="text-sm font-medium text-[var(--color-ink)] group-hover:text-[var(--color-brand-crust-dark)]">
                      {g.label}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[var(--color-ink-subtle)] group-hover:text-[var(--color-brand-crust-dark)] tabular-nums">
                      {g.items.length}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* ── Main content: grouped accordions ────────────── */}
        <div className="min-w-0">
          {GROUPS.map((g, i) => (
            <FaqGroup
              key={g.id}
              id={g.id}
              label={g.label}
              accent={g.accent}
              items={g.items}
              first={i === 0}
            />
          ))}
        </div>
      </section>

      {/* ── Contact strip ────────────────────────────────────── */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 md:gap-12 items-center">
          <div>
            <Eyebrow variant="brand" className="mb-3">
              Still stuck?
            </Eyebrow>
            <h2 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-[var(--color-ink)]">
              Email us. A real person replies within a business day.
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-[1.55] text-[var(--color-ink-muted)] max-w-md">
              We&apos;re a Singapore-based team — no chatbot, no ticket queue. Drop us a
              line and we&apos;ll write back.
            </p>
          </div>

          <a
            href="mailto:hello@getthatbread.sg"
            className="group rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 sm:p-7 flex flex-col gap-2.5 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-brand-crust)] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-[var(--color-brand-crust)] text-white flex items-center justify-center shadow-[var(--shadow-cta)]">
                <Mail className="w-4 h-4" />
              </span>
              <Eyebrow variant="crust-dark" size="sm">
                Email
              </Eyebrow>
            </div>
            <h3 className="font-black tracking-[-0.015em] text-lg sm:text-xl m-0 text-[var(--color-ink)]">
              hello@getthatbread.sg
            </h3>
            <p className="text-sm leading-[1.5] text-[var(--color-ink-muted)] m-0">
              For everything except live disputes — we average a few hours during
              Singapore business hours.
            </p>
            <span className="mt-1 text-sm font-semibold text-[var(--color-brand-crust)] inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
              Open mail <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </a>
        </div>
      </section>

      <div className="flex justify-center py-10 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <BackToTop />
      </div>
    </div>
  );
}

// ─── Grouped accordion list ─────────────────────────────────────────────────
type Accent = "golden" | "crust" | "crust-dark";

const ACCENT_TEXT: Record<Accent, string> = {
  golden: "text-[var(--color-brand-golden)]",
  crust: "text-[var(--color-brand-crust)]",
  "crust-dark": "text-[var(--color-brand-crust-dark)]",
};

function FaqGroup({
  id,
  label,
  accent,
  items,
  first,
}: {
  id: string;
  label: string;
  accent: Accent;
  items: Faq[];
  first: boolean;
}) {
  return (
    // scroll-mt-24 keeps the heading visible below the navbar when the user
    // jumps via the sidebar anchor link.
    <section id={id} className={`scroll-mt-24 ${first ? "" : "mt-12 md:mt-16"}`}>
      {/* Group heading — uses the Eyebrow primitive but with one-off styling
          to match the draft's bolder mono label */}
      <div
        className={`font-mono text-[11px] font-bold uppercase tracking-[0.22em] mb-4 md:mb-5 ${ACCENT_TEXT[accent]}`}
      >
        {label}
      </div>

      <ul className="border-t border-[var(--color-border)]">
        {items.map((faq) => (
          <li key={faq.q} className="border-b border-[var(--color-border)]">
            <details className="group">
              <summary className="cursor-pointer list-none flex items-start gap-4 py-5 sm:py-6">
                <h3 className="flex-1 font-bold tracking-[-0.015em] leading-[1.35] text-base sm:text-lg text-[var(--color-ink)] m-0">
                  {faq.q}
                </h3>
                <span
                  aria-hidden
                  className="font-mono text-xl text-[var(--color-ink-subtle)] w-5 text-center shrink-0 mt-0.5 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="pb-6 pr-8 sm:pr-12 text-sm sm:text-base leading-[1.65] text-[var(--color-ink-muted)] max-w-[68ch]">
                {faq.a}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

