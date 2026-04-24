import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — get that bread",
  description: "Privacy Policy for get that bread, Singapore's reward-based crowdfunding platform.",
};

const LAST_UPDATED = "24 April 2026";
const CONTACT_EMAIL = "hello@getthatbread.sg";

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

        <div className="prose prose-sm max-w-none text-[var(--color-ink)] prose-headings:text-[var(--color-ink)] prose-headings:font-black prose-a:text-[var(--color-brand-crust)] space-y-8">

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
            <p>
              For any privacy-related request or question, contact our Data Protection Officer
              (see Section 13).
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <ul>
              <li>
                <strong>Account information:</strong> Name, email address, and password (hashed by our
                authentication provider) when you register an account.
              </li>
              <li>
                <strong>Profile information:</strong> Display name and profile picture if you choose to
                provide them.
              </li>
              <li>
                <strong>Campaign data:</strong> Project titles, descriptions, images, rewards, milestones,
                and other content creators submit.
              </li>
              <li>
                <strong>Pledge and payment data:</strong> Pledge amounts, selected rewards, and shipping
                details where a reward requires them. Card data is handled directly by{" "}
                <a href="https://stripe.com">Stripe</a> — we never see or store full card numbers.
              </li>
              <li>
                <strong>Creator verification (KYC):</strong> For creators who verify via Singpass, we store
                verified name, date of birth, nationality, residency status, and a one-way cryptographic
                hash of the UINFIN for duplicate-account detection. The raw UINFIN is never stored. See
                Section 7.
              </li>
              <li>
                <strong>Uploaded images:</strong> Profile pictures, campaign artwork, and reward imagery
                are stored in Supabase Cloud Storage. Campaign and reward images are publicly accessible
                via CDN as part of a campaign&apos;s public page; profile pictures follow your profile
                visibility.
              </li>
              <li>
                <strong>In-app messages:</strong> Messages between creators and backers inside a
                campaign&apos;s review threads are stored for the lifespan of that campaign plus a 30-day
                grace period after the final milestone is released or the campaign is cancelled.
              </li>
              <li>
                <strong>Usage data:</strong> IP address, browser type, pages visited, and interaction data
                collected via our hosting provider (Vercel) and analytics provider (Google Analytics 4 —
                see Section 5).
              </li>
              <li>
                <strong>Error diagnostics:</strong> When something breaks, we collect technical error
                context via Sentry. This may include a session replay recording of the failing
                interaction — see Section 6.
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
              <li>Process pledges and creator payouts securely via Stripe.</li>
              <li>
                Send transactional emails (pledge confirmations, campaign status updates, payout
                notifications, password resets, refund notices). We do not send marketing emails.
              </li>
              <li>Review campaigns and creator applications for compliance with our Terms.</li>
              <li>Verify creator identity for payout eligibility and anti-fraud.</li>
              <li>Respond to customer support enquiries and PDPA rights requests.</li>
              <li>Diagnose technical issues via error tracking and limited session replay (Section 6).</li>
              <li>Improve platform usability via aggregated usage analytics.</li>
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
                <strong>Supabase</strong> — database, authentication, and storage hosting. Data is stored
                in Supabase-managed infrastructure.
              </li>
              <li>
                <strong>Vercel</strong> — website hosting and deployment. May log anonymised request data.
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery.
              </li>
              <li>
                <strong>Sentry</strong> — error tracking and error-only session replay (Section 6).
              </li>
              <li>
                <strong>Google Analytics 4 (Google)</strong> — platform usage analytics with IP
                anonymisation enabled.
              </li>
            </ul>
            <p>
              We may also disclose your data if required by law, court order, or government authority in
              Singapore.
            </p>
          </Section>

          <Section title="5. Cookies and Analytics">
            <p>
              <strong>Essential session cookies</strong> keep you logged in and are required for the
              platform to function. These cannot be disabled.
            </p>
            <p>
              <strong>Analytics cookies</strong> are set by Google Analytics 4 to measure page views,
              traffic sources, and aggregated interaction metrics. We enable IP anonymisation so your
              full IP address is never stored by Google. We do not use advertising or retargeting
              cookies, and we do not share analytics data with ad networks.
            </p>
          </Section>

          <Section title="6. Session Replay">
            <p>
              We use <a href="https://sentry.io" target="_blank" rel="noopener noreferrer">Sentry</a>&apos;s
              session replay feature to record <strong>only the sessions in which an error occurs</strong>.
              We do not record sessions under normal, error-free conditions.
            </p>
            <p>
              When an error triggers a replay, Sentry captures DOM changes, mouse movement, clicks,
              navigation, and network request metadata for that session. Form input text is masked by
              default — we cannot see what you typed into input fields.
            </p>
            <p>
              Replays are used by our engineering team to reproduce and fix crashes. Recordings are
              retained by Sentry for <strong>30 days</strong> and then deleted.
            </p>
          </Section>

          <Section title="7. Creator Verification (Singpass MyInfo)">
            <p>
              Creators are required to verify their identity through{" "}
              <a href="https://www.singpass.gov.sg/main/" target="_blank" rel="noopener noreferrer">
                Singpass MyInfo
              </a>{" "}
              before they can receive payouts.
            </p>
            <p>From a successful Singpass verification, we store the following fields:</p>
            <ul>
              <li>Verified full name</li>
              <li>Date of birth</li>
              <li>Nationality</li>
              <li>Residency status</li>
              <li>Timestamp of verification</li>
              <li>A SHA-256 hash of the UINFIN — used only to detect duplicate-account fraud</li>
            </ul>
            <p>
              <strong>The raw UINFIN is never written to our database.</strong> Only the one-way hash is
              stored, which cannot be reversed to recover the UINFIN itself.
            </p>
            <p>
              This data is used strictly for payout compliance (Monetary Authority of Singapore payment
              services rules) and anti-fraud. It is not used for marketing, not shared with other backers
              or creators, and is accessible only to the creator themselves and to platform admins
              performing compliance review.
            </p>
          </Section>

          <Section title="8. Data Retention">
            <p>
              Different categories of data are retained for different periods depending on the legal and
              operational reason we hold them.
            </p>
            <ul>
              <li>
                <strong>Account (name, email, profile):</strong> For as long as the account is active.
                Deleted or anonymised within 30 days of a deletion request.
              </li>
              <li>
                <strong>Pledges and payout records:</strong> 7 years from the transaction date (financial
                record-keeping under Singapore law).
              </li>
              <li>
                <strong>Creator KYC (Singpass):</strong> 7 years from account closure (MAS / AML
                compliance).
              </li>
              <li>
                <strong>Campaign content (projects, rewards, updates, milestones):</strong> For the
                lifetime of the platform unless you specifically request deletion; anonymised on account
                deletion.
              </li>
              <li>
                <strong>In-app messages:</strong> Lifespan of the campaign + 30 days grace after final
                milestone release or cancellation.
              </li>
              <li>
                <strong>Sentry error data and session replays:</strong> 30 days.
              </li>
              <li>
                <strong>Server and request logs (Vercel):</strong> Provider default, typically 30 days or
                less.
              </li>
              <li>
                <strong>Stripe webhook event log:</strong> 7 years from event receipt (payment
                reconciliation).
              </li>
            </ul>
            <p>
              Legal and financial retention obligations override deletion requests for affected records —
              when you exercise your PDPA rights, we&apos;ll confirm which records fall under this.
            </p>
          </Section>

          <Section title="9. Your Rights (PDPA)">
            <p>Under Singapore&apos;s PDPA, you have the right to:</p>
            <ul>
              <li>
                <strong>Access</strong> the personal data we hold about you.
              </li>
              <li>
                <strong>Correct</strong> any inaccurate personal data.
              </li>
              <li>
                <strong>Withdraw consent</strong> for the use of your personal data for any purpose
                (subject to legal and contractual obligations).
              </li>
            </ul>
            <p>
              To exercise any of these rights, email our Data Protection Officer at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">{CONTACT_EMAIL}</a>.
              We respond within 30 days as required by the PDPA. We may verify your identity before
              acting on access or deletion requests to protect you against impersonation.
            </p>
          </Section>

          <Section title="10. Security">
            <p>
              We take reasonable technical and organisational measures to protect your personal data,
              including HTTPS encryption, hashed passwords, and row-level security on our database. Data
              is encrypted at rest by our infrastructure providers. However, no method of transmission
              over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="11. Children">
            <p>
              get that bread is not intended for users under 18 years of age. We do not knowingly collect
              personal data from minors. If you believe a minor has registered on our platform, please
              contact us immediately.
            </p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by email or by posting a notice on the platform. Your continued use of get that bread after
              changes take effect constitutes your acceptance of the updated policy.
            </p>
          </Section>

          <Section title="13. Data Protection Officer & Contact">
            <p>
              Our Data Protection Officer can be reached at:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">{CONTACT_EMAIL}</a>
            </p>
            <p>
              This mailbox handles all PDPA rights requests, privacy questions, and any concerns about
              how we use your data. We respond within a business day for general questions and within
              30 days for formal PDPA requests.
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
