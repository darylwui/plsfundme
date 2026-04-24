# PDPA Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between what `/privacy` claims and what the code does, add inline consent at pledge checkout, and tighten Sentry session replay to error-only.

**Architecture:** Pure content/config work. Rewrite a static marketing page (`/privacy`), flip one Sentry sampling flag, add three links under the Confirm pledge button. No DB changes, no API changes, no new components, no tests beyond `lint`, `tsc`, and browser smoke.

**Tech Stack:** Next.js App Router, React server components, Tailwind CSS (existing design tokens), Sentry, Supabase (unchanged).

**Spec:** [docs/superpowers/specs/2026-04-24-pdpa-review-design.md](../specs/2026-04-24-pdpa-review-design.md)

---

## Task ordering rationale

Three small independent commits, each shippable on its own:

1. **Task 1** — Sentry config flip. Smallest blast radius; if it breaks anything we find out fast.
2. **Task 2** — Pledge checkout consent line. Self-contained UI change.
3. **Task 3** — `/privacy` rewrite. Biggest content diff but zero runtime risk.
4. **Task 4** — Verification + changelog + commit check.

---

## Task 1: Flip Sentry session replay to error-only

**Files:**
- Modify: `instrumentation-client.ts:35`

- [ ] **Step 1: Open the file and locate the line**

Run: `grep -n "replaysSessionSampleRate" instrumentation-client.ts`
Expected output: `35:    replaysSessionSampleRate: 0.1,`

- [ ] **Step 2: Change the value from 0.1 to 0**

Use the Edit tool with this exact change.

Old string (line 35, with surrounding comment for uniqueness):
```
    // Record 10% of all sessions for baseline UX insight, and 100% of
    // sessions that hit an error for actionable debugging.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
```

New string:
```
    // Session replay is error-only: we do not record sessions under
    // normal conditions, only when an error fires. Narrows PDPA
    // disclosure surface and cuts Sentry replay volume.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
```

- [ ] **Step 3: Verify the change**

Run: `grep -n "replaysSessionSampleRate" instrumentation-client.ts`
Expected output: `    replaysSessionSampleRate: 0,`

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: exits cleanly (no output, or prints nothing about `instrumentation-client.ts`).

- [ ] **Step 5: Commit**

```bash
git add instrumentation-client.ts
git commit -m "$(cat <<'EOF'
chore: flip Sentry session replay to error-only

Drop replaysSessionSampleRate from 0.1 to 0. Error-only replay narrows
the PDPA disclosure surface — we no longer record ambient sessions for
baseline UX, only sessions where an error fires (replaysOnErrorSampleRate
stays at 1.0).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add inline consent line to pledge checkout

**Files:**
- Modify: `components/backing/CheckoutForm.tsx` (import at line 1-17; JSX block around line 199-207)

- [ ] **Step 1: Add the `Link` import**

The file currently has no `next/link` import. Add it after the existing React/Next imports.

Old string (lines 3-4):
```
import { useState } from "react";
import { useRouter } from "next/navigation";
```

New string:
```
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
```

- [ ] **Step 2: Add the consent line below the trust line**

Find the block around line 199-207 (Confirm pledge button + "You're only charged if…" trust line). Add a new `<p>` directly after the trust line.

Old string:
```
      <Button type="submit" size="lg" fullWidth loading={loading || !stripe}>
        Confirm pledge — {formatSgd(sgdAmount)}
      </Button>

      <p className="text-xs text-center text-[var(--color-ink-subtle)] flex items-center justify-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        You&apos;re only charged if the campaign reaches its goal by{" "}
        {new Date(project.deadline).toLocaleDateString("en-SG")}
      </p>
    </form>
```

New string:
```
      <Button type="submit" size="lg" fullWidth loading={loading || !stripe}>
        Confirm pledge — {formatSgd(sgdAmount)}
      </Button>

      <p className="text-xs text-center text-[var(--color-ink-subtle)] flex items-center justify-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        You&apos;re only charged if the campaign reaches its goal by{" "}
        {new Date(project.deadline).toLocaleDateString("en-SG")}
      </p>

      <p className="text-xs text-center text-[var(--color-ink-subtle)] leading-relaxed">
        By confirming, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-[var(--color-ink)]">
          Terms of Service
        </Link>
        ,{" "}
        <Link href="/privacy" className="underline hover:text-[var(--color-ink)]">
          Privacy Policy
        </Link>
        , and{" "}
        <Link href="/refund-policy" className="underline hover:text-[var(--color-ink)]">
          Refund &amp; Dispute Policy
        </Link>
        .
      </p>
    </form>
