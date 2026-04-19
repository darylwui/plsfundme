import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Clock, CreditCard, AlertCircle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund guarantee — get that bread",
  description:
    "How your pledge is protected on get that bread — Singapore's reward-based crowdfunding platform. All-or-nothing funding, clear refund rules, and a human on the other end of every question.",
};

const CONTACT_EMAIL = "hello@getthatbread.sg";

export default function RefundGuaranteePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-success)]/10 border border-[var(--color-brand-success)]/30 mb-4">
            <ShieldCheck className="w-4 h-4 text-[var(--color-brand-success)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-success)]">
              Backer protection
            </span>
          </div>
          <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
            Your pledge is safe
          </h1>
          <p className="mt-3 text-[var(--color-ink-muted)] text-lg leading-relaxed">
            get that bread runs on an all-or-nothing model. We only move your money if the campaign you backed reaches its goal — and even then, you&apos;re protected if things go wrong.
          </p>
        </div>

        {/* Three-card summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <SummaryCard
            icon={<CreditCard className="w-5 h-5" />}
            title="Only charged if funded"
            body="Card holds are released automatically if the campaign misses its goal."
          />
          <SummaryCard
            icon={<Clock className="w-5 h-5" />}
            title="Funds held 14 days"
            body="After a campaign funds, we hold funds before paying creators — so you have time to raise issues."
          />
          <SummaryCard
            icon={<AlertCircle className="w-5 h-5" />}
            title="We step in if needed"
            body="Email us if a creator disappears, lies about the project, or fails to deliver what they promised."
          />
        </div>

        <div className="prose prose-sm max-w-none text-[var(--color-ink)] prose-headings:text-[var(--color-ink)] prose-headings:font-black prose-a:text-[var(--color-brand-crust)] space-y-8">
          <Section title="How all-or-nothing funding protects you">
            <p>
              When you back a project, your payment is either:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Held as a pre-authorisation on your card</strong>, captured only if the campaign hits its goal by the deadline — or
              </li>
              <li>
                <strong>Charged via PayNow</strong> and refunded automatically if the campaign misses its goal.
              </li>
            </ul>
            <p>
              Either way, if the campaign doesn&apos;t reach its funding target, you pay nothing. No awkward follow-ups, no waiting around — it just works.
            </p>
          </Section>

          <Section title="When can I request a refund?">
            <p>
              Even after a campaign funds, you can ask for a refund in any of these cases:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The creator cancels the project or shuts down their campaign.</li>
              <li>The creator fails to deliver the promised reward within a reasonable time after the estimated delivery date.</li>
              <li>The creator materially misrepresented the project — e.g. fake photos, plagiarised work, or fabricated credentials.</li>
              <li>You were charged in error, or duplicate-charged.</li>
              <li>Your pledge was placed by someone else on your card without permission.</li>
            </ul>
            <p>
              Refund requests tied to personal change-of-mind after a campaign has funded are considered case-by-case, and are not guaranteed.
            </p>
          </Section>

          <Section title="How to request a refund">
            <p>
              Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Refund%20request`}
                className="font-semibold text-[var(--color-brand-crust)] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              with:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The campaign name or link.</li>
              <li>The email you used to pledge.</li>
              <li>A short description of what happened.</li>
            </ul>
            <p>
              We aim to respond within 2 business days. If your request qualifies, we&apos;ll process the refund back to your original payment method (card or PayNow) within 5–10 business days, depending on your bank.
            </p>
          </Section>

          <Section title="What&apos;s not covered">
            <p>
              We can&apos;t help with:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cosmetic differences between a prototype and a final product — prototypes evolve.</li>
              <li>Delays that a creator has communicated and that you&apos;ve had a reasonable chance to respond to.</li>
              <li>Shipping damage once a package leaves the creator — raise these with the courier or the creator directly.</li>
              <li>Disputes about subjective quality where the creator delivered what was promised.</li>
            </ul>
          </Section>

          <Section title="For creators">
            <p>
              If you&apos;re launching a campaign, the same protections apply in reverse — we will only pay out funds after the 14-day hold, and we may reverse a payout if credible evidence of fraud or non-delivery emerges. Full details are in our{" "}
              <Link href="/terms">Terms of Service</Link>.
            </p>
          </Section>

          <Section title="Questions?">
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--color-ink-muted)]" />
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-[var(--color-brand-crust)] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-full bg-[var(--color-brand-success)]/10 flex items-center justify-center text-[var(--color-brand-success)]">
        {icon}
      </div>
      <p className="font-bold text-[var(--color-ink)] leading-tight">{title}</p>
      <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{body}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-black text-[var(--color-ink)] mb-3">{title}</h2>
      <div className="flex flex-col gap-3 text-[var(--color-ink-muted)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}
