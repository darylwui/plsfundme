# Data-Field Justification

**Platform:** Get That Bread (`https://getthatbread.sg`) — a reward-
based crowdfunding platform for Singapore-based entrepreneurs and
creators.

**Requested Myinfo fields:** 5 fields, enumerated below.

**Principle:** We request the minimum set of fields required to (a)
guarantee one real Singapore-resident person per creator account, (b)
gate commercial activity on an 18+ age floor, and (c) match identity
at payout. No field is requested for marketing or analytics.

---

## 1. `uinfin`

**Why we need it:** Prevent duplicate-account fraud. Reward-based
crowdfunding platforms are a known vector for scam campaigns — a bad
actor who creates multiple creator accounts can run the same fraudulent
campaign repeatedly and re-victimise backers. A one-to-one mapping
between a real Singapore-registered person and a single creator account
is our primary anti-abuse control.

**How we use it:** The raw UINFIN is **never persisted**. On receipt,
we SHA-256 hash it immediately and store only the hash in a unique-
indexed column (`creator_verifications.uinfin_hash`). The raw value is
discarded with the OIDC response object and is never logged, never
sent to Sentry, and never visible in admin UI. A subsequent
verification attempt with the same UINFIN triggers a unique-violation
at the DB layer, which our application converts to a dedicated
"this NRIC is already linked to another account" error page.

**Display:** The hash is displayed to admins as a last-6-character
suffix only (e.g. `…a1b2c3`) for audit-trail identification. The raw
value is never displayed to anyone, including the creator themselves.

---

## 2. `name`

**Why we need it:** At payout, we transfer funds raised from backers
to the creator's Singapore bank account or PayNow. We are legally and
operationally obliged to ensure the recipient of the payout matches
the verified identity of the campaign creator — this is basic AML
hygiene and protects us from being an unwitting conduit for mule-
account activity.

**How we use it:** Stored as `creator_verifications.verified_name`.
Displayed read-only in admin contexts (for payout review). At payout,
cross-checked against the PayNow display name / bank-account name on
file; mismatches trigger manual review by the founding team. The
creator's public-facing display name on the platform is a separate
user-chosen field, so the legal name is never exposed publicly.

---

## 3. `dob`

**Why we need it:** Singapore's age of majority for commercial
contract is 18. Our platform allows creators to enter into funding
agreements with backers — these are commercial arrangements and we
decline to enable them for minors, both as a legal risk posture and to
protect minors from the obligations that come with running a crowd-
funded campaign (delivery, refunds, PDPA responsibilities).

**How we use it:** On verification, we compute `today - DOB` and reject
the flow if the result is less than 18 years. DOB is stored for audit
purposes but is never displayed publicly. A creator rejected for being
under 18 sees a dedicated page explaining the restriction.

---

## 4. `nationality`

**Why we need it:** At payout, our tax treatment of the creator's
income depends in part on their tax residency. Nationality is an input
to that determination — specifically, for distinguishing Singapore-
tax-resident creators from others, and for flagging creators whose
tax situation may need accountant review (e.g. dual nationals).

**How we use it:** Stored. Not displayed publicly. Referenced only at
payout by authorised administrators to confirm tax-treatment before
releasing funds.

---

## 5. `residentialstatus`

**Why we need it:** Get That Bread operates as a Singapore-focused
reward-based crowdfunding platform. We have chosen — as a matter of
product positioning and operational scope — to accept creators who are
Singapore Citizens or Permanent Residents only. Foreigners,
long-term-pass holders with blank residential status, and other non-
PR residents are directed to an alternative, manual onboarding process
via `hello@getthatbread.sg`.

**How we use it:** On verification, a hard gate: `Citizen` or
`Permanent Resident` → continue; anything else (including blank for
FIN-holders) → rejected with a dedicated page that explicitly surfaces
the email-based alternative path. Stored for audit. Not displayed
publicly.

---

## Summary

All five fields are used exclusively for identity assurance, anti-
abuse, and compliance functions. None is used for marketing, profiling,
or analytics. The raw UINFIN is never persisted; the other four are
stored encrypted at rest in Supabase's Singapore region and visible
only to the creator themselves (read-only) and authorised
administrators (read-only).
