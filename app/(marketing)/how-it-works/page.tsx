import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  CircleDot,
  Layers,
  PlayCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";
import { HowItWorksFlowSwitcher } from "@/components/marketing/HowItWorksFlowSwitcher";
import { PledgeTimelineDemo } from "@/components/marketing/PledgeTimelineDemo";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { TrustMoneyFlow } from "@/components/marketing/TrustMoneyFlow";

export const metadata = {
  title: "How it works — get that bread",
  description:
    "Singapore's reward-based crowdfunding platform. Pledge to creators you love — we only move your money if they hit their goal. All-or-nothing, milestone escrow, PayNow native.",
};

export default function HowItWorksPage() {
  return (
    <div className="bg-[var(--color-surface)]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.18} size="700px 360px" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <Eyebrow variant="brand" className="mb-4">
            How it works
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.02] text-[clamp(36px,6vw,72px)] m-0 text-[var(--color-ink)]">
            From idea to funded, no awkward middle.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            Same platform, two stories. Pick the one that matches you and we&apos;ll
            walk through every step — pledge to delivery, application to payout.
          </p>
        </div>
      </section>

      {/* ── 3 Pillars ────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
              <Eyebrow variant="brand" className="mb-3">
                Backer protection
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                Your money never touches us until the campaign ships.
              </h2>
              <p className="mt-4 text-base leading-[1.55] text-[var(--color-ink-muted)]">
                Funds sit in segregated escrow and release in milestones as the creator delivers.
                If the goal isn&apos;t hit, every backer is refunded — automatically.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
              <TrustPillar
                Icon={ShieldCheck}
                title="All-or-nothing funding"
                body="If a campaign doesn't reach 100% by the deadline, no card is charged and every PayNow pledge is refunded automatically. No partial-funding mode, ever."
                tag="Zero risk to backers"
              />
              <TrustPillar
                Icon={Wallet}
                title="Stripe escrow"
                body="Pledges sit in a segregated escrow account at Stripe — not on our balance sheet, not in our operating account, not anywhere we can spend them."
                tag="Funds ring-fenced"
              />
              <TrustPillar
                Icon={Layers}
                title="Milestone release"
                body="Money releases to the creator in tranches as they hit verifiable milestones — typically 40 / 40 / 20. Backers see proof of every release."
                tag="Accountable disbursement"
              />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Pledge timeline demo ──────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="max-w-2xl mb-8 md:mb-10">
              <Eyebrow variant="crust-dark" className="mb-3 inline-flex items-center gap-2">
                <PlayCircle className="w-3.5 h-3.5" />
                Try it yourself
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                See how your pledge works.
              </h2>
              <p className="mt-3 text-base leading-[1.55] text-[var(--color-ink-muted)]">
                Don&apos;t take our word for it. Try pledging below, or let the
                clock run out — you&apos;ll see exactly how your money is handled
                either way.
              </p>
            </div>
            <PledgeTimelineDemo />
          </div>
        </section>
      </ScrollReveal>

      {/* ── Money-flow diagram — dark ribbon ─────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-ink-deep)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
              <div className="font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-golden)] mb-3">
                How the money flows
              </div>
              <h2 className="font-black tracking-[-0.03em] leading-[1.05] text-[clamp(28px,4vw,44px)] m-0 text-white">
                Five steps to getting that bread with us.
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-[1.55] text-white/70">
                Each step is independently verifiable — by you, your auditor, or the regulator.
              </p>
            </div>
            <TrustMoneyFlow />
          </div>
        </section>
      </ScrollReveal>

      {/* ── Milestone escrow deep-dive ────────────────────────── */}
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
                Most platforms hand the creator the full pot the moment the goal is hit and hope
                for the best. We don&apos;t. Together with the creator, we set milestones up front,
                and each milestone unlocks a tranche of funds.
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

            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-brand-crumb-light)] dark:bg-[var(--color-surface-raised)] p-6 sm:p-8">
              <Eyebrow variant="crust-dark" size="sm" className="mb-2">
                Sample release schedule
              </Eyebrow>
              <h3 className="font-black tracking-[-0.02em] text-lg sm:text-xl text-[var(--color-ink)] m-0 mb-6">
                A campaign that raised S$60,000
              </h3>
              <div className="flex h-14 rounded-[var(--radius-btn)] overflow-hidden border border-[var(--color-border)] mb-4">
                <TrancheSegment pct={20} done label="20%" />
                <TrancheSegment pct={30} done label="30%" />
                <TrancheSegment pct={30} pending label="30%" />
                <TrancheSegment pct={20} pending label="20%" />
              </div>
              <ul className="flex flex-col gap-3 mt-3">
                <TrancheLegend done name="On goal-hit" amount="S$12,000" status="Released" />
                <TrancheLegend done name="Operations milestone verified" amount="S$18,000" status="Released" />
                <TrancheLegend pending name="Equipment milestone" amount="S$18,000" status="Pending" />
                <TrancheLegend pending name="First delivery verified" amount="S$12,000" status="Pending" />
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Creator verification ──────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
            <div>
              <Eyebrow variant="crust-dark" className="mb-3.5">
                Creator verification
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                We meet every creator before they meet your money.
              </h2>
              <p className="mt-4 text-base leading-[1.6] text-[var(--color-ink-muted)] max-w-md">
                Vetting starts the moment a creator signs up. Here&apos;s what we check before a
                campaign goes live.
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

            <div className="flex justify-center">
              <div className="relative w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-7 sm:p-8 overflow-hidden">
                <span
                  aria-hidden
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(closest-side, rgba(245,176,62,0.18), transparent 70%)" }}
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

      {/* ── Audience tabs ─────────────────────────────────────── */}
      <HowItWorksFlowSwitcher />

      {/* ── Fine print ────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-raised)]">
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
              <li>Cosmetic differences between a prototype and a final product — prototypes evolve.</li>
              <li>Delays a creator has communicated and that you&apos;ve had a reasonable chance to respond to.</li>
              <li>Shipping damage once a package leaves the creator — raise these with the courier or the creator directly.</li>
              <li>Disputes about subjective quality where the creator delivered what was promised.</li>
            </ul>
            <hr className="my-10 border-[var(--color-border)]" />
            <Eyebrow variant="muted" className="mb-3">
              Note for creators
            </Eyebrow>
            <p className="text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)]">
              The same protections apply in reverse — funds release only as you submit and we
              approve each milestone, and we may reverse a payout if credible evidence of fraud or
              non-delivery emerges. Full details are in our{" "}
              <Link href="/terms" className="font-semibold text-[var(--color-brand-crust)] hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Pivot CTA — two-column dark/light ────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
              <div className="rounded-[var(--radius-card)] bg-[var(--color-ink-deep)] text-white p-8 sm:p-10 md:p-11 flex flex-col">
                <Eyebrow variant="golden" className="mb-3.5">
                  For creators
                </Eyebrow>
                <h3 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-white">
                  Bring your idea. We&apos;ll help build the campaign.
                </h3>
                <p className="mt-3.5 text-sm sm:text-base leading-[1.55] text-white/70 max-w-md">
                  Free 30-minute call before you commit. We tell you honestly if we think it&apos;ll fund.
                </p>
                <div className="mt-auto pt-6 flex flex-wrap gap-3 items-center">
                  <Button asChild size="md" variant="primary">
                    <Link href="/apply/creator">
                      Apply to launch
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Link
                    href="/for-creators"
                    className="text-sm font-semibold text-white/85 hover:text-white inline-flex items-center gap-1.5 hover:gap-2 transition-all"
                  >
                    Creator guide <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-8 sm:p-10 md:p-11 flex flex-col">
                <Eyebrow variant="brand" className="mb-3.5">
                  For backers
                </Eyebrow>
                <h3 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-[var(--color-ink)]">
                  Find something to back.
                </h3>
                <p className="mt-3.5 text-sm sm:text-base leading-[1.55] text-[var(--color-ink-muted)] max-w-md">
                  Browse the live campaigns and pick one that moves you. Pledge from S$25,
                  your money&apos;s protected at every stage.
                </p>
                <div className="mt-auto pt-6 flex flex-wrap gap-3 items-center">
                  <Button asChild size="md" variant="primary">
                    <Link href="/explore">
                      Explore campaigns
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Link
                    href="/backer-protection"
                    className="text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-1.5 hover:gap-2 transition-all"
                  >
                    Backer protection <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
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

// ─── Helper components ───────────────────────────────────────────────────────

function TrustPillar({
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

function DeepRow({ eye, title, body }: { eye: string; title: string; body: string }) {
  return (
    <div>
      <Eyebrow variant="brand" size="sm" className="mb-1">
        {eye}
      </Eyebrow>
      <h4 className="font-bold text-[var(--color-ink)] text-base m-0">{title}</h4>
      <p className="mt-1 text-sm leading-[1.55] text-[var(--color-ink-muted)] m-0">{body}</p>
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
        done ? "bg-[var(--color-brand-success)]" : "bg-[var(--color-brand-crust)]"
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
  const swatch = done ? "bg-[var(--color-brand-success)]" : "bg-[var(--color-brand-crust)]";
  const statusColor = done ? "text-[var(--color-brand-success)]" : "text-[var(--color-brand-crust-dark)]";
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={`w-4 h-4 rounded shrink-0 mt-0.5 ${swatch}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[var(--color-ink)] font-semibold">
          {name}{" "}
          <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${statusColor}`}>
            · {status}
          </span>
        </div>
        <div className="text-xs text-[var(--color-ink-muted)] tabular-nums">{amount}</div>
      </div>
    </li>
  );
}

function CheckItem({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3.5">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-brand-success)] text-white shrink-0 mt-0.5">
        <CircleCheck className="w-3.5 h-3.5" />
      </span>
      <div>
        <h4 className="font-semibold text-[var(--color-ink)] text-base m-0">{title}</h4>
        <p className="mt-1 text-sm leading-[1.55] text-[var(--color-ink-muted)] m-0">{body}</p>
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
