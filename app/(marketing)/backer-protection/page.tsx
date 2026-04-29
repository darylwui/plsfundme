import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Mail,
  Milestone,
  AlertCircle,
  CircleCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackToTop } from "@/components/ui/back-to-top";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { HeroGlow } from "@/components/marketing/HeroGlow";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { BackerProtectionTimeline } from "@/components/marketing/BackerProtectionTimeline";

export const metadata: Metadata = {
  title: "Backer protection — get that bread",
  description:
    "How your pledge is protected on get that bread — Singapore's reward-based crowdfunding platform. Milestone-based escrow, clear refund rules, and a human on the other end of every question.",
};

const CONTACT_EMAIL = "hello@getthatbread.sg";

export default function BackerProtectionPage() {
  return (
    <div className="bg-[var(--color-surface)]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <HeroGlow tone="golden" origin="center" intensity={0.18} size="700px 360px" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 text-center">
          <Eyebrow variant="brand" className="mb-4">
            Backer protection
          </Eyebrow>
          <h1 className="font-black tracking-[-0.035em] leading-[1.02] text-[clamp(36px,6vw,64px)] m-0 text-[var(--color-ink)]">
            Your pledge is safe at every stage.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-[1.55] text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            get that bread uses milestone-based escrow protection. Funds are held
            until the creator hits their commitments — and at every stage, you&apos;re
            protected if things go wrong.
          </p>
        </div>
      </section>

      {/* ── Three pillars ────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
              <Eyebrow variant="brand" className="mb-3">
                Built-in protections
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                Three protections that kick in by default.
              </h2>
              <p className="mt-4 text-base leading-[1.55] text-[var(--color-ink-muted)]">
                You don&apos;t need to opt in or fill anything out. Every pledge runs
                through these — automatically.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
              <Pillar
                Icon={CreditCard}
                title="Only charged if funded"
                body="Card holds release automatically if the campaign misses its goal. PayNow pledges are refunded in full within 5–10 business days."
                tag="No goal, no charge"
              />
              <Pillar
                Icon={Milestone}
                title="Released by milestone"
                body="Funds sit in escrow and only release as the creator proves each milestone — typically 40 / 40 / 20, never one lump sum on day one."
                tag="Tranches, not a windfall"
              />
              <Pillar
                Icon={AlertCircle}
                title="We step in if needed"
                body="Email us if a creator disappears, lies about the project, or fails to deliver. Two-stage dispute process, full pledge back on fraud."
                tag="A real human responds"
              />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── How escrow protects you ──────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-start">
            <div>
              <Eyebrow variant="crust-dark" className="mb-3.5">
                Escrow mechanics
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                How milestone-based escrow protects your money.
              </h2>
              <p className="mt-4 text-base leading-[1.6] text-[var(--color-ink-muted)] max-w-md">
                When you back a project, the money doesn&apos;t flow to the creator.
                It sits with our payment processor until the campaign funds, then
                releases in tranches as milestones are verified.
              </p>
              <ul className="mt-7 flex flex-col gap-5">
                <CheckRow
                  title="Card holds, not charges"
                  body="Pre-authorisations are placed on your card and only captured if the campaign hits its goal by the deadline."
                />
                <CheckRow
                  title="PayNow refunds automatically"
                  body="PayNow pledges are charged immediately and refunded in full within 5–10 business days if the goal isn't hit."
                />
                <CheckRow
                  title="Escrow after funding"
                  body="Pledges sit in segregated escrow at Stripe — not on our balance sheet — and release as each milestone is verified."
                />
                <CheckRow
                  title="Platform fee comes back too"
                  body="If a dispute is resolved in your favour, our 5% platform fee is refunded along with your pledge."
                />
              </ul>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-brand-crumb-light)] dark:bg-[var(--color-surface)] p-6 sm:p-8">
              <Eyebrow variant="crust-dark" size="sm" className="mb-2">
                The regulatory picture
              </Eyebrow>
              <h3 className="font-black tracking-[-0.02em] text-lg sm:text-xl text-[var(--color-ink)] m-0 mb-4">
                Why this works in Singapore.
              </h3>
              <p className="text-sm sm:text-base leading-[1.65] text-[var(--color-ink-muted)] m-0">
                Reward-based crowdfunding in Singapore isn&apos;t directly regulated
                by MAS — it&apos;s not classified as a financial product the way
                investment crowdfunding is. Your protection comes from elsewhere:
                pledges sit in <strong className="text-[var(--color-ink)]">Stripe escrow</strong>{" "}
                (the same infrastructure used by most major SG platforms), and creators
                are bound by Singapore&apos;s{" "}
                <strong className="text-[var(--color-ink)]">
                  Consumer Protection (Fair Trading) Act
                </strong>{" "}
                for what they deliver. Misrepresenting a campaign is unlawful regardless
                of the platform.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Timeline ─────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-2xl mb-10 md:mb-12">
              <Eyebrow variant="brand" className="mb-3">
                Stage by stage
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.05] text-[clamp(28px,4vw,40px)] m-0 text-[var(--color-ink)]">
                A specific protection at every step.
              </h2>
              <p className="mt-3 text-base leading-[1.55] text-[var(--color-ink-muted)]">
                Your pledge moves through four stages. You&apos;re never in a grey
                zone where money has changed hands but no one&apos;s accountable.
              </p>
            </div>
            <BackerProtectionTimeline />
          </div>
        </section>
      </ScrollReveal>

      {/* ── Refunds & disputes + fine print ───────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <Eyebrow variant="crust-dark" className="mb-3">
              Refunds &amp; disputes
            </Eyebrow>
            <h2 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-[var(--color-ink)]">
              When something goes wrong, here&apos;s what happens.
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)]">
              If a creator fails to deliver — whether they cancel, go silent past a
              milestone, or misrepresent the project — you can ask for a refund. Full
              pledge back on fraud; funds still in escrow back on good-faith failure.
              Either way, our 5% platform fee comes back with it.
            </p>
            <p className="mt-3 text-sm sm:text-base leading-[1.6] text-[var(--color-ink-muted)]">
              Our two-stage dispute process gives creators 14 days to respond to a
              concern before a formal dispute opens — because most delays in real
              projects are communication gaps, not failures. If a milestone is 45+
              days overdue with no update, we open the dispute on backers&apos;
              behalf automatically.
            </p>
            <p className="mt-4">
              <Link
                href="/terms?tab=refund"
                className="text-sm sm:text-base font-semibold text-[var(--color-brand-crust)] hover:underline inline-flex items-center gap-1.5 hover:gap-2 transition-all"
              >
                Read the full refund &amp; dispute policy
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>

            <hr className="my-10 border-[var(--color-border)]" />

            <Eyebrow variant="muted" className="mb-3">
              The fine print
            </Eyebrow>
            <h3 className="font-black tracking-[-0.025em] leading-[1.1] text-xl sm:text-2xl m-0 text-[var(--color-ink)]">
              What we don&apos;t cover.
            </h3>
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
              The same protections apply in reverse — funds release only as you submit
              and we approve each milestone, and we may reverse a payout if credible
              evidence of fraud or non-delivery emerges. Full details are in our{" "}
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

      {/* ── Contact strip ─────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 md:gap-12 items-center">
            <div>
              <Eyebrow variant="brand" className="mb-3">
                Got more questions?
              </Eyebrow>
              <h2 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-[var(--color-ink)]">
                Email us. A real person replies within a business day.
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-[1.55] text-[var(--color-ink-muted)] max-w-md">
                For long-tail questions about pledging, refunds, or how we vet creators,
                see our{" "}
                <Link
                  href="/faq"
                  className="font-semibold text-[var(--color-brand-crust)] hover:underline"
                >
                  FAQ
                </Link>
                . For anything else, drop us a line.
              </p>
            </div>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
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
                {CONTACT_EMAIL}
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
      </ScrollReveal>

      {/* ── Pivot CTA ─────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="bg-[var(--color-surface-raised)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
              <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-8 sm:p-10 md:p-11 flex flex-col">
                <Eyebrow variant="brand" className="mb-3.5">
                  For backers
                </Eyebrow>
                <h3 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-[var(--color-ink)]">
                  Find something to back.
                </h3>
                <p className="mt-3.5 text-sm sm:text-base leading-[1.55] text-[var(--color-ink-muted)] max-w-md">
                  Browse the live campaigns and pick one that moves you. Pledge from
                  S$25, your money&apos;s protected at every stage.
                </p>
                <div className="mt-auto pt-6 flex flex-wrap gap-3 items-center">
                  <Button asChild size="md" variant="primary">
                    <Link href="/explore">
                      Explore campaigns
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Link
                    href="/how-it-works"
                    className="text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-1.5 hover:gap-2 transition-all"
                  >
                    How it works <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="rounded-[var(--radius-card)] bg-[var(--color-ink-deep)] text-white p-8 sm:p-10 md:p-11 flex flex-col">
                <Eyebrow variant="golden" className="mb-3.5">
                  For creators
                </Eyebrow>
                <h3 className="font-black tracking-[-0.025em] leading-[1.1] text-2xl sm:text-3xl m-0 text-white">
                  Want to launch with these protections?
                </h3>
                <p className="mt-3.5 text-sm sm:text-base leading-[1.55] text-white/70 max-w-md">
                  The same escrow that protects backers is what makes them more likely
                  to pledge to you. Apply to launch — free 30-minute call before you
                  commit.
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

function CheckRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3.5">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-brand-success)] text-white shrink-0 mt-0.5">
        <CircleCheck className="w-3.5 h-3.5" />
      </span>
      <div>
        <h4 className="font-semibold text-[var(--color-ink)] text-base m-0">{title}</h4>
        <p className="mt-1 text-sm leading-[1.55] text-[var(--color-ink-muted)] m-0">
          {body}
        </p>
      </div>
    </li>
  );
}

