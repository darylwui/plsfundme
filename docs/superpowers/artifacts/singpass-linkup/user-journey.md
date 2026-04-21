# User Journey Presentation — Slide-by-Slide Draft

**How to use this file:** GovTech provides a `.pptx` template when you
start the linkup application in the developer portal. Download that
template, then copy the text below slide-by-slide into the
corresponding template slides. Each slide in this doc is designed to
drop into one template page with minimal adjustment.

**Wireframes are acceptable** for first submission — you do not need
live screenshots of the sandbox UI before submitting. For wireframes,
a clean hand-drawn sketch or a Figma mock is fine. Each slide below
specifies what imagery to pair with the text.

**If you'd rather not hand-draw:** the product is live enough that
taking real screenshots once the Phase 1 + Phase 2 branches are
deployed to a preview URL is probably less work. In that case, replace
wireframe notes with "Screenshot: \<URL\>" and capture the real UI.

---

## Slide 1 — Title / Overview

**Title:** Get That Bread — Singpass Myinfo Integration

**Subtitle:** Identity verification for Singapore-resident creators
on a reward-based crowdfunding platform

**Body:**

> Get That Bread is a reward-based crowdfunding platform launching in
> Singapore in 2026. Every creator on the platform must verify their
> identity through Singpass Myinfo before publishing a campaign, both
> to prevent duplicate-account fraud and to ensure the recipient of
> any payout matches a real, legally-identifiable Singapore resident
> aged 18 or over.
>
> This deck walks through the verification flow from the creator's
> perspective.

**Imagery:** The Get That Bread logo (ask Daryl for the asset) plus a
simple diagram of the three actors: Creator → Get That Bread →
Singpass.

---

## Slide 2 — Creator signs up → lands on dashboard

**Title:** Step 1: Creator signs up and lands on the dashboard

**Body:**

> A new creator signs up via email / OAuth and is routed through the
> standard account-creation flow (email verification, display name,
> etc.). They land on their dashboard, which presents a verification
> card prompting them to complete Singpass identity verification
> before they can publish a campaign.

**Imagery:** Wireframe of the creator dashboard. Key element to call
out with an arrow or highlight: the "Verify your identity with
Singpass" card in the top-right position of the dashboard.

**Caption under wireframe:**

> *Dashboard — Singpass verification card is pinned until the creator
> verifies.*

---

## Slide 3 — Consent screen (pre-Singpass)

**Title:** Step 2: Creator reviews what we'll receive from Singpass

**Body:**

> Clicking "Verify with Singpass" routes the creator to our internal
> consent screen at `/kyc/singpass/start`. This screen, **before any
> redirect to Singpass occurs**, tells the creator exactly which
> Myinfo fields we will retrieve and why we need each one.
>
> A visible secondary link below the primary action surfaces the
> **non-Singpass alternative path** for creators who are based
> outside Singapore or cannot use Singpass — ensuring Singpass is not
> the sole available onboarding method.

**Imagery:** Wireframe of `/kyc/singpass/start`. Call out with
arrows/highlights:
- The list of 5 Myinfo fields with justification for each.
- The primary "Continue to Singpass →" button.
- The alternative-path link (`hello@getthatbread.sg`).

**Caption:**

> *Consent screen — the alternative-path link is visible, not hidden.*

---

## Slide 4 — Singpass authenticates the user

**Title:** Step 3: Singpass authentication + consent (out of scope)

**Body:**

> On clicking "Continue to Singpass," we generate CSRF state + PKCE
> verifier + nonce, stash them in an encrypted short-lived httpOnly
> cookie, and redirect the creator to the Singpass authorization
> endpoint.
>
> The Singpass UI from this point is the standard Singpass experience
> — app-based biometric authentication or password + 2FA, followed by
> the standard Myinfo consent screen where the creator confirms each
> field we've requested.

**Imagery:** Singpass's own standard "app authentication +
consent" screens. GovTech's template likely already provides these;
if not, placeholder text is sufficient.

**Caption:**

> *Standard Singpass authentication + consent — unchanged from
> GovTech reference.*

---

## Slide 5 — Confirmation screen (display-before-persist)

**Title:** Step 4: Creator reviews retrieved data (read-only) and confirms

**Body:**

> After Singpass redirects back, our callback route exchanges the
> authorization code for tokens, decrypts the ID token JWE + userinfo
> JWE, and extracts the five Myinfo fields. **No database writes
> happen yet.**
>
> Instead, the payload is stashed in a second short-lived encrypted
> httpOnly cookie (5-minute TTL) and the creator is redirected to
> `/kyc/singpass/confirm` — a read-only display of what Singpass
> returned. The creator must explicitly click "Confirm and continue"
> for any record to be written to our database.
>
> A "Something's wrong — cancel this verification" link on the same
> screen lets the creator abort without writing anything.

**Imagery:** Wireframe of `/kyc/singpass/confirm` showing four fields
laid out read-only (Legal name, Date of birth, Nationality, Residential
status), a primary "Confirm and continue" button, and the secondary
cancel link.

**Caption:**

> *Read-only confirmation — explicit creator consent before any
> database write. Complies with the Myinfo data-display guideline.*

---

## Slide 6 — Verified state + campaign submission unblocked

**Title:** Step 5: Creator is verified → can now publish campaigns

