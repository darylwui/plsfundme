import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — get that bread",
  description: "Terms of Service for get that bread, Singapore's reward-based crowdfunding platform.",
};

const LAST_UPDATED = "10 April 2026";
const CONTACT_EMAIL = "hello@getthatbread.sg";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="prose prose-sm max-w-none text-[var(--color-ink)] prose-headings:text-[var(--color-ink)] prose-headings:font-black prose-a:text-[var(--color-brand-crust)] space-y-8">

          <Section title="1. About get that bread">
            <p>
              get that bread (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the platform&rdquo;) is a reward-based crowdfunding
              platform operated in Singapore. We connect creators with backers who believe in their ideas. By accessing
              or using get that bread, you agree to be bound by these Terms of Service
              (&ldquo;Terms&rdquo;). If you do not agree, please do not use the platform.
            </p>
            <p>
              These Terms are governed by the laws of the Republic of Singapore. Any disputes shall be subject to the
              exclusive jurisdiction of the courts of Singapore.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>You must meet the following requirements to use get that bread:</p>
            <ul>
              <li>You are at least 18 years of age.</li>
              <li>
                If creating a campaign, you are a Singapore citizen, permanent resident, or a registered business
                entity in Singapore.
              </li>
              <li>You have the legal capacity to enter into a binding agreement.</li>
              <li>You are not prohibited from using the platform under applicable law.</li>
            </ul>
            <p>
              We reserve the right to verify your identity and eligibility at any time (&ldquo;KYC&rdquo;).
              Campaigns may require KYC approval before going live.
            </p>
          </Section>

          <Section title="3. Creator Obligations">
            <p>As a creator launching a campaign on get that bread, you agree to:</p>
            <ul>
              <li>
                <strong>Provide accurate information.</strong> All campaign descriptions, images, funding goals, and
                reward details must be truthful and not misleading.
              </li>
              <li>
                <strong>Fulfil your rewards.</strong> If your campaign is successfully funded, you are legally
                obligated to deliver the promised rewards to backers in a timely manner.
              </li>
              <li>
                <strong>Comply with Singapore law.</strong> Your campaign and rewards must comply with all applicable
                Singapore laws, including the Consumer Protection (Fair Trading) Act and any relevant MAS regulations.
              </li>
              <li>
                <strong>Complete Stripe Connect onboarding.</strong> You must connect a valid bank account via
                Stripe Connect to receive payouts.
              </li>
              <li>
                <strong>Communicate with backers.</strong> You must provide timely updates to your backers,
                particularly if there are delays or material changes to your project.
              </li>
              <li>
                <strong>Obtain necessary permits or licences</strong> for your product, service, or event where
                required by law.
              </li>
            </ul>
          </Section>

          <Section title="4. Backer Obligations">
            <p>As a backer pledging to a campaign, you agree that:</p>
            <ul>
              <li>
                Your pledge is a commitment to support a creative project — it is <strong>not an investment</strong>{" "}
                and you do not acquire equity or ownership in the creator&apos;s business.
              </li>
              <li>
                get that bread uses an <strong>all-or-nothing</strong> funding model. Your payment is only collected
                if the campaign reaches its funding goal by the deadline.
              </li>
              <li>
                If a campaign is funded and the creator fails to deliver rewards, your dispute is with the
                creator. get that bread will use reasonable efforts to assist but cannot guarantee fulfilment.
              </li>
              <li>
                You are responsible for providing accurate billing and shipping information.
              </li>
            </ul>
          </Section>

          <Section title="5. All-or-Nothing Funding Model">
            <p>
              get that bread operates on an all-or-nothing basis. This means:
            </p>
            <ul>
              <li>
                <strong>Card payments:</strong> Your card is authorised (not charged) when you pledge. The charge
                is only captured after the campaign deadline if the funding goal is met. If the goal is not met,
                your card is never charged.
              </li>
              <li>
                <strong>PayNow:</strong> Your payment is captured immediately. If the campaign does not meet its
                goal, you will receive a full refund within 5–10 business days.
              </li>
              <li>
                Once a campaign is successfully funded, pledges are non-refundable except as required by law or
                as granted at our discretion.
              </li>
            </ul>
          </Section>

          <Section title="6. Platform Fees">
            <p>
              get that bread charges a <strong>5% platform fee</strong> on the total amount raised by successfully
              funded campaigns. This fee is deducted before funds are transferred to the creator via Stripe
              Connect. There are no fees for campaigns that do not reach their goal.
            </p>
            <p>
              Additional payment processing fees charged by Stripe (including PayNow processing fees) may apply
              and are separate from our platform fee.
            </p>
          </Section>

          <Section title="7. Prohibited Content & Conduct">
            <p>
              The following types of campaigns, content, or conduct are strictly prohibited on get that bread:
            </p>
            <ul>
              <li>Campaigns that are fraudulent, deceptive, or misleading in any way.</li>
              <li>
                Campaigns offering securities, financial instruments, or anything regulated as a capital markets
                product under Singapore&apos;s Securities and Futures Act without the requisite MAS licence.
              </li>
              <li>Campaigns for illegal products, services, or activities under Singapore law.</li>
              <li>Content that is defamatory, obscene, hateful, or violates any third-party rights.</li>
              <li>
                Campaigns promoting gambling, lotteries, or games of chance not licensed by the relevant
                Singapore authority.
              </li>
              <li>Campaigns involving counterfeit goods or intellectual property infringement.</li>
              <li>Campaigns soliciting donations without the requisite charity registration.</li>
              <li>Use of the platform to harass, intimidate, or harm other users.</li>
              <li>
                Creating multiple accounts to circumvent bans or restrictions imposed by get that bread.
              </li>
            </ul>
            <p>
              We reserve the right to remove any campaign that violates these Terms at any time, with or without
              prior notice.
            </p>
          </Section>

          <Section title="8. Admin Review & Removal">
            <p>
              All campaigns submitted to get that bread are subject to admin review before going live. We reserve the
              right to:
            </p>
            <ul>
              <li>Approve or reject any campaign submission at our sole discretion.</li>
              <li>
                Remove any live campaign that we determine, in our sole discretion, violates these Terms,
                applicable law, or is otherwise harmful to the platform or its users.
              </li>
              <li>
                Suspend or permanently ban any user account found to be in violation of these Terms.
              </li>
            </ul>
            <p>
              If your campaign is removed, you will be notified by email with the reason for removal. Any
              outstanding pledges will be refunded to backers.
            </p>
          </Section>

          <Section title="9. Intellectual Property">
            <p>
              By uploading content to get that bread (including images, descriptions, and videos), you grant us a
              non-exclusive, royalty-free, worldwide licence to display and promote that content on our platform
              for the purposes of operating your campaign. You retain ownership of your content.
            </p>
            <p>
              You represent and warrant that you own or have the necessary rights to all content you upload, and
              that such content does not infringe any third-party intellectual property rights.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by Singapore law, get that bread is not liable for:
            </p>
            <ul>
              <li>Any failure by a creator to fulfil rewards or deliver on campaign promises.</li>
              <li>Any indirect, incidental, special, or consequential losses or damages.</li>
              <li>Loss of data, revenue, or profits arising from your use of the platform.</li>
              <li>Technical failures, downtime, or errors beyond our reasonable control.</li>
            </ul>
            <p>
              Our total liability to you for any claim arising from your use of get that bread shall not exceed the
              total fees paid by you to get that bread in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="11. Privacy">
            <p>
              Your use of get that bread is also governed by our{" "}
              <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference. By
              using the platform, you consent to our collection and use of your data as described in the Privacy
              Policy, in accordance with Singapore&apos;s Personal Data Protection Act 2012 (PDPA).
            </p>
          </Section>

          <Section title="12. Amendments">
            <p>
              We may update these Terms from time to time. We will notify users of material changes by email or
              by posting a notice on the platform. Your continued use of get that bread after changes take effect
              constitutes your acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>
              If you have questions about these Terms or wish to report a violation, please contact us at:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </Section>
        </div>
      </div>
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