```

- [ ] **Step 3: Verify the import and the JSX**

Run: `grep -n "next/link\|Refund & Dispute Policy\|Refund &amp; Dispute Policy" components/backing/CheckoutForm.tsx`
Expected: three matching lines (one import, one `&amp;` usage, plus the import was single-match). Adjust if unexpected.

- [ ] **Step 4: Lint**

Run: `npm run lint 2>&1 | grep -E "CheckoutForm" || echo "clean"`
Expected: `clean`

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: exits cleanly.

- [ ] **Step 6: Browser smoke test via preview MCP**

The dev server is already running (serverId `ee9b9f52-b205-4938-aebe-6bff53d0cc98`, port 65207). Checkout requires an active live project and an authenticated session, which may not exist in local dev. The key correctness gate is `tsc` + `lint` + the DOM grep in Step 3 above. If you want to do a live smoke anyway:

1. Find a live project ID via preview_eval:
```
window.location.href = 'http://localhost:65207/explore'
```
Then:
```
[...document.querySelectorAll('a[href*="/project/"]')].slice(0,3).map(a=>a.href)
```
If the list is empty, skip the live check — the static validation in Step 3 is sufficient.

2. If a project is found, visit `/{projectId}/checkout` and confirm via `preview_snapshot` that three links appear under Confirm pledge (Terms, Privacy Policy, Refund &amp; Dispute Policy). Login redirect is fine — we're looking at the component, not the flow.

- [ ] **Step 7: Commit**

```bash
git add components/backing/CheckoutForm.tsx
git commit -m "$(cat <<'EOF'
feat: add inline consent line to pledge checkout

Surfaces Terms, Privacy Policy, and Refund & Dispute Policy at the
point of payment. PDPA-wise this gives us "deemed consent by conduct"
on the transactional processing happening at checkout. Styling matches
the existing "you're only charged if" trust line — both small-print,
ink-subtle, text-xs.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Rewrite `/privacy` page

**Files:**
- Rewrite: `app/(marketing)/privacy/page.tsx`

This is the biggest task. Single-file rewrite; keep the `Section` helper at the bottom and the two constants at the top. Everything between the opening `<div>` hero and the closing `</div>` is replaced.

- [ ] **Step 0: Read the existing file**

The Write tool requires a prior Read in the same session before it can overwrite. Read the full file first:

Run: `Read tool on app/(marketing)/privacy/page.tsx`
Expected: 199-line file with the current policy content.

- [ ] **Step 1: Replace the entire file with the new content**

Use the Write tool (the file already exists, so Write will overwrite it — acceptable here because we are doing a full rewrite of content + keeping structural helpers).

New file content:

```tsx
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
```

- [ ] **Step 2: Verify structural expectations**

Run: `grep -cE "^          <Section title" "app/(marketing)/privacy/page.tsx"`
Expected: `13`

Run: `grep -E "marketing|product updates|announcements" "app/(marketing)/privacy/page.tsx" || echo "clean"`
Expected: `clean` (no marketing-email residue)

Run: `grep -cE "Sentry|Google Analytics|Singpass" "app/(marketing)/privacy/page.tsx"`
Expected: at least `5` (multiple mentions across sections)

- [ ] **Step 3: Lint**

Run: `npm run lint 2>&1 | grep -E "privacy/page" || echo "clean"`
Expected: `clean`

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: exits cleanly (no errors).

- [ ] **Step 5: Browser smoke test via preview MCP**

The dev server is already running (serverId `ee9b9f52-b205-4938-aebe-6bff53d0cc98`, port 65207).

Navigate and verify all 13 sections render:
```
preview_eval: window.location.href = 'http://localhost:65207/privacy'
preview_eval: [...document.querySelectorAll('h2')].map(h=>h.textContent)
```
Expected: 13 section headings matching the titles above in order.

Check for absence of marketing residue:
```
preview_eval: document.body.textContent.toLowerCase().includes('marketing email') || document.body.textContent.toLowerCase().includes('product updates')
```
Expected: `false`

Check the three new concepts are visible in the DOM:
```
preview_eval: ['Sentry', 'Google Analytics', 'Singpass', 'UINFIN'].map(w=>({w, found: document.body.textContent.includes(w)}))
```
Expected: all four `found: true`.