**Body:**

> On confirm, we write a `creator_verifications` row (with the hashed
> UINFIN, legal name, DOB, nationality, residency) inside a single
> Postgres transaction that also flips
> `project_manager_profiles.singpass_verified = true` and
> `profiles.kyc_status = 'approved'`.
>
> The creator is redirected to their dashboard with a success toast.
> The previously blocked "Submit for review" button on any in-progress
> campaign draft is now active.

**Imagery:** Two wireframes side-by-side or stacked:
- **Left:** Dashboard with a green "Identity verified via Singpass"
  card in place of the previous verification prompt.
- **Right:** Project-edit page showing the "Submit for review" button
  is now enabled (previously replaced by a "Verify first" banner).

**Caption:**

> *Verified creator — all gates release. The pink/green Singpass-
> verified badge also appears on the creator's public profile page.*

---

## Slide 7 — Error state: Underage creator

**Title:** Error case: creator is under 18

**Body:**

> On the callback, we compute `today - DOB`. If the creator is under
> 18, we skip the display-confirmation step entirely (no need to show
> data we're about to reject) and redirect to a dedicated error page
> at `/kyc/singpass/underage`. No database writes; no cached data.
>
> The page explains the 18+ requirement in plain English and invites
> the creator to return when eligible.

**Imagery:** Wireframe of `/kyc/singpass/underage` — simple center-
aligned page with a clear headline and explanatory text.

---

## Slide 8 — Error state: Non-Citizen / non-PR

**Title:** Error case: residential status not Citizen / PR

**Body:**

> If Singpass returns a `residentialstatus` of Foreigner, or a blank
> value (which is what FIN-holders and some long-term-pass holders
> return), the callback redirects to `/kyc/singpass/foreigner`
> without writing any record.
>
> The page surfaces the same alternative-path link as the consent
> screen, so the creator has a clear next step rather than a dead
> end.

**Imagery:** Wireframe of `/kyc/singpass/foreigner` with the
`hello@getthatbread.sg` mailto link visibly highlighted.

---

## Slide 9 — Error state: Duplicate NRIC

**Title:** Error case: NRIC already linked to another account

**Body:**

> If a creator tries to verify with a UINFIN whose SHA-256 hash
> already exists in `creator_verifications`, the unique-index
> violation at the database layer triggers a redirect to
> `/kyc/singpass/duplicate`. This happens at the confirm step, not
> the callback — because that's where the DB write occurs.
>
> The page offers a support contact for legitimate edge cases
> (account recovery after email change, etc.), which the founding
> team handles manually.

**Imagery:** Wireframe of `/kyc/singpass/duplicate` with the support
email contact visible.

---

## Slide 10 — Admin view (read-only)

**Title:** Admin view — recently-verified creators

**Body:**

> Authorised administrators can view recently-verified creators at
> `/admin/kyc`. This view is **read-only** — government-originated
> data cannot be edited here, in line with GovTech's display
> guidelines. The UINFIN hash is displayed as its last six hex
> characters only; the raw value is never accessible to any
> administrator.

**Imagery:** Wireframe of `/admin/kyc` showing the "Recently
Singpass-verified creators" table.

---

## Slide 11 — Security recap

**Title:** Security posture summary

**Body:**

> - TLS 1.2+ everywhere; HSTS 2-year max-age.
> - FAPI 2.0-track: PKCE + DPoP + private_key_jwt.
> - ES256 signing key + ECDH-ES+A256GCM encryption key (per
>   environment), rotated on an 11-month cadence.
> - Private keys live only in Vercel encrypted env vars; never in
>   git, logs, or Sentry.
> - Raw UINFIN is hashed on receipt and the plaintext is never
>   persisted or logged. Sentry has a defence-in-depth scrubber that
>   regex-strips any NRIC-format string from event payloads.
> - Database writes are transactional across three tables; a failure
>   rolls back all three.
> - Row-Level Security on `creator_verifications` limits reads to
>   the creator themselves + authorised admins.

**Imagery:** No imagery required for this slide — plain bullets.

---

## Slide 12 — Closing / next steps

**Title:** Linkup request summary

**Body:**

> - **Applicant:** Get That Bread (UEN: TBD — see submission)
> - **Production domain:** https://getthatbread.sg
> - **Sandbox client:** already registered, end-to-end tested
> - **Supporting documents:** PDPA statement, field justifications,
>   security practices, redirect URI list, alternative-path
>   description, privacy policy — all attached / linked in the
>   portal submission.
> - **Live privacy policy URL:**
>   https://getthatbread.sg/privacy (updated pre-submission with the
>   Identity Verification section).
> - **Live JWKS URL:**
>   https://getthatbread.sg/.well-known/jwks.json

**Imagery:** Get That Bread logo + Singpass Myinfo logo (ask GovTech
template for the Myinfo asset).

---

## Notes for assembly

- Total: 12 slides. This matches GovTech's typical expectation of
  ~10–15 slides for the user-journey deck.
- Each slide body here is intentionally verbose; when pasting into
  the GovTech template, you may want to trim to ~3–5 bullets per
  slide and move the prose to speaker notes.
- For wireframes: if time-constrained, a Figma sketch is fine. If not
  — open the deployed preview URL, hit each page, take screenshots.
  The real UI is more persuasive than wireframes.
