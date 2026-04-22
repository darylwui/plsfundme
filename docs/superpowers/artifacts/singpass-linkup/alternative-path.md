# Alternative (Non-Singpass) Onboarding Path

GovTech's Myinfo onboarding policy requires that Singpass not be the
only method by which a user can authenticate with a service. Below is
the alternative path Get That Bread makes available to creators who
cannot or choose not to use Singpass.

## Who this path is for

- **Foreign-based creators** (not SG Citizens, not SG Permanent
  Residents) running campaigns with a genuine Singapore connection —
  e.g. a Malaysian artist touring in Singapore, a Singaporean-diaspora
  creator running a project with local ties.
- **Long-term-pass holders** (Employment Pass, S Pass, Dependant
  Pass, etc.) whose `residentialstatus` Myinfo field returns blank or
  non-PR values. These creators are directed here because our primary
  product requirement (SG Citizen or PR) cannot be verified via
  Myinfo.
- **Creators who have Singpass but prefer not to use it**, for
  personal reasons. Rare but surfaced as an option.

## Where the alternative path is surfaced

The alternative is **visibly surfaced inside the Singpass verification
UI**, not hidden behind a private-contact path. Specifically:

1. **Consent screen (`/kyc/singpass/start`)**: Below the primary
   "Continue to Singpass" call-to-action, a visible secondary link
   reads:

   > *"Based outside Singapore? Campaigns from foreign-based creators
   > are handled separately — email hello@getthatbread.sg and we'll be
   > in touch."*

2. **Foreigner-rejection page (`/kyc/singpass/foreigner`)**: If a
   creator proceeds through Singpass but `residentialstatus` rejects
   them, the page they land on surfaces the same email link as the
   next step.

The email address `hello@getthatbread.sg` is monitored by the founding
team daily.

## What happens when a creator uses the alternative path

1. Creator emails `hello@getthatbread.sg` describing their campaign
   and SG connection.
2. Founding team evaluates the prospective creator's suitability and
   responds within 3 business days.
3. If accepted, the team conducts a manual KYC process via submitted
   identity documents:
   - Government-issued photo ID (passport front page is standard for
     non-SG nationals; NRIC/FIN photo page for SG-connected creators).
   - Proof of address (utility bill, tenancy agreement, bank statement,
     < 3 months old).
   - A short video call to match the person to the document.
4. On successful verification, the creator's account is set up with
   `profiles.kyc_status = 'approved'` and
   `profiles.kyc_override_reason` populated with a free-text rationale
   (e.g. *"Malaysian creator, SG-based tour campaign — passport MY1234567
   verified by video call on 2026-06-01"*).
5. The creator can then launch campaigns as normal.

## Expected volume

We expect this path to handle **under 5% of creators** in the first 12
months post-launch. The majority of our target market — Singapore-
based entrepreneurs — will use Singpass. This alternative exists to
prevent our positioning as "Singapore-focused" from calcifying into
exclusionary policy in edge cases.

## Differences from Singpass-verified accounts

Admin UI surfaces these accounts distinctly:

- `profiles.kyc_status = 'approved'` **without** a matching
  `creator_verifications` row → the admin queue displays them in a
  separate section with the override reason visible, so audit trails
  make the basis of approval clear.
- The Singpass-verified badge on public campaign pages is withheld
  from these accounts (they show a generic "Identity verified"
  indicator only).
- Duplicate-detection relies on manual review rather than the
  hashed-UINFIN unique index. The founding team logs passport / FIN
  numbers in an internal ledger to spot re-submissions.

## Why this is not automated

We deliberately do not build an automated document-KYC pipeline for
launch. At projected volumes (<5% of creators, perhaps 1–5 cases per
month), manual handling by the founding team is more accurate, more
empathetic to creators with genuine but atypical situations, and
avoids the additional regulatory complexity of operating a
document-verification provider contract (e.g. Sumsub, Stripe
Identity) for a tiny minority of users.

If volume materially grows, we will evaluate automated alternatives at
that time and update this policy.