Optional dark-mode check (since policy is long and prose styling matters):
```
preview_resize: colorScheme dark
preview_eval: document.documentElement.className
```
Verify no unreadable contrast.

- [ ] **Step 6: Commit**

```bash
git add "app/(marketing)/privacy/page.tsx"
git commit -m "$(cat <<'EOF'
content: rewrite /privacy for PDPA alignment

Closes drift between the policy and actual data practices:

- Adds dedicated sections for session replay (error-only via Sentry) and
  creator verification (Singpass MyInfo — stores hashed UINFIN, never raw)
- Adds Sentry and Google Analytics 4 to data-sharing disclosure
- Rewrites cookies section to honestly acknowledge GA4 with IP anonymisation
- Removes all marketing-email language (we're transactional-only)
- Expands retention into per-category table with KYC 7yr, messages
  campaign-lifespan, replays 30d, financial records 7yr
- Renames Contact section to "Data Protection Officer & Contact" and
  names hello@ as the DPO mailbox
- Bumps Last Updated to 24 April 2026

Sub-project #1 of 3 pre-launch trust & compliance work.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Final verification + changelog

**Files:**
- Modify: `~/Desktop/changelog/getthatbread-changelog.md` (personal log outside repo)

- [ ] **Step 1: Final clean-repo type check**

Run: `npx tsc --noEmit`
Expected: exits cleanly.

- [ ] **Step 2: Final clean-repo lint**

Run: `npm run lint 2>&1 | grep -E "(instrumentation-client|privacy/page|CheckoutForm)" || echo "clean"`
Expected: `clean`

- [ ] **Step 3: Verify commit history**

Run: `git log --oneline -5`
Expected (top three, in some order): the three commits from Tasks 1–3 all present.

Example:
```
<hash> content: rewrite /privacy for PDPA alignment
<hash> feat: add inline consent line to pledge checkout
<hash> chore: flip Sentry session replay to error-only
```

- [ ] **Step 4: Update the personal changelog**

Read `~/Desktop/changelog/getthatbread-changelog.md` first with the Read tool to get current content. Then use Edit to append under the existing `## 2026-04-24` → `### Trust & compliance` block (it's already the most recent date).

Find the closing `- ` line of the existing Trust & compliance block, and insert these three new bullets before the separator:

```
- `content` **PDPA review**: rewrote /privacy to match actual data practices — added dedicated sections for Sentry session replay (error-only) and Singpass KYC (stores SHA-256 hash of UINFIN, never raw), added Sentry + GA4 to data-sharing disclosure, switched cookies section to honestly acknowledge GA4 with IP anonymisation, removed all marketing-email language (we're transactional-only), expanded data retention into a per-category table. Closes sub-project #1 of 3.
- `code` Flipped **Sentry session replay to error-only** (`replaysSessionSampleRate: 0.1 → 0`). Ambient sessions are no longer recorded; we only capture when an error actually fires.
- `design` Added inline consent line under Confirm pledge on checkout — links to Terms, Privacy Policy, and Refund & Dispute Policy for PDPA deemed-consent-by-conduct at payment point.
```

- [ ] **Step 5: Mark the sub-project complete in your running todo**

Update TodoWrite to mark "Brainstorm sub-project #1 (PDPA review)" completed. All three pre-launch trust & compliance sub-projects are now shipped.

- [ ] **Step 6: (Optional) Open PR**

If the user wants a PR, prompt them to confirm. Do not push or open PRs unprompted — this repo's convention is to ask first.

---

## Self-review notes (author → implementer)

- **No tests.** This is static content + one config flag. Unit tests on JSX marketing copy would be pure churn. `tsc` + `lint` + browser smoke is the right bar.
- **Three independent commits** so each is reviewable and revertable on its own. Don't squash.
- **Marketing language.** Audit before committing Task 3 — any stray "promotions", "offers", "newsletter" text in /privacy contradicts our transactional-only stance. grep for it.
- **DPO is a mailbox not a person.** Don't personify it ("Daryl Wui, DPO"). Just the mailbox.
- **UINFIN hash wording.** Keep it as "SHA-256 hash" / "one-way cryptographic hash" — these match the migration file comment. Don't soften to "we hash it" or "anonymised".
- **Out of scope reminder:** no new DB columns, no account-deletion endpoint, no cookie banner, no `marketing_consent` column. If you find yourself touching migrations or API routes, stop — you've left the plan.
