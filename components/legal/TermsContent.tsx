const LAST_UPDATED = "25 April 2026";
const CONTACT_EMAIL = "hello@getthatbread.sg";

export function TermsContent() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-[var(--color-ink)] prose-headings:text-[var(--color-ink)] prose-headings:font-black prose-a:text-[var(--color-brand-crust)] space-y-8">

        <Section title="1. About get that bread &amp; Definitions">
          <p>
            get that bread (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the Platform&rdquo;) operates a
            reward-based crowdfunding marketplace at getthatbread.sg in Singapore. By accessing or using
            get that bread, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you
            do not agree, please do not use the Platform.
          </p>
          <p>The following definitions apply throughout these Terms and all incorporated documents:</p>
          <ul>
            <li><strong>&ldquo;Platform&rdquo;</strong> — the get that bread website, services, and technology infrastructure at getthatbread.sg.</li>
            <li><strong>&ldquo;Creator&rdquo;</strong> — an independent third party who submits and operates a campaign on the Platform.</li>
            <li><strong>&ldquo;Backer&rdquo;</strong> — a user who pledges money to a Campaign.</li>
            <li><strong>&ldquo;Campaign&rdquo;</strong> — a fundraising project submitted by a Creator and (if approved) published on the Platform.</li>
            <li><strong>&ldquo;Pledge&rdquo;</strong> — a financial commitment made by a Backer to a Campaign.</li>
          </ul>
        </Section>

        <Section title="2. Platform Role — Marketplace Intermediary">
          <p>
            get that bread is a technology marketplace that connects Creators and Backers. We are <strong>not</strong> a
            seller, manufacturer, retailer, or fulfiller of any goods, services, or rewards. We do not produce, store,
            ship, or guarantee any reward offered in a Campaign.
          </p>
          <p>
            <strong>What we are not.</strong> We are not a guarantor of Creator performance, an insurer of
            Backer pledges, an agent or partner of any Creator, a fiduciary to any party, or a
            co-obligor for any Creator&apos;s obligations. Creators are independent third parties. There
            is no employment, agency, partnership, joint venture, or fiduciary relationship between get
            that bread and any Creator.
          </p>
          <p>
            <strong>No fiduciary or trust relationship — including for escrow.</strong> The escrow
            mechanism through which we hold Pledge funds is a payment intermediary arrangement only. It
            does not create a trust, fiduciary relationship, or duty of loyalty toward any party. We hold
            funds as a payment facilitator pursuant to these Terms, pending the applicable trigger for
            release, refund, or dispute resolution.
          </p>
          <p>
            <strong>No warranty on Creators.</strong> We do not represent or warrant that any Creator is
            trustworthy, capable, or financially sound; that any Campaign description is accurate or
            complete; that any Creator will deliver the rewards they have promised; or that identity
            verification of a Creator guarantees their ongoing conduct, credentials, or solvency.
          </p>
          <p>
            <strong>Pre-launch review is not an endorsement.</strong> Our review of campaigns before they
            go live is a screening exercise against our published policies. It does not constitute an
            audit, endorsement, or commitment to ongoing monitoring of any Campaign or Creator. Approval
            does not mean we vouch for the Creator or their project.
          </p>
        </Section>

        <Section title="3. Eligibility &amp; Identity Verification">
          <p>You must meet the following requirements to use get that bread:</p>
          <ul>
            <li>You are at least 18 years of age.</li>
            <li>
              If creating a Campaign, you are a Singapore citizen, permanent resident, or a registered
              business entity in Singapore.
            </li>
            <li>You have the legal capacity to enter into a binding agreement.</li>
            <li>You are not prohibited from using the Platform under applicable law.</li>
          </ul>
          <p>
            We may require identity verification (&ldquo;KYC&rdquo;) before approving a Campaign or
            releasing funds. Completing KYC confirms your identity at the time of verification only — it
            is not a guarantee of your ongoing eligibility, the accuracy of your representations, or the
            quality of your conduct on the Platform. We reserve the right to re-verify identity at any
            time and to suspend or reject Campaigns where our verification requirements are not met.
          </p>
        </Section>

        <Section title="4. Creator Obligations">
          <p>As a Creator launching a Campaign on get that bread, you are solely and exclusively responsible for your Campaign and agree to:</p>
          <ul>
            <li>
              <strong>Provide accurate information.</strong> All Campaign descriptions, images, funding
              goals, and reward details must be truthful and not misleading. You are solely responsible
              for the accuracy and completeness of your Campaign content.
            </li>
            <li>
              <strong>Fulfil your rewards.</strong> You are solely responsible for delivering the
              promised rewards to Backers in a timely manner if your Campaign is successfully funded. get
              that bread does not co-own, co-guarantee, or share responsibility for reward fulfilment.
            </li>
            <li>
              <strong>Comply with Singapore law.</strong> Your Campaign and rewards must comply with all
              applicable Singapore laws, including the Consumer Protection (Fair Trading) Act, the
              Personal Data Protection Act 2012, and any relevant MAS regulations.
            </li>
            <li>
              <strong>Complete Stripe Connect onboarding.</strong> You must connect a valid bank account
              via Stripe Connect to receive payouts.
            </li>
            <li>
              <strong>Communicate with Backers.</strong> You must provide timely updates to your Backers,
              particularly if there are delays or material changes to your project.
            </li>
            <li>
              <strong>Obtain necessary permits or licences</strong> for your product, service, or event
              where required by law.
            </li>
            <li>
              <strong>Handle Backer personal data lawfully.</strong> You must handle all Backer personal
              data you receive in accordance with the PDPA and our{" "}
              <a href="/terms?tab=privacy">Privacy Policy</a>. You may use Backer data only for fulfilling
              campaign rewards and necessary campaign communications. You must not use Backer data for
              marketing, profiling, or any unrelated purpose without obtaining separate, explicit consent.
            </li>
          </ul>
          <p>
            <strong>Payout conditions.</strong> Payouts are subject to milestone approval and our standard
            14-day hold period. We may withhold, suspend, or offset any payout if: (a) we have reasonable
            grounds to believe you have breached these Terms; (b) a dispute, investigation, or chargeback
            relating to your Campaign is pending; or (c) required by law or our payment processors. We
            are not liable for losses arising from a legitimate exercise of these rights.
          </p>
          <p>
            By accepting these Terms, Creators also accept the indemnification obligations set out in Section 13.
          </p>
        </Section>

        <Section title="5. Backer Obligations">
          <p>As a Backer pledging to a Campaign, you agree that:</p>
          <ul>
            <li>
              Your Pledge is a commitment to support a creative project — it is <strong>not an investment</strong>{" "}
              and you do not acquire equity, ownership, or any financial return in the Creator&apos;s
              business or project.
            </li>
            <li>
              get that bread uses a <strong>milestone-based escrow</strong> model. Your payment is held
              and released only as the Creator hits verified milestones, in accordance with the{" "}
              <a href="/terms?tab=refund">Refund &amp; Dispute Policy</a>.
            </li>
            <li>
              If a Campaign is funded and the Creator fails to deliver, your primary recourse is against
              the Creator. get that bread will use reasonable efforts to facilitate disputes and apply our
              Refund &amp; Dispute Policy where triggers are met, but cannot guarantee Creator fulfilment
              or the recovery of funds already released.
            </li>
            <li>
              You are responsible for providing accurate billing and shipping information.
            </li>
            <li>
              <strong>Chargebacks.</strong> If you file a chargeback with your card issuer or payment
              provider in relation to a Pledge, this may suspend our ability to process a refund through
              our dispute process. We ask that you contact us first — we can usually resolve matters
              faster than your bank&apos;s standard window. Filing a chargeback before exhausting our
              dispute process may affect your eligibility for a refund under the Refund &amp; Dispute
              Policy.
            </li>
          </ul>
        </Section>

        <Section title="6. Milestone-Based Escrow">
          <p>
            get that bread operates a milestone-based escrow model:
          </p>
          <ul>
            <li>
              <strong>Card payments:</strong> Your card is authorised (not charged) when you pledge. The
              charge is captured only after the campaign deadline if the funding goal is met. If the goal
              is not met, the authorisation is released and your card is never charged.
            </li>
            <li>
              <strong>PayNow:</strong> Your payment is captured immediately. If the Campaign does not
              meet its goal, we will process a full refund within 5–10 business days.
            </li>
            <li>
              Once a Campaign is successfully funded, Pledges are <strong>non-refundable</strong> except
              as expressly set out in the{" "}
              <a href="/terms?tab=refund">Refund &amp; Dispute Policy</a>.
            </li>
          </ul>
          <p>
            <strong>No fiduciary relationship.</strong> The escrow arrangement does not create a trust,
            fiduciary relationship, or any duty of loyalty between get that bread and any Creator or
            Backer. We hold Pledge funds solely as a payment intermediary in accordance with these Terms.
          </p>
          <p>
            The specific circumstances under which refunds are granted, the dispute process, timelines,
            and refund amounts are governed exclusively by the{" "}
            <a href="/terms?tab=refund">Refund &amp; Dispute Policy</a>, which is incorporated into these
            Terms by reference.
          </p>
        </Section>

        <Section title="7. Platform Fees">
          <p>
            get that bread charges a <strong>5% platform fee</strong> on the total amount raised by
            successfully funded Campaigns. This fee is deducted before funds are transferred to the
            Creator via Stripe Connect. No fee applies to Campaigns that do not reach their goal.
          </p>
          <p>
            Third-party payment processing fees charged by Stripe may apply in addition to our platform
            fee and vary by payment method. These fees are charged by Stripe under their standard rates
            and are separate from our 5% fee.
          </p>
        </Section>

        <Section title="8. Prohibited Content &amp; Conduct">
          <p>
            The following types of campaigns, content, or conduct are strictly prohibited on get that bread:
          </p>
          <ul>
            <li>Campaigns that are fraudulent, deceptive, or misleading in any way.</li>
            <li>
              Campaigns offering securities, financial instruments, or anything regulated as a capital
              markets product under Singapore&apos;s Securities and Futures Act without the requisite MAS
              licence.
            </li>
            <li>Campaigns for illegal products, services, or activities under Singapore law.</li>
            <li>Content that is defamatory, obscene, hateful, or violates any third-party rights.</li>
            <li>
              Campaigns promoting gambling, lotteries, or games of chance not licensed by the relevant
              Singapore authority.
            </li>
            <li>Campaigns involving counterfeit goods or intellectual property infringement.</li>
            <li>Campaigns soliciting donations without the requisite charity registration.</li>
            <li>Use of the Platform to harass, intimidate, or harm other users.</li>
            <li>
              Creating multiple accounts to circumvent bans or restrictions imposed by get that bread.
            </li>
          </ul>
          <p>
            We reserve the right to remove any Campaign or content that violates these Terms at any time,
            with or without prior notice, at our sole discretion.
          </p>
        </Section>

        <Section title="9. Platform Discretion &amp; Campaign Management">
          <p>
            All Campaigns are subject to admin review before going live. We reserve the right to:
          </p>
          <ul>
            <li>Approve or reject any Campaign submission at our sole discretion.</li>
            <li>
              Remove any live Campaign that we determine, in our sole discretion, violates these Terms,
              applicable law, or is otherwise harmful to the Platform or its users.
            </li>
            <li>
              Suspend or permanently ban any user account found to be in violation of these Terms.
            </li>
            <li>
              Withhold, suspend, or offset payouts to any Creator where a dispute, investigation, or
              chargeback is pending, or where we have reasonable grounds to believe a breach of these
              Terms has occurred.
            </li>
          </ul>
          <p>
            Our admin review is a pre-publication screening exercise only and does not constitute an
            ongoing obligation to monitor campaigns post-launch. If a Campaign is removed, we will
            endeavour to notify the Creator by email. We will use reasonable endeavours to process
            refunds of outstanding Pledges to Backers in respect of a removed Campaign.
          </p>
        </Section>

        <Section title="10. Intellectual Property">
          <p>
            By uploading content to get that bread (including images, descriptions, and videos), you
            grant us a non-exclusive, royalty-free, worldwide licence to display, reproduce, and use
            that content for the purposes of operating the Platform, publishing your Campaign, and
            promoting the Platform generally to prospective Creators and Backers. You retain ownership
            of your content.
          </p>
          <p>
            You represent and warrant that you own or have the necessary rights to all content you
            upload, and that such content does not infringe any third-party intellectual property rights.
            You are solely responsible for any claim arising from content you upload.
          </p>
        </Section>

        <Section title="11. Disclaimer of Warranties">
          <p>
            The Platform is provided on an <strong>&ldquo;as is&rdquo;</strong> and{" "}
            <strong>&ldquo;as available&rdquo;</strong> basis. To the maximum extent permitted by
            Singapore law, get that bread makes no representations or warranties of any kind, express or
            implied, including but not limited to:
          </p>
          <ul>
            <li>that the Platform will be uninterrupted, timely, secure, or error-free;</li>
            <li>that any defect or error will be corrected;</li>
            <li>that the Platform will meet your requirements or expectations;</li>
            <li>that any Campaign will reach its funding goal;</li>
            <li>that any Creator will deliver the rewards they have promised;</li>
            <li>that Campaign content is accurate, complete, or reliable; or</li>
            <li>
              that a Creator&apos;s identity, credentials, or capabilities are as represented, even
              following identity verification.
            </li>
          </ul>
          <p>
            Use of the Platform is at your own risk. Nothing in this section limits any rights you may
            have under applicable Singapore consumer protection law that cannot be excluded by contract.
          </p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>
            To the maximum extent permitted by Singapore law, get that bread is not liable for:
          </p>
          <ul>
            <li>any failure by a Creator to fulfil rewards or deliver on Campaign promises;</li>
            <li>any indirect, incidental, special, or consequential loss or damage;</li>
            <li>loss of data, revenue, or profits arising from your use of the Platform;</li>
            <li>technical failures, downtime, or errors beyond our reasonable control;</li>
            <li>
              the actions, misconduct, misrepresentations, or omissions of any Creator or third party;
            </li>
            <li>
              any failure or act of third-party service providers (including Stripe, Supabase, or
              Vercel) within their own systems; or
            </li>
            <li>
              any loss, misuse, or unauthorised access of Backer personal data occurring within a
              Creator&apos;s own systems after data has been shared with them for fulfilment purposes.
            </li>
          </ul>
          <p>
            <strong>Liability cap.</strong> For claims relating to Pledges, refunds, or disputes, the
            specific liability provisions in our{" "}
            <a href="/terms?tab=refund">Refund &amp; Dispute Policy</a> apply and prevail. For all other
            claims, our aggregate liability to you shall not exceed the greater of: (a) the total
            platform fees received by us in connection with the specific Campaign or transaction giving
            rise to the claim; and (b) SGD&nbsp;500.
          </p>
          <p className="text-sm">
            Nothing in these Terms limits or excludes our liability for our own fraud, wilful misconduct,
            or any liability that cannot be excluded by Singapore law.
          </p>
        </Section>

        <Section title="13. Creator Indemnity">
          <p>
            As a Creator, you agree to indemnify, defend, and hold harmless get that bread, its
            directors, officers, employees, and service providers from and against any claim, demand,
            loss, liability, damage, cost, or expense (including reasonable legal fees) arising from or
            in connection with:
          </p>
          <ul>
            <li>
              your Campaign content, including any misrepresentation, inaccuracy, or failure to disclose
              material information;
            </li>
            <li>your failure to fulfil reward obligations to Backers;</li>
            <li>your breach of these Terms or any applicable law;</li>
            <li>
              any claim by a Backer or third party arising from your Campaign or conduct on the Platform;
            </li>
            <li>
              your misuse of Backer personal data, including any breach of the PDPA or these Terms;
            </li>
            <li>
              any amounts get that bread pays out to Backers or incurs in connection with disputes,
              claims, or investigations arising from your Campaign; and
            </li>
            <li>
              any intellectual property infringement claim arising from content you upload to the
              Platform.
            </li>
          </ul>
          <p>
            This indemnity survives termination of your use of the Platform.
          </p>
        </Section>

        <Section title="14. Force Majeure">
          <p>
            We are not liable for any delay or failure to perform our obligations under these Terms where
            such delay or failure arises from circumstances beyond our reasonable control, including acts
            of God, fire, flood, earthquake, government action, regulatory change, pandemic or epidemic,
            telecommunications or internet outage, power failure, or failure of a third-party service
            provider (including payment processors). We will notify you as soon as reasonably practicable
            and endeavour to resume performance when circumstances permit.
          </p>
        </Section>

        <Section title="15. Privacy &amp; Data">
          <p>
            Your use of get that bread is also governed by our{" "}
            <a href="/terms?tab=privacy">Privacy Policy</a>, which is incorporated into these Terms by
            reference. By using the Platform, you consent to our collection and use of your data as
            described in the Privacy Policy, in accordance with Singapore&apos;s Personal Data Protection
            Act 2012 (PDPA).
          </p>
          <p>
            Creators who receive Backer personal data for fulfilment purposes act as independent data
            controllers for that data and are solely responsible for their own PDPA compliance. get that
            bread is not liable for Creator misuse, breach, or unlawful processing of Backer personal
            data. See the Privacy Policy for full details.
          </p>
        </Section>

        <Section title="16. Amendments">
          <p>
            We may update these Terms from time to time. We will notify users of material changes by
            email or by posting a notice on the Platform at least <strong>14 days</strong> before the
            changes take effect. Material changes will not apply retroactively to Campaigns that have
            already reached their funding goal. Your continued use of get that bread after changes take
            effect constitutes your acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="17. General Provisions">
          <p>
            <strong>Severability.</strong> If any provision of these Terms is held to be invalid,
            illegal, or unenforceable under Singapore law, the remaining provisions shall continue in
            full force and effect.
          </p>
          <p>
            <strong>Waiver.</strong> Our failure or delay in exercising any right or enforcing any
            provision of these Terms shall not constitute a waiver of that right or provision, nor
            prevent future exercise of it.
          </p>
          <p>
            <strong>Entire agreement.</strong> These Terms, together with the Privacy Policy and the
            Refund &amp; Dispute Policy (both incorporated by reference), constitute the entire
            agreement between you and get that bread relating to your use of the Platform and supersede
            any prior communications, representations, or agreements on the same subject matter.
          </p>
          <p>
            <strong>No third-party beneficiaries.</strong> Nothing in these Terms creates any right or
            benefit for any person who is not a party to these Terms.
          </p>
        </Section>

        <Section title="18. Governing Law &amp; Dispute Resolution">
          <p>
            These Terms are governed by the laws of the Republic of Singapore.
          </p>
          <p>
            Before commencing legal proceedings, we ask that you first attempt to resolve any dispute
            with us by contacting{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">{CONTACT_EMAIL}</a>{" "}
            and allowing 30 days for good-faith resolution. If unresolved, either party may refer the
            dispute to mediation administered by the Singapore Mediation Centre before commencing court
            proceedings. Nothing in this clause prevents a party from seeking urgent interim relief
            from a court.
          </p>
          <p>
            Any proceedings not resolved by the above process shall be subject to the exclusive
            jurisdiction of the courts of Singapore.
          </p>
        </Section>

        <Section title="19. Contact Us">
          <p>
            If you have questions about these Terms or wish to report a violation, please contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--color-brand-crust)] hover:underline">{CONTACT_EMAIL}</a>
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
