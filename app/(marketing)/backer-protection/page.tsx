import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  ShieldCheck,
  Wallet,
  Layers,
  CircleCheck,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { TrustMoneyFlow } from "@/components/marketing/TrustMoneyFlow";

export const metadata: Metadata = {
  title: "Backer protection — get that bread",
  description:
    "How your pledge is protected on get that bread. All-or-nothing funding, Stripe escrow, milestone releases, and a real human on the other end of every dispute.",
};

const CONTACT_EMAIL = "hello@getthatbread.sg";

export default function BackerProtectionPage() {
  return (
    <div className="bg-[var(--color-surface)]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.18} size="720px 360px" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <Eyebrow variant="brand" className="mb-4">
            Trust &amp; safety
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.04] text-[clamp(36px,6vw,68px)] m-0 text-[var(--color-ink)]">
            Your money never touches us until your campaign ships.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            Funds sit in segregated escrow and release in milestones as the
            creator delivers. If the goal isn&apos;t hit, every backer is
            refunded — automatically.
          </p>

          {/* Trust badges row */}
          <div className="mt-9 flex justify-center gap-2.5 flex-wrap">
            <Badge>Stripe Connect partner</Badge>
            <Badge>Voluntary MAS Notice 626 compliance</Badge>
            <Badge>Singapore CPFTA coverage</Badge>
          </div>
        </div>
      </section>

      {/* ── 3-up pillars ─────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
              <Pillar
                Icon={ShieldCheck}
                title="All-or-nothing funding"
                body="If a campaign doesn't reach 100% by the deadline, no card is charged and every PayNow pledge is refunded automatically. There's no partial-funding mode and there never will be."
                tag="Zero risk to backers"
              />
              <Pillar
                Icon={Wallet}
                title="Stripe escrow"
                body="Pledges sit in a segregated escrow account at Stripe — not on our balance sheet, not in our operating account, not anywhere we can spend them."
                tag="Funds ring-fenced"
              />
              <Pillar
                Icon={Layers}
                title="Milestone release"
                body="Money releases to the creator in tranches as they hit verifiable milestones — typically 40 / 40 / 20. Backers see proof of every release."
                tag="Accountable disbursement"
              />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Money-flow diagram on dark ribbon ────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-ink-deep)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
              <div className="font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-golden)] mb-3">
                How the money flows
              </div>
              <h2 className="font-black tracking-[-0.03em] leading-[1.05] text-[clamp(28px,4vw,44px)] m-0 text-white">
                From your tap to a baked loaf, in five steps.
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-[1.55] text-white/70">
                Each step is independently verifiable — by you, your auditor, or
                the regulator.
              </p>
            </div>
            <TrustMoneyFlow />
          </div>
        </section>
      </ScrollReveal>

      {/* ── Milestone deep-dive (split layout) ───────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-start">
            <div>
              <Eyebrow variant="crust-dark" className="mb-3.5">
                Milestone escrow
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                The money releases as the work happens.
              </h2>
              <p className="mt-4 text-base leading-[1.6] text-[var(--color-ink-muted)] max-w-md">
                Most platforms hand the creator the full pot the moment the goal
                is hit and hope for the best. We don&apos;t. Together with the
                creator, we set milestones up front, and each milestone unlocks
                a tranche of funds.
              </p>

              <div className="mt-7 flex flex-col gap-5">
                <DeepRow
                  eye="Creator-set"
                  title="The creator proposes the milestones."
                  body="Backers see them before pledging — they're part of the campaign page."
                />
                <DeepRow
                  eye="Verifiable"
                  title="Each milestone needs proof."
                  body="A signed lease, a delivery receipt, a first-sale stub. We don't release on vibes."
                />
                <DeepRow
                  eye="Reversible"
                  title="If a creator stalls, funds return."
                  body="After 90 days of no progress, undisbursed tranches refund pro-rata to backers."
                />
              </div>
            </div>

            {/* Visual — sample release schedule (anonymous) */}
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-brand-crumb-light)] dark:bg-[var(--color-surface-raised)] p-6 sm:p-8">
              <Eyebrow variant="crust-dark" size="sm" className="mb-2">
                Sample release schedule
              </Eyebrow>
              <h3 className="font-black tracking-[-0.02em] text-lg sm:text-xl text-[var(--color-ink)] m-0 mb-6">
                A campaign that raised S$60,000
              </h3>

              {/* Stacked tranche bar */}
              <div className="flex h-14 rounded-[var(--radius-btn)] overflow-hidden border border-[var(--color-border)] mb-4">
                <TrancheSegment pct={20} done label="20%" />
                <TrancheSegment pct={30} done label="30%" />
                <TrancheSegment pct={30} pending label="30%" />
                <TrancheSegment pct={20} pending label="20%" />
              </div>

              {/* Legend */}
              <ul className="flex flex-col gap-3 mt-3">
                <TrancheLegend
                  done
                  name="On goal-hit"
                  amount="S$12,000"
                  status="Released"
                />
                <TrancheLegend
                  done
                  name="Operations milestone verified"
                  amount="S$18,000"
                  status="Released"
                />
                <TrancheLegend
                  pending
                  name="Equipment milestone"
                  amount="S$18,000"
                  status="Pending"
                />
                <TrancheLegend
                  pending
                  name="First delivery verified"
                  amount="S$12,000"
                  status="Pending"
                />
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Three refund scenarios ───────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Eyebrow variant="brand" className="mb-3">
                If something goes wrong
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                Three ways to get your money back.
              </h2>
              <p className="mt-4 text-base leading-[1.55] text-[var(--color-ink-muted)] max-w-xl mx-auto">
                Crowdfunding is a promise, not a purchase. We&apos;ve built the
                platform to honour the promise — or unwind it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
              <ScenarioCard
                eye="Scenario A"
                title="Goal not reached."
                body="The creator misses the goal by deadline. We void all card auths and reverse PayNow holds the same day."
                timing="Refund: instant"
              />
              <ScenarioCard
                eye="Scenario B"
                title="Creator cancels mid-campaign."
                body="Sometimes life gets in the way. The creator can pull a campaign any time before the deadline. All pledges revert."
                timing="Refund: instant"
              />
              <ScenarioCard
                eye="Scenario C"
                title="Creator stalls post-funding."
                body="After 90 days without milestone progress and no comms, we refund undisbursed tranches pro-rata to backers."
                timing="Refund: within 14 days"
              />
            </div>

            <p className="mt-10 text-center text-sm text-[var(--color-ink-muted)]">
              Full rules, refund amounts, and dispute timelines live in our{" "}
              <Link
                href="/terms?tab=refund"
                className="font-semibold text-[var(--color-brand-crust)] hover:underline"
              >
                Refund &amp; Dispute Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Verification (split with badge mock) ─────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
            <div>
              <Eyebrow variant="crust-dark" className="mb-3.5">
                Creator verification
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                We meet every creator before they meet your money.
              </h2>
              <p className="mt-4 text-base leading-[1.6] text-[var(--color-ink-muted)] max-w-md">
                Vetting starts the moment a creator signs up. Here&apos;s what
                we check before a campaign goes live.
              </p>

              <ul className="mt-6 flex flex-col gap-4">
                <CheckItem
                  title="Singpass MyInfo handshake"
                  body="We verify NRIC and address against MyInfo at sign-up. Foreign creators verify with passport plus proof of residence."
                />
                <CheckItem
                  title="UEN cross-check for businesses"
                  body="Registered businesses are checked against ACRA. We surface incorporation date and shareholders."
                />
                <CheckItem
                  title="Project plausibility review"
                  body="Every campaign is reviewed by a human on our team. We check budgets, timelines, and look for copy-paste pitches."
                />
                <CheckItem
                  title="Background-flag screening"
                  body="We run light AML / sanctions checks against international watchlists."
                />
              </ul>
            </div>

            {/* Verification badge mock — anonymous example */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-7 sm:p-8 overflow-hidden">
                <span
                  aria-hidden
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(245,176,62,0.18), transparent 70%)",
                  }}
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand-success)] bg-[var(--color-brand-success)]/10 ring-1 ring-[var(--color-brand-success)]/25 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-4">
                  <CircleCheck className="w-3 h-3" />
                  ID verified
                </span>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-brand-crust)] to-[var(--color-brand-golden)] text-white inline-flex items-center justify-center font-black text-2xl tracking-[-0.02em]">
                  GTB
                </div>
                <h3 className="font-black tracking-[-0.02em] text-lg sm:text-xl text-[var(--color-ink)] mt-4 mb-1">
                  Verified Creator
                </h3>
                <p className="text-sm text-[var(--color-ink-muted)] m-0">
                  Sample card · what backers see on every approved campaign
                </p>

                <ul className="mt-5 pt-5 border-t border-[var(--color-border)] flex flex-col gap-2.5">
                  <BadgeCheckItem text="Singpass · NRIC verified" />
                  <BadgeCheckItem text="UEN · ACRA cross-checked" />
                  <BadgeCheckItem text="Reviewed by Trust team" />
                  <BadgeCheckItem text="Watchlist screening · clear" />
                </ul>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── What's NOT covered + for-creators reverse note ────
          Both lifted from the existing /backer-protection page —
          legal nuance the design draft skipped. We keep the
          honesty so backers don't feel mis-sold. */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <Eyebrow variant="muted" className="mb-3">
              The fine print
            </Eyebrow>
            <h2 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-[var(--color-ink)]">
              What we don&apos;t cover.
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)]">
              Backer protection has limits. We can&apos;t step in for:
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-2 text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)]">
              <li>
                Cosmetic differences between a prototype and a final product —
                prototypes evolve.
              </li>
              <li>
                Delays a creator has communicated and that you&apos;ve had a
                reasonable chance to respond to.
              </li>
              <li>
                Shipping damage once a package leaves the creator — raise these
                with the courier or the creator directly.
              </li>
              <li>
                Disputes about subjective quality where the creator delivered
                what was promised.
              </li>
            </ul>

            <hr className="my-10 border-[var(--color-border)]" />

            <Eyebrow variant="muted" className="mb-3">
              Note for creators
            </Eyebrow>
            <p className="text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)]">
              The same protections apply in reverse — funds release only as you
              submit and we approve each milestone, and we may reverse a payout
              if credible evidence of fraud or non-delivery emerges. Full
              details are in our{" "}
              <Link
                href="/terms"
                className="font-semibold text-[var(--color-brand-crust)] hover:underline"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* ── FAQ — the hard questions ─────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="mb-8 md:mb-10">
              <Eyebrow variant="brand" className="mb-3">
                Frequently asked
              </Eyebrow>
              <h2 className="font-black tracking-[-0.03em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                The hard questions.
              </h2>
            </div>

            <ul className="border-t border-[var(--color-border)]">
              {HARD_QUESTIONS.map((faq) => (
                <li
                  key={faq.q}
                  className="border-b border-[var(--color-border)]"
                >
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
          </div>
        </section>
      </ScrollReveal>

      {/* ── Closing CTA ribbon ───────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="rounded-[var(--radius-card)] bg-[var(--color-ink-deep)] text-white p-8 sm:p-12 lg:p-14 text-center">
              <Eyebrow variant="golden" className="mb-3.5">
                Ready when you are
              </Eyebrow>
              <h2 className="font-black tracking-[-0.03em] leading-[1.05] text-[clamp(28px,4vw,44px)] m-0 max-w-2xl mx-auto">
                Bring your idea. We&apos;ve got the safety net.
              </h2>
              <p className="mt-4 text-base sm:text-lg leading-[1.55] text-white/70 max-w-xl mx-auto">
                You build the campaign. We build the trust infrastructure.
                Together, we make sure every backer can pledge with confidence
                and every creator can deliver with their reputation intact.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg" variant="primary">
                  <Link href="/apply/creator">
                    Start a campaign <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Link
                  href="/explore"
                  className="text-sm sm:text-base font-semibold text-white/85 hover:text-white inline-flex items-center gap-1.5 hover:gap-2 transition-all px-5 py-3"
                >
                  Browse campaigns <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="mt-8 text-xs sm:text-sm text-white/50 inline-flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Questions? Email{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-white hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <div className="flex justify-center py-10 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <BackToTop />
      </div>
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────────────────

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] text-xs sm:text-sm font-semibold text-[var(--color-ink)]">
      <span className="w-2 h-2 rounded-full bg-[var(--color-brand-success)]" />
      {children}
    </span>
  );
}

function Pillar({
  Icon,
  title,
  body,
  tag,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-7 sm:p-8 flex flex-col">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-brand-crumb)] text-[var(--color-brand-crust-dark)] mb-4">
        <Icon className="w-6 h-6" />
      </span>
      <h3 className="font-black tracking-[-0.02em] text-lg sm:text-xl m-0 text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="mt-3 text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)] m-0 flex-1">
        {body}
      </p>
      <div className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-crust)]">
        {tag}
      </div>
    </div>
  );
}

function DeepRow({
  eye,
  title,
  body,
}: {
  eye: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <Eyebrow variant="brand" size="sm" className="mb-1">
        {eye}
      </Eyebrow>
      <h4 className="font-bold text-[var(--color-ink)] text-base m-0">{title}</h4>
      <p className="mt-1 text-sm leading-[1.55] text-[var(--color-ink-muted)] m-0">
        {body}
      </p>
    </div>
  );
}

function TrancheSegment({
  pct,
  done = false,
  pending = false,
  label,
}: {
  pct: number;
  done?: boolean;
  pending?: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center justify-center font-mono text-xs font-bold text-white tracking-[0.06em] border-r border-white/40 last:border-r-0 ${
        done
          ? "bg-[var(--color-brand-success)]"
          : pending
            ? "bg-[var(--color-brand-crust)]"
            : "bg-[var(--color-border)]"
      }`}
      style={{
        width: `${pct}%`,
        backgroundImage: pending
          ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px)"
          : undefined,
      }}
    >
      {label}
    </div>
  );
}

function TrancheLegend({
  done = false,
  pending = false,
  name,
  amount,
  status,
}: {
  done?: boolean;
  pending?: boolean;
  name: string;
  amount: string;
  status: string;
}) {
  const swatch = done
    ? "bg-[var(--color-brand-success)]"
    : pending
      ? "bg-[var(--color-brand-crust)]"
      : "bg-[var(--color-border)]";
  const statusColor = done
    ? "text-[var(--color-brand-success)]"
    : "text-[var(--color-brand-crust-dark)]";
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={`w-4 h-4 rounded shrink-0 mt-0.5 ${swatch}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[var(--color-ink)] font-semibold">
          {name}{" "}
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${statusColor}`}
          >
            · {status}
          </span>
        </div>
        <div className="text-xs text-[var(--color-ink-muted)] tabular-nums">
          {amount}
        </div>
      </div>
    </li>
  );
}

function ScenarioCard({
  eye,
  title,
  body,
  timing,
}: {
  eye: string;
  title: string;
  body: string;
  timing: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-7 flex flex-col">
      <Eyebrow variant="muted" size="sm" className="mb-2">
        {eye}
      </Eyebrow>
      <h3 className="font-black tracking-[-0.02em] text-lg m-0 text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-[1.6] text-[var(--color-ink-muted)] flex-1 m-0">
        {body}
      </p>
      <div className="mt-5 inline-flex font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-crust)] bg-[var(--color-brand-crumb-light)] dark:bg-[var(--color-brand-crumb)] px-3 py-1.5 rounded-md w-fit">
        {timing}
      </div>
    </div>
  );
}

function CheckItem({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3.5">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-brand-success)] text-white shrink-0 mt-0.5">
        <CircleCheck className="w-3.5 h-3.5" />
      </span>
      <div>
        <h4 className="font-semibold text-[var(--color-ink)] text-base m-0">
          {title}
        </h4>
        <p className="mt-1 text-sm leading-[1.55] text-[var(--color-ink-muted)] m-0">
          {body}
        </p>
      </div>
    </li>
  );
}

function BadgeCheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
      <CircleDot className="w-3.5 h-3.5 text-[var(--color-brand-success)] shrink-0" />
      {text}
    </li>
  );
}

// ─── FAQ data ───────────────────────────────────────────────────────────────
const HARD_QUESTIONS: ReadonlyArray<{ q: string; a: React.ReactNode }> = [
  {
    q: "Where, exactly, is my money sitting between pledge and payout?",
    a: (
      <>
        It sits in a segregated escrow account run by Stripe — our payments
        partner. The funds aren&apos;t on our balance sheet, and we have no
        legal claim over them. Stripe is a Major Payment Institution licensed
        under the Payment Services Act, and they hold pledge funds the same way
        they do for every other Singapore platform that uses them.
      </>
    ),
  },
  {
    q: "What about my card data?",
    a: (
      <>
        We don&apos;t see it. Card details go straight to Stripe, who is
        PCI-DSS Level 1 certified. We store only a tokenised reference — never
        the card number itself.
      </>
    ),
  },
  {
    q: "Can I get a refund after a campaign succeeds but before delivery?",
    a: (
      <>
        Direct refunds aren&apos;t automatic post-funding — that&apos;s the
        nature of a pledge. But if a creator stalls 90+ days with no progress,
        undisbursed milestone tranches refund automatically. For other
        disputes, our Trust team mediates. Full rules in the{" "}
        <Link
          href="/terms?tab=refund"
          className="font-semibold text-[var(--color-brand-crust)] hover:underline"
        >
          Refund &amp; Dispute Policy
        </Link>
        .
      </>
    ),
  },
  {
    q: "Who reviews the campaigns?",
    a: (
      <>
        Every campaign is reviewed by a human in Singapore before going live.
        Our Trust team checks scope, budget, timeline, and creator track
        record. We turn down a meaningful share of applications.
      </>
    ),
  },
  {
    q: "What's stopping a creator from running off with the money?",
    a: (
      <>
        Three things. <strong>Milestone escrow</strong> — they only get the
        full amount as they ship. <strong>Creator vetting</strong> — Singpass
        MyInfo handshake, ACRA cross-check, watchlist screening, human review.
        And <strong>legal recourse</strong> — we reserve the right to claw back
        funds and pursue action under Singapore&apos;s Consumer Protection
        (Fair Trading) Act, and we will use it.
      </>
    ),
  },
  {
    q: "Are you regulated?",
    a: (
      <>
        Reward-based crowdfunding in Singapore isn&apos;t a licensed activity
        the way investment crowdfunding is — it doesn&apos;t fall under MAS&apos;s
        Major Payment Service framework. But we voluntarily follow MAS Notice
        626 (AML / CFT), and our payments partner Stripe is itself a
        PSA-licensed Major Payment Institution. Backer protection comes through
        Singapore&apos;s Consumer Protection (Fair Trading) Act and our own
        contractual safeguards, layered on top of Stripe&apos;s infrastructure.
      </>
    ),
  },
];
