const LAST_UPDATED = "30 April 2026";
const CONTACT_EMAIL = "hello@getthatbread.sg";

export function PrivacyContent() {
  return (
    <div>
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
            your information when you use our crowdfunding marketplace at{" "}
            <a href="https://getthatbread.sg">getthatbread.sg</a>.
          </p>
          <p>
            This policy complies with Singapore&apos;s{" "}
            <strong>Personal Data Protection Act 2012 (PDPA)</strong>. By using get that bread, you
            consent to the data practices described in this policy.
          </p>
          <p>
            For any privacy-related request or question, contact our Data Protection Officer
            (see Section 15).
          </p>
        </Section>

        <Section title="2. Our Role as a Marketplace">
          <p>
            get that bread is a crowdfunding marketplace platform — not a retailer, manufacturer, or
            direct seller of any goods or services. We provide technology infrastructure that enables
            independent creators (&ldquo;Creators&rdquo;) to raise funds from backers
            (&ldquo;Backers&rdquo;) in exchange for rewards.
          </p>
          <p>
            <strong>Creators are independent third parties.</strong> They are not our employees, agents,
            representatives, or partners. We do not control, direct, or supervise Creators in their
            conduct, fulfilment of rewards, or handling of personal data. When you interact with a
            Creator&apos;s campaign, you are engaging with that Creator as an independent party, not
            with us.
          </p>
          <p>
            This distinction matters for your privacy: once personal data is shared with a Creator for
            reward fulfilment, that Creator becomes an independent data controller under the PDPA and is
            solely responsible for how they handle that data. We explain this in detail in Sections 5
            and 9.
          </p>
        </Section>

        <Section title="3. Data We Collect">
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
              and other content Creators submit. Creators are responsible for the accuracy and lawfulness
              of the content they publish.
            </li>
            <li>
              <strong>Pledge and payment data:</strong> Pledge amounts, selected rewards, and shipping
              details where a reward requires them. Card data is handled directly by{" "}
              <a href="https://stripe.com">Stripe</a> — we never see or store full card numbers.
            </li>
            <li>
              <strong>Creator verification (KYC):</strong> For Creators who verify via Singpass MyInfo,
              we store verified name, date of birth, nationality, residency status, and a one-way
              peppered HMAC-SHA256 hash of the UINFIN used solely for duplicate-account detection. The
              raw UINFIN is never stored. We also retain consent metadata (the timestamp you authorised
              the disclosure, the data fields you consented to, and the MyInfo transaction reference
              issued by GovTech) to evidence your consent. See Section 8.
            </li>
            <li>
              <strong>Uploaded images:</strong> Profile pictures, campaign artwork, and reward imagery
              are stored in Supabase Cloud Storage. Campaign and reward images are publicly accessible
              via CDN as part of a campaign&apos;s public page; profile pictures follow your profile
              visibility.
            </li>
            <li>
              <strong>In-app messages:</strong> Messages between Creators and Backers inside a
              campaign&apos;s review threads are stored for the lifespan of that campaign plus a 30-day
              grace period after the final milestone is released or the campaign is cancelled.
            </li>
            <li>
              <strong>Usage data:</strong> IP address, browser type, pages visited, and interaction data
              collected via our hosting provider (Vercel) and analytics provider (Google Analytics 4 —
              see Section 6).
            </li>
            <li>
              <strong>Error diagnostics:</strong> When something breaks, we collect technical error
              context via Sentry. This may include a session replay recording of the failing
              interaction — see Section 7.
            </li>
            <li>
              <strong>Communications:</strong> Messages you send to us via email or support channels.
            </li>
          </ul>
        </Section>

        <Section title="4. How We Use Your Data">
          <p>We use your personal data to:</p>
          <ul>
            <li>Create and manage your account on the platform.</li>
            <li>Process pledges and Creator payouts securely via Stripe.</li>
            <li>
              Send transactional emails (pledge confirmations, campaign status updates, payout
              notifications, password resets, refund notices). We do not send marketing emails.
            </li>
            <li>
              Screen campaigns and Creator applications against our platform policies on a
              reasonable-endeavours basis. Such screening does not constitute an audit, endorsement,
              or guarantee of any Creator&apos;s identity, accuracy, conduct, or legal compliance.
            </li>
            <li>Verify Creator identity for payout eligibility and anti-fraud.</li>
            <li>Respond to customer support enquiries and PDPA rights requests.</li>
            <li>Diagnose technical issues via error tracking and limited session replay (Section 7).</li>
            <li>Improve platform usability via aggregated usage analytics.</li>
          </ul>
        </Section>

        <Section title="5. Data Sharing">
          <p>
            We do <strong>not</strong> sell your personal data. We share data only in the following
            circumstances:
          </p>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">Service providers</h3>
          <p>We share data with the following service providers solely to operate the platform:</p>
          <ul>
            <li>
              <strong>Stripe</strong> — payment processing and Creator payouts. Subject to{" "}
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
              <strong>Sentry</strong> — error tracking and error-only session replay (Section 7).
            </li>
            <li>
              <strong>Google Analytics 4 (Google)</strong> — platform usage analytics with IP
              anonymisation enabled.
            </li>
          </ul>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">Sharing with campaign Creators</h3>
          <p>
            When you pledge to a campaign, we may share the following data with the Creator to enable
            reward fulfilment:
          </p>
          <ul>
            <li>Your name</li>
            <li>Your contact email address</li>
            <li>Your shipping address (where a physical reward requires it)</li>
            <li>Any note you choose to include with your pledge</li>
          </ul>
          <p>
            This data is shared on the basis that it is necessary to fulfil the reward you have
            requested. We share only what is reasonably required for that purpose.
          </p>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">Creators as independent data controllers</h3>
          <p>
            Once personal data has been shared with a Creator for fulfilment purposes, that Creator
            acts as an <strong>independent data controller</strong> under the PDPA. This means:
          </p>
          <ul>
            <li>
              The Creator is solely responsible for their own compliance with the PDPA and any other
              applicable data protection laws.
            </li>
            <li>
              We do not control, monitor, audit, or have visibility into how Creators store, use,
              retain, or handle your personal data after it has been shared with them.
            </li>
            <li>
              We are not responsible for any loss, misuse, unauthorised access, breach, or unlawful
              processing of your personal data by a Creator.
            </li>
            <li>
              We cannot compel a Creator to delete, correct, or return your personal data once it has
              been shared with them. Any such request must be made directly to the Creator.
            </li>
          </ul>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">Creator obligations</h3>
          <p>
            By launching a campaign on get that bread, Creators agree to our Terms of Service, which
            require them to:
          </p>
          <ul>
            <li>
              Use personal data only for the purpose of fulfilling campaign rewards and necessary
              campaign communication.
            </li>
            <li>
              Not use personal data for marketing, profiling, or any unrelated purpose without obtaining
              separate, explicit consent from you.
            </li>
            <li>
              Handle personal data in accordance with the PDPA and any other applicable laws.
            </li>
          </ul>
          <p>
            However, we do not guarantee Creator compliance with these obligations. If you believe a
            Creator has misused your personal data, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">{CONTACT_EMAIL}</a>{" "}
            — we will take reasonable steps to investigate and, where appropriate, take action against
            that Creator under our Terms.
          </p>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">Legal disclosures</h3>
          <p>
            We may also disclose your data if required by law, court order, or government or regulatory
            authority in Singapore.
          </p>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">International data transfers</h3>
          <p>
            Some of our service providers process personal data outside Singapore. When we transfer data to
            them, we do so on the basis that (a) the recipient country provides a standard of protection
            comparable to Singapore&apos;s PDPA, or (b) contractual protections are in place requiring the
            recipient to provide a comparable level of protection.
          </p>
          <ul>
            <li>
              <strong>Stripe</strong> — processes payment data in the United States and other jurisdictions.
              Subject to{" "}
              <a href="https://stripe.com/en-sg/privacy" target="_blank" rel="noopener noreferrer">
                Stripe&apos;s cross-border transfer safeguards
              </a>.
            </li>
            <li>
              <strong>Vercel</strong> — platform hosting served globally; requests may be processed outside
              Singapore.
            </li>
            <li>
              <strong>Google</strong> — analytics data processed in the United States with IP anonymisation
              enabled.
            </li>
            <li>
              <strong>Sentry</strong> — error and session replay data processed in the United States.
            </li>
          </ul>
        </Section>

        <Section title="6. Cookies and Analytics">
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
          <p>
            To opt out of analytics tracking you can: (a) use your browser&apos;s privacy mode or
            block third-party cookies; (b) install the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Analytics opt-out browser add-on
            </a>; or (c) contact us to request removal of analytics data associated with your account.
            Opting out of analytics does not affect your access to or use of the platform.
          </p>
        </Section>

        <Section title="7. Session Replay">
          <p>
            We use{" "}
            <a href="https://sentry.io" target="_blank" rel="noopener noreferrer">Sentry</a>&apos;s
            session replay feature to record{" "}
            <strong>only the sessions in which an error occurs</strong>. We do not record sessions under
            normal, error-free conditions.
          </p>
          <p>
            When an error triggers a replay, Sentry captures DOM changes, mouse movement, clicks,
            navigation, and network request metadata for that session. Form input fields are
            configured with masking rules in Sentry&apos;s replay SDK — the content of input fields
            is not captured or transmitted. We cannot see what you typed.
          </p>
          <p>
            Replays are used by our engineering team to reproduce and fix crashes. Recordings are
            retained by Sentry for <strong>30 days</strong> and then deleted.
          </p>
        </Section>

        <Section title="8. Creator Verification (Singpass MyInfo)">
          <p>
            Creators are required to verify their identity before they can receive payouts. We support
            two paths and you may choose either:
          </p>
          <ul>
            <li>
              <strong>Singpass MyInfo</strong> (preferred) — government-backed identity verification via{" "}
              <a href="https://www.singpass.gov.sg/main/" target="_blank" rel="noopener noreferrer">
                Singpass
              </a>.
            </li>
            <li>
              <strong>Manual review</strong> (alternative) — admin review of an NRIC document plus
              selfie. Used during pre-launch and as a fallback for users who decline Singpass.
            </li>
          </ul>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">What you consent to with Singpass</h3>
          <p>
            When you click <em>Allow</em> on the Singpass consent screen, you authorise GovTech to
            disclose the following MyInfo fields to get that bread for the purpose of payout-eligibility
            verification:
          </p>
          <ul>
            <li><strong>UINFIN</strong> — your NRIC or FIN identifier</li>
            <li><strong>Name</strong> — your full registered name</li>
            <li><strong>Date of birth</strong></li>
            <li><strong>Nationality</strong></li>
            <li><strong>Residential status</strong></li>
          </ul>
          <p>
            We request only those five fields and no others. The list of fields requested is governed
            by the OIDC scopes registered for our Singpass developer account; we cannot request fields
            outside that registered scope.
          </p>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">What we store</h3>
          <p>From a successful Singpass verification we persist:</p>
          <ul>
            <li>Verified full name (used for payout records and admin compliance review)</li>
            <li>Date of birth (used to confirm you are at least 18, MAS payment-services rule)</li>
            <li>Nationality and residential status (AML / counter-terrorism financing checks)</li>
            <li>Timestamp of verification</li>
            <li>
              A peppered <strong>HMAC-SHA256 hash of the UINFIN</strong> — used only to detect
              duplicate-account fraud (one person, one creator account)
            </li>
            <li>
              <strong>Consent metadata:</strong> the timestamp you granted consent on the Singpass
              screen, the OIDC scopes the access token actually granted, and the MyInfo transaction
              reference (<code>txnNo</code>) returned by GovTech. This is our audit trail evidencing
              that you consented and what you consented to.
            </li>
          </ul>
          <p>
            <strong>The raw UINFIN is never written to our database.</strong> The hash is one-way and
            is keyed with a secret pepper held only on our servers; it cannot be reversed to recover
            the UINFIN.
          </p>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">How we use this data</h3>
          <p>
            This data is used <em>strictly</em> for: payout-eligibility verification, anti-fraud
            (duplicate-account detection), and AML / counter-terrorism financing compliance under
            Monetary Authority of Singapore payment-services rules. It is not used for marketing, not
            shared with any Backer or other Creator, and not shared with any third party except where
            legally required (for example, in response to a lawful order from a Singapore regulator or
            court).
          </p>
          <p>
            Singpass-derived fields are accessible only to the Creator themselves (via their dashboard)
            and to platform admins performing compliance review. Access by admins is logged.
          </p>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">Withdrawing consent</h3>
          <p>
            You may withdraw consent for our use of your Singpass-derived data at any time by emailing
            our DPO (Section 16). Withdrawal results in your creator account being closed, because
            payout eligibility cannot be maintained without verified identity. Records subject to AML
            retention obligations (see Section 9) will be retained for the legally required period
            after closure but will not be used for any other purpose.
          </p>

          <h3 className="text-base font-bold text-[var(--color-ink)] mt-4">Legal basis</h3>
          <p>
            We collect this data on the basis of your <strong>consent</strong> (PDPA section 13) given
            at the Singpass screen, and on the basis that it is <strong>necessary for compliance with
            legal obligations</strong> applicable to a payment-related platform operating in Singapore
            (PDPA First Schedule, Part 3). Where the two bases overlap, the legal-obligation basis
            governs records we are required by law to retain.
          </p>
        </Section>

        <Section title="9. Data Retention">
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
          <p>
            <strong>Creator-held data:</strong> Once personal data has been shared with a Creator to
            fulfil a reward, we have no visibility into or control over that Creator&apos;s retention
            practices. We cannot guarantee that a Creator will delete your data on request. For
            any data held independently by a Creator, you must contact that Creator directly.
          </p>
        </Section>

        <Section title="10. Your Rights (PDPA)">
          <p>Under Singapore&apos;s PDPA, you have the right to:</p>
          <ul>
            <li>
              <strong>Access</strong> the personal data we hold about you.
            </li>
            <li>
              <strong>Correct</strong> any inaccurate personal data we hold.
            </li>
            <li>
              <strong>Withdraw consent</strong> for the use of your personal data for any purpose
              (subject to legal and contractual obligations).
            </li>
            <li>
              <strong>Data portability</strong> — request a structured, machine-readable copy of
              personal data you have provided to us (such as your account and pledge history), where
              technically feasible.
            </li>
          </ul>
          <p>
            <strong>Self-service download.</strong> If you&apos;re signed in, you can download a copy of
            the personal data we hold about you (profile, pledges, creator application, dispute concerns,
            campaign drafts) at{" "}
            <a href="/api/me/export" className="font-semibold text-[var(--color-brand-crust)] hover:underline">
              /api/me/export
            </a>{" "}
            — the response is a structured JSON file you can save locally. Self-service covers the
            data we hold about you directly; for anything held by Creators or third-party processors,
            email the DPO below.
          </p>
          <p>
            <strong>Other rights.</strong> To request correction, withdrawal of consent, or account
            deletion (subject to retention obligations for completed transactions and AML records),
            email our Data Protection Officer at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">{CONTACT_EMAIL}</a>.
            We respond within 30 days as required by the PDPA. We may verify your identity before
            acting on access or correction requests to protect you against impersonation.
          </p>
          <p>
            <strong>Scope of your rights under this policy:</strong> Your PDPA rights under this policy
            apply only to personal data that <em>we</em> hold and process as data controller. For
            personal data held by Creators or third-party service providers acting as independent data
            controllers (see Section 5), you must exercise your rights directly with those parties. We
            are not able to act as an intermediary for such requests.
          </p>
        </Section>

        <Section title="11. Security">
          <p>
            We take reasonable technical and organisational measures to protect the personal data we hold,
            including HTTPS encryption, hashed passwords, and row-level security on our database. Data
            is encrypted at rest by our infrastructure providers. However, no method of transmission
            over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
          <p>
            These measures apply to personal data we directly hold and process. We do not control the
            security practices of Creators or other independent data controllers to whom data may be
            disclosed in accordance with this policy, and we are not responsible for any security
            incidents affecting data held by those parties.
          </p>
        </Section>

        <Section title="12. Notifiable Data Breach Procedure">
          <p>
            Singapore&apos;s Personal Data Protection (Notification of Data Breaches) Regulations 2021
            require us to assess data breaches against the notifiability thresholds and, where notifiable,
            notify the Personal Data Protection Commission (PDPC) and affected individuals. We follow
            the process below.
          </p>
          <ul>
            <li>
              <strong>Detection &amp; assessment.</strong> When we become aware of a suspected breach
              we begin assessing its scope, the personal data affected, and whether the affected data is
              of a type or volume that meets the PDPA&apos;s notifiability thresholds (significant harm
              to affected individuals, or 500+ individuals affected).
            </li>
            <li>
              <strong>Notification to PDPC.</strong> If the breach meets the notifiability threshold
              we notify PDPC <strong>within 3 calendar days</strong> of completing our assessment, as
              required by Section 26D of the PDPA.
            </li>
            <li>
              <strong>Notification to affected individuals.</strong> Where the breach is likely to
              result in significant harm, we notify the affected individuals <em>as soon as practicable</em>{" "}
              by email at the address on file, and where appropriate by an in-product notice. The
              notification will describe the data affected, what we are doing about it, and what
              steps you can take to protect yourself.
            </li>
            <li>
              <strong>Internal record-keeping.</strong> All breaches — notifiable or not — are
              documented internally with the date detected, scope, remediation steps, and post-incident
              review.
            </li>
          </ul>
          <p>
            If you suspect a security incident affecting your account, contact our DPO immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="13. Limitation of Liability for Third-Party Data Handling">
          <p>
            To the fullest extent permitted by law, we are not liable for any loss, damage, or harm
            arising from the actions of third parties — including Creators, payment processors, or
            analytics providers — in relation to personal data shared with them in accordance with
            this policy.
          </p>
          <p>
            Our liability is limited to personal data that we directly hold and process as data
            controller. We are not responsible for:
          </p>
          <ul>
            <li>How Creators use, store, retain, or disclose personal data once it has been shared with them;</li>
            <li>Any Creator&apos;s failure to comply with the PDPA or their obligations under our Terms;</li>
            <li>Data breaches or misuse occurring within a Creator&apos;s own systems or processes;</li>
            <li>
              Actions of third-party service providers (such as Stripe, Google, or Sentry) within their
              own platforms, which are governed by their respective privacy policies.
            </li>
          </ul>
          <p>
            Nothing in this section limits or excludes our liability for our own negligence, fraud, or
            wilful misconduct, or any liability that cannot be excluded under Singapore law.
          </p>
        </Section>

        <Section title="14. Children">
          <p>
            get that bread is not intended for users under 18 years of age. We do not knowingly collect
            personal data from minors. If you believe a minor has registered on our platform, please
            contact us immediately.
          </p>
        </Section>

        <Section title="15. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            by email or by posting a notice on the platform. Your continued use of get that bread after
            changes take effect constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section title="16. Data Protection Officer &amp; Contact">
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
