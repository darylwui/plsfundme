import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — get that bread",
  description: "Privacy Policy for get that bread, Singapore's reward-based crowdfunding platform.",
};

const LAST_UPDATED = "10 April 2026";
const CONTACT_EMAIL = "support@getthatbread.sg";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="prose prose-sm max-w-none text-[var(--color-ink)] prose-headings:text-[var(--color-ink)] prose-headings:font-black prose-a:text-[var(--color-brand-violet)] space-y-8">

          <Section title="1. Introduction">
            <p>
              get that bread (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the platform&rdquo;) is committed to
              protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard
              your information when you use our platform at{" "}
              <a href="https://getthatbread.sg">getthatbread.sg</a>.
            </p>
            <p>
              This policy complies with Singapore&apos;s <strong>Personal Data Protection Act 2012 (PDPA)</strong>.
              By using get that bread, you consent to the data practices described in this policy.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <ul>
              <li>
                <strong>Account information:</strong> Name, email address, and password (hashed) when you
                register an account.
              </li>
              <li>
                <strong>Profile information:</strong> Display name and profile picture if you choose to
                provide them.
              </li>
              <li>
                <strong>Campaign data:</strong> Project titles, descriptions, images, and other content you
                submit when creating a campaign.
              </li>
              <li>
                <strong>Payment information:</strong> Billing details and payment method data. We do{" "}
                <strong>not</strong> store full card numbers — all payment processing is handled by{" "}
                <a href="https://stripe.com">Stripe</a> under their own privacy policy.
              </li>
              <li>
                <strong>Usage data:</strong> IP address, browser type, pages visited, and interaction data
                collected via our hosting provider (Vercel).
              </li>
              <li>
                <strong>Communications:</strong> Messages you send to us via email or support channels.
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>We use your personal data to:</p>
            <ul>
              <li>Create and manage your account on the platform.</li>
              <li>Process pledges and campaign payouts securely via Stripe.</li>
              <li>Send transactional emails (pledge confirmations, campaign updates, payout notifications).</li>
              <li>Review campaigns for compliance with our Terms of Service.</li>
              <li>Respond to customer support enquiries.</li>
              <li>Improve our platform and diagnose technical issues.</li>
              <li>
                Send occasional product updates or announcements. You may opt out of marketing emails at
                any time.
              </li>
            </ul>
          </Section>

          <Section title="4. Data Sharing">
            <p>
              We do <strong>not</strong> sell your personal data. We share data only with the following
              third parties, solely to operate the platform:
            </p>
            <ul>
              <li>
                <strong>Stripe</strong> — payment processing and creator payouts. Subject to{" "}
                <a href="https://stripe.com/en-sg/privacy" target="_blank" rel="noopener noreferrer">
                  Stripe&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Supabase</strong> — database and authentication hosting. Data is stored in
                Supabase-managed infrastructure.
              </li>
              <li>
                <strong>Vercel</strong> — website hosting and deployment. May log anonymised request data.
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery.
              </li>
            </ul>
            <p>
              We may also disclose your data if required by law, court order, or government authority in
              Singapore.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your personal data for as long as your account is active. If you delete your account,
              we will delete or anonymise your personal data within 30 days, except where we are required to
              retain it for legal or financial compliance purposes (e.g., transaction records, which may be
              retained for up to 7 years under Singapore law).
            </p>
          </Section>

          <Section title="6. Your Rights (PDPA)">
            <p>Under Singapore&apos;s PDPA, you have the right to:</p>
            <ul>
              <li>
                <strong>Access</strong> the personal data we hold about you.
              </li>
              <li>
                <strong>Correct</strong> any inaccurate personal data.
              </li>
              <li>
                <strong>Withdraw consent</strong> for the use of your personal data for any purpose (subject
                to legal and contractual obligations).
              </li>
            </ul>
            <p>
              To exercise any of these rights, please email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will respond within 30 days.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use session cookies to keep you logged in. These are essential for the platform to function
              and cannot be disabled. We do not use advertising or tracking cookies.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We take reasonable technical and organisational measures to protect your personal data,
              including HTTPS encryption, hashed passwords, and row-level security on our database. However,
              no method of transmission over the internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </Section>

          <Section title="9. Children">
            <p>
              get that bread is not intended for users under 18 years of age. We do not knowingly collect
              personal data from minors. If you believe a minor has registered on our platform, please
              contact us immediately.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by email or by posting a notice on the platform. Your continued use of get that bread after
              changes take effect constitutes your acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have any questions about this Privacy Policy or wish to exercise your PDPA rights,
              please contact us at:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
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
