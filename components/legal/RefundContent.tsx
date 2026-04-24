import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  MessageSquareWarning,
  Wallet,
  Mail,
} from "lucide-react";

const LAST_UPDATED = "25 April 2026";
const CONTACT_EMAIL = "hello@getthatbread.sg";

export function RefundContent() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 mb-4">
          <ShieldCheck className="w-4 h-4 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
            Refund &amp; dispute policy
          </span>
        </div>
        <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
          If a creator fails to deliver, here&apos;s exactly what happens
        </h1>
        <p className="mt-3 text-[var(--color-ink-muted)] text-lg leading-relaxed">
          No vague promises. Concrete triggers, concrete timelines, concrete amounts — written before anything goes wrong, so there&apos;s no ambiguity when it does.
        </p>
        <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      {/* Three-card summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <SummaryCard
          icon={<Scale className="w-5 h-5" />}
          title="Up to full refund"
          body="Full pledge back on confirmed fraud. Escrow funds back on good-faith failure."
        />
        <SummaryCard
          icon={<MessageSquareWarning className="w-5 h-5" />}
          title="Two-stage process"
          body="Creators get 14 days to respond to a concern before a dispute opens."
        />
        <SummaryCard
          icon={<Wallet className="w-5 h-5" />}
          title="Platform fee refunded too"
          body="Our 5% comes back with the rest. You pledged $100, you get $100 back."
        />
      </div>

      <div className="prose prose-sm max-w-none text-[var(--color-ink)] prose-headings:text-[var(--color-ink)] prose-headings:font-black prose-a:text-[var(--color-brand-crust)] space-y-8">

        <Section title="Our role — marketplace intermediary">
          <p>
            get that bread is a crowdfunding marketplace that connects backers with independent creators. We are
            not the seller, manufacturer, or fulfiller of any reward or campaign, and we do not guarantee the
            outcome of any campaign.
          </p>
          <p>
            Creators are independent third parties solely responsible for the accuracy of their campaign,
            the delivery of rewards, and compliance with applicable laws. Our role is to hold funds in escrow,
            facilitate the dispute process, and apply this policy where triggers are met — not to act as an insurer,
            guarantor, or co-obligor for creator performance.
          </p>
          <p>
            By backing a campaign, you acknowledge that we cannot control what any creator will or will not do,
            and that our ability to refund amounts already released from escrow depends on our ability to
            recover those funds from the creator.
          </p>
        </Section>

        <Section title="When you can request a refund">
          <p>You can file a dispute in any of these situations:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The creator cancels or shuts down the campaign after it has funded.</li>
            <li>
              A milestone is <strong>45+ days overdue</strong> and the creator has posted no update. We
              may open the dispute on backers&apos; behalf — you don&apos;t need to chase.
            </li>
            <li>
              The estimated delivery date has passed by <strong>60+ days</strong> with no delivery and no
              adequate explanation.
            </li>
            <li>
              <strong>Material misrepresentation</strong> — deliberate deception by the creator at the time of
              launching the campaign, such as fabricated proof-of-concept, plagiarised work presented as
              original, or false credentials used to establish credibility. Minor inaccuracies, prototype
              variations, or good-faith errors do not constitute material misrepresentation.
            </li>
            <li>Fraud.</li>
            <li>A duplicate charge, or a charge you didn&apos;t authorise.</li>
          </ul>
          <p>
            Outside these triggers, if you&apos;re unsure — email us anyway. We&apos;d rather hear from you
            early than after you&apos;ve lost confidence in a project.
          </p>
        </Section>

        <Section title="How much you get back">
          <p>
            The amount depends on what caused the failure. We classify each case into one of two buckets.
            This classification is made at our sole discretion based on available evidence and is final
            within this process.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Confirmed fraud or material misrepresentation</strong> — you are entitled to a{" "}
              <strong>full pledge refund</strong>. Where funds have already been released to the creator,
              we will take reasonable steps to recover the shortfall from the creator and, where recovery
              is successful, apply those funds toward completing your refund. We do not guarantee recovery
              of funds already released, and our liability for any unrecovered shortfall is limited as
              described under &ldquo;Limitation of our liability&rdquo; below.
            </li>
            <li>
              <strong>Good-faith failure</strong> (supplier collapse, genuine inability to deliver) — you
              get back whatever is <strong>still in escrow</strong>. Funds already released to the creator
              on earlier milestones are not returned — the creator did hit those milestones.
            </li>
          </ul>
          <p>
            <strong>Worked example.</strong> You pledge $100. Milestone 1 is approved and $40 is released
            to the creator. Then the creator stops delivering.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>If we find good-faith failure → you get the <strong>$60</strong> still in escrow.</li>
            <li>
              If we find confirmed fraud or misrepresentation → you are entitled to the{" "}
              <strong>full $100</strong>. We pursue the creator for the $40 gap and return it to you if
              and when recovered.
            </li>
          </ul>
          <p>
            Either way, the 5% platform fee is refunded in full. We don&apos;t keep our cut when a pledge
            is refunded.
          </p>
          <p className="text-sm">
            <strong>Who decides which bucket?</strong> We do — based on the investigation evidence. Backers
            cannot self-classify their refund tier, and our classification is final. If you disagree, you
            are free to pursue other remedies (bank chargeback, small claims), but we ask that you speak
            to us first — we can usually resolve matters faster.
          </p>
        </Section>

        <Section title="How disputes work — the two-stage process">
          <p>
            Real projects run into real delays. Before a formal dispute opens, we give the creator a chance
            to respond — because most concerns turn out to be communication gaps, not failures.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Stage 1 — Flag a concern.</strong> Email us. We notify the creator and they have{" "}
              <strong>14 calendar days</strong> to post a written response or update explaining what&apos;s
              happening.
            </li>
            <li>
              <strong>Stage 2 — Dispute opens.</strong> If the creator doesn&apos;t respond within 14
              days, or the response clearly doesn&apos;t address the concern, the dispute opens formally
              and we investigate.
            </li>
          </ol>
          <p>
            <strong>Discretionary early escalation.</strong> If a milestone is 45+ days overdue <em>and</em> the creator has
            posted no update, we may, at our discretion, skip Stage 1 and open a dispute on backers&apos;
            behalf. We&apos;ll reach out to affected backers when this happens.
          </p>
        </Section>

        <Section title="Timelines">
          <div className="not-prose overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)]">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-[var(--color-ink)]">Event</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--color-ink)]">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <TimelineRow event="Initial ticket response" target="2 business days" />
                <TimelineRow event="Creator response window (Stage 1)" target="14 calendar days" />
                <TimelineRow event="Dispute investigation (Stage 2)" target="Up to 14 calendar days" />
                <TimelineRow event="Refund processing (once approved)" target="5–10 business days to original card or PayNow" />
                <TimelineRow event="Discretionary escalation threshold" target="Milestone 45+ days overdue with no creator update" />
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            Timelines are targets, not guarantees. Complex cases involving third-party payment processors or
            creator recovery proceedings may take longer. We&apos;ll keep you updated if a case exceeds
            these windows.
          </p>
        </Section>

        <Section title="What we can't help with">
          <p>Some things fall outside what this policy can cover:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Cosmetic differences between a prototype and the final product — prototypes evolve.</li>
            <li>Delays the creator has communicated and you&apos;ve had a reasonable chance to respond to.</li>
            <li>
              Shipping damage once a package leaves the creator — raise this with the courier or the
              creator directly. We are not liable for third-party logistics.
            </li>
            <li>Subjective quality disputes where the creator delivered what was described.</li>
            <li>
              Changes to a project&apos;s scope, design, or specifications that are within the spirit of
              what was originally promised and do not constitute deliberate deception.
            </li>
            <li>
              Losses caused by a creator&apos;s handling, storage, or misuse of your personal data after
              it has been shared with them for fulfilment purposes.
            </li>
          </ul>
        </Section>

        <Section title="Limitation of our liability">
          <p>
            get that bread operates as an intermediary and our liability to you in connection with any
            pledge or dispute is limited to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The amount of your pledge still held in escrow at the time your dispute is filed; and</li>
            <li>Our 5% platform fee on that pledge.</li>
          </ul>
          <p>
            We are not liable for:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Any loss of profit, opportunity, or consequential or indirect loss of any kind;</li>
            <li>Actions, delays, misrepresentations, or misconduct by creators;</li>
            <li>
              Funds released to a creator prior to a dispute being filed, except to the extent we
              successfully recover them from the creator.
            </li>
          </ul>
          <p className="text-sm">
            Nothing in this policy limits or excludes our liability for our own fraud or wilful misconduct,
            or any liability that cannot be excluded by law.
          </p>
          <p className="text-sm">
            <strong>Creator indemnity.</strong> By launching a campaign, creators agree to indemnify and
            hold harmless get that bread for any losses, costs, claims, or expenses we incur as a result
            of their misrepresentation, fraud, or failure to honour their obligations to backers —
            including any amounts we pay out to backers pending recovery.
          </p>
        </Section>

        <Section title="How to file">
          <p>
            Email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Refund%20or%20dispute`}
              className="font-semibold text-[var(--color-brand-crust)] hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            with:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The campaign name or link.</li>
            <li>The email you used to pledge.</li>
            <li>A short description of what happened and when.</li>
            <li>Any screenshots of creator posts, missed updates, or communications that are relevant.</li>
          </ul>
          <p className="text-sm">
            <strong>Before you file a bank chargeback:</strong> please talk to us first. We can usually
            resolve disputes faster than your bank&apos;s 30+ day window, and filing a chargeback locks
            the process on our side and can delay your refund.
          </p>
        </Section>

        <Section title="Edge cases">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Creator cancels before the campaign funds.</strong> Nothing to refund — we only
              charge on successful funding, and any card authorisations release automatically.
            </li>
            <li>
              <strong>Creator cancels after funding.</strong> Treated as good-faith (escrow-only refund)
              unless there is clear evidence of deliberate misrepresentation at the time of launch, in
              which case it may be classified as fraud and backers may be entitled to a full pledge refund
              subject to recovery from the creator.
            </li>
          </ul>
        </Section>

        <Section title="Related">
          <p>
            For the high-level summary of how backer protection works on get that bread, see{" "}
            <Link href="/backer-protection">Backer protection</Link>. For the full legal terms, see{" "}
            <Link href="/terms">Terms of service</Link>. This policy is incorporated into those Terms by
            reference.
          </p>
        </Section>

        <Section title="Contact">
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
      <div className="w-9 h-9 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 flex items-center justify-center text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
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

function TimelineRow({ event, target }: { event: string; target: string }) {
  return (
    <tr>
      <td className="px-4 py-3 text-[var(--color-ink)] font-medium align-top">{event}</td>
      <td className="px-4 py-3 text-[var(--color-ink-muted)] align-top">{target}</td>
    </tr>
  );
}
