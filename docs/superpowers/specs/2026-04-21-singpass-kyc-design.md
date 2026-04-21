# Singpass Myinfo KYC for Creators — Design

**Status:** Draft for review
**Author:** Claude (brainstormed with daryl.wui@gmail.com)
**Date:** 2026-04-21
**Launch-blocking:** Yes. Creator launch is gated on Singpass approval.

## Context

Get That Bread (internal name `plsfundme`) is a Singapore reward-based
crowdfunding platform launching in ~May/June 2026. Before we let anyone
run a campaign, we need to verify they are a real Singapore resident
old enough to enter into a commercial contract, and that we haven't
already verified them under a different account.

The chosen mechanism is **Singpass Myinfo v5** — SG GovTech's OIDC-based
identity verification service. It returns legal name, date of birth,
nationality, and residential status for the authenticated user, and we
use the (SHA-256-hashed) UINFIN as a uniqueness guarantee across our
account base.

GovTech requires a ~2–6 week approval process ("linkup application")
before we can hit the production Singpass endpoints. The sandbox is
self-serve. This spec covers both the sandbox build we can ship
immediately and the paperwork we need to submit on day 1 so the
approval clock starts now.

## Non-goals

- **No manual-review fallback pipeline for launch.** Creator launch is
  delayed until Singpass is live in production. The existing
  `profiles.kyc_status` enum + `/admin/kyc` page stay in the codebase as
  an admin-override path for edge cases (e.g., foreign-based creators we
  onboard manually), but are not a primary launch mechanism.
- **No face-verification / Identiface integration.** Reward-based
  crowdfunding is not MAS-regulated; Singpass-level assurance (AL2) is
  sufficient.
- **No provider-abstraction layer.** We are Singpass-only. If we ever
  add Sumsub / Stripe Identity / etc., we refactor then with real
  requirements.

## Product decisions

The following were decided during brainstorming and are not re-litigated
during implementation:

| # | Decision | Rationale |
|---|---|---|
| 1 | Delay creator launch until Singpass production approval lands | Cleanest scope; no migration-path code; no fallback pipeline |
| 2 | Gate: **before "Submit for review"** | Catches fraud before admin review; aligns with existing `kyc_status='pending'` workflow |
| 3 | Request 5 Myinfo fields: `uinfin`, `name`, `dob`, `nationality`, `residentialstatus` | Minimum viable set matches `creator_verifications` table; defensible in linkup application |
| 4 | Singapore-only (Citizens + PRs). Foreigners email `hello@getthatbread.sg` | Matches the "Singapore-focused crowdfunding" positioning. Keeps scope tight |
| 5 | Age gate: 18+ | SG standard for commercial activity |
| 6 | Duplicate UINFIN = hard fail | `uinfin_hash` unique index already exists; no auto-merge |
| 7 | One-time verification, no expiry | Name changes via support email |
| 8 | Entry points: dashboard card + "Submit for review" banner | Proactive nudge + reactive hard gate |
| 9 | Environment-switched single implementation (Approach A) | Smallest thing that covers today and tomorrow; YAGNI on provider abstraction |

## Architecture

### File layout

```
lib/singpass/
├── config.ts        # env → endpoints + client_id + JWK sources
├── client.ts        # wraps the OIDC helper; exports initiateAuth(), exchangeCode(), getUserInfo()
├── consent.ts       # fields we request + human-readable labels (used in UI + linkup app)
├── persist.ts       # Myinfo response → creator_verifications row + flag flips; transactional
└── errors.ts        # UnderageError, ForeignerError, DuplicateUinfinError, StateMismatchError, etc.

app/kyc/singpass/
├── start/page.tsx               # consent screen
└── (no callback page — callback is API-only)

app/api/auth/singpass/
├── start/route.ts               # POST → generates state/nonce/PKCE → 302 to Singpass
└── callback/route.ts            # GET — code exchange → persist → 302 to dashboard

app/.well-known/jwks.json/
└── route.ts                     # publishes our PUBLIC signing + encryption keys

scripts/
└── generate-singpass-jwks.ts    # one-shot JWK pair generator (for key rotation)
```

### Environment-switched config

`lib/singpass/config.ts` reads `SINGPASS_ENV` from env and returns:

```ts
{
  issuer: "https://stg-id.singpass.gov.sg" | "https://id.singpass.gov.sg",
  authorizationEndpoint: ...,
  tokenEndpoint: ...,
  userinfoEndpoint: ...,
  jwksUri: ...,  // Singpass's public keys
  clientId: process.env.SINGPASS_CLIENT_ID,
  redirectUri: process.env.SINGPASS_REDIRECT_URI,
  signingJwk: JSON.parse(process.env.SINGPASS_SIGNING_PRIVATE_JWK!),
  encryptionJwk: JSON.parse(process.env.SINGPASS_ENCRYPTION_PRIVATE_JWK!),
  scopes: ["openid", "uinfin", "name", "dob", "nationality", "residentialstatus"],
}
```

Sandbox and production use the same variable names, different values,
set per-environment in Vercel.

### Library choice

Primary: `@govtechsg/singpass-myinfo-oidc-helper` (GovTech-maintained).

**Open question, to resolve during week 1 of sandbox build:** does the
helper support PAR (Pushed Authorization Requests) as required for
FAPI 2.0 compliance (mandatory by 31 Dec 2026)? If not, we drop the
helper and use `openid-client` or `oauth4webapi` directly. The helper
definitely handles DPoP.

## End-to-end flow

```
Creator's browser           Our Next.js app                    Singpass
─────────────────           ───────────────                    ────────

[Dashboard]
  "Verify" button ─────▶ GET /kyc/singpass/start
                         (consent screen; server component)

  "Continue to SG" ────▶ POST /api/auth/singpass/start
                         ├─ generate state + nonce + PKCE verifier
                         ├─ encrypt+sign into httpOnly cookie
                         │  (10-min TTL, SameSite=Lax)
                         └─ 302 ─────────────────────────────▶  /auth endpoint
                                                                ?client_id=…
                                                                &redirect_uri=…/callback
                                                                &scope=openid+uinfin+name+dob+nationality+residentialstatus
                                                                &code_challenge=…
                                                                &state=…&nonce=…

                                                                (user authenticates on
                                                                 Singpass app + consents)

                         ◀────── 302 with ?code=…&state=…
                         GET /api/auth/singpass/callback
                         ├─ verify state matches cookie ──▶ [StateMismatchError]
                         ├─ exchange code for tokens (DPoP + client_assertion)
                         ├─ decrypt ID token JWE ←── our encryption JWK
                         ├─ verify ID token JWS ←── Singpass JWKS
                         ├─ validate iss/aud/exp/nonce
                         ├─ call /userinfo with DPoP
                         ├─ decrypt+verify userinfo JWE
                         └─ extract { uinfin, name, dob, nationality, residentialstatus }

                         ── Business logic ──
                         ├─ age check: DOB + 18y > today?      ──▶ [UnderageError]
                         ├─ residency gate:
                         │   "Citizen" or "Permanent Resident"? ──▶ continue
                         │   "Foreigner" or blank (FIN-holder)  ──▶ [ForeignerError]
                         ├─ uinfin_hash = sha256(uinfin)
                         ├─ BEGIN transaction
                         │   ├─ INSERT INTO creator_verifications
                         │   │     (profile_id, method='singpass', uinfin_hash,
                         │   │      verified_name, verified_dob, nationality, residency)
                         │   │     ← unique-violation triggers [DuplicateUinfinError]
                         │   ├─ UPDATE project_manager_profiles
                         │   │     SET singpass_verified = true WHERE id = $auth.uid
                         │   └─ UPDATE profiles
                         │       SET kyc_status = 'approved' WHERE id = $auth.uid
                         ├─ COMMIT
                         ├─ clear state cookie
                         └─ 302 ──▶ /dashboard?verified=1
```

### Key security properties

- **Raw UINFIN never persisted.** Hashed immediately; plaintext
  garbage-collected along with the response object. Not logged. Not in
  Sentry breadcrumbs.
- **Stateless server-side state management.** State/nonce/PKCE
  verifier live in a signed+encrypted httpOnly cookie; no server-side
  session store required.
- **DB writes are a single transaction** across three tables. Failure
  rolls back all three.
- **DPoP + PKCE + private_key_jwt** — FAPI-2.0-track from day 1.
- **Government data is never displayed back to the creator.** We
  store+act on Singpass fields server-side; no "confirm what we got"
  step.

## Error handling matrix

| Failure | User sees | Sentry severity | Retriable? |
|---|---|---|---|
| User cancels on Singpass (`error=access_denied`) | Toast: *"Verification cancelled. Ready when you are."* + "Try again" button | none (expected) | yes |
| State / CSRF mismatch | Full-page: *"Session expired. Please start over."* | warning | yes, restart |
| Singpass /token 5xx or timeout | Full-page: *"Singpass is temporarily unavailable. Please try again in a few minutes."* | error + DPoP request-id | yes, restart |
| JWE decrypt / JWS verify fails | Full-page: *"Something went wrong verifying your identity. Please try again, or email hello@getthatbread.sg."* | **critical** (wake on-call) | no until keys fixed |
| UnderageError (DOB < 18y ago) | Dedicated page: *"You must be 18 to run a campaign on Get That Bread. Come back when you hit 18 — we'll save your spot."* | info (compliance audit log) | no |
| ForeignerError (residency ≠ Citizen/PR, or blank for FIN-holders) | Dedicated page: *"Get That Bread is currently open to Singapore Citizens and PRs only. If you're based outside SG and interested in running a campaign, email hello@getthatbread.sg and we'll reach out."* | info | no |
| DuplicateUinfinError | Dedicated page: *"This NRIC is already linked to another Get That Bread account. If that wasn't you, email hello@getthatbread.sg."* | **high** (possible fraud) | no, requires support |
| DB write mid-transaction fails | Full-page: *"Something went wrong saving your verification. Please try again."* | **critical** (on-call) | yes |
| Already verified (re-entry) | 302 to `/dashboard?already_verified=1` + toast | none | N/A |

**Sentry scrubber:** `beforeSend` hook regex-strips anything matching
`[STFG]\d{7}[A-Z]` (UINFIN format) from event payloads — belt-and-
suspenders for raw UINFIN leaks.

**Singpass request correlation ID** is logged on every failure so
support queries to GovTech have a specific trace.

## Gating + admin UI

### Creator-side

1. **Soft nudge** — `SingpassVerificationCard` on the dashboard goes
   live. "Coming soon" pill → "**Required before you can submit a
   campaign**" pill. Disabled button → real link to
   `/kyc/singpass/start`.

2. **Hard gate** — on the project edit page, the "Submit for review"
   button is replaced (not just disabled) by an inline banner when the
   creator is not Singpass-verified:

   > *Verify your identity with Singpass before submitting. [Verify now →]*

   Server-side, the "Submit for review" server action re-checks
   `project_manager_profiles.singpass_verified = true` before flipping
   project status. Client check is UX; server check is authority.

### Admin-side

`/admin/kyc` page evolves:

- **"Recently Singpass-verified" section (new, top):** last 30
  `creator_verifications` rows — display name, verified legal name,
  DOB, nationality, residency, `uinfin_hash` last-6-chars, verified-at.
  **Read-only** (GovTech requirement: government-originated data must
  be un-editable in our UI).
- **"Pending manual review" section (existing, below):** same
  approve/reject queue. Expected empty in practice — kept for admin
  override of manually-onboarded foreigners.

### Schema add: `profiles.kyc_override_reason`

Nullable text column. Only populated when `kyc_status='approved'`
*without* a matching `creator_verifications` row. Saves future
"how did this person get approved without Singpass?" investigations.

### Foreigner escape hatch

On the consent page at `/kyc/singpass/start`, a visible secondary link
below the "Continue to Singpass" button:

> *Based outside Singapore? Campaigns from foreign-based creators are
> handled separately — [email hello@getthatbread.sg](mailto:hello@getthatbread.sg?subject=Foreign%20creator%20interest)
> and we'll be in touch.*

This link is required by GovTech policy: the non-Singpass alternative
must be visible in the UI, not hidden behind a private channel.

## Keys, env vars, cutover

### JWK pairs — two per environment

| Purpose | Algorithm | Used for | Rotation |
|---|---|---|---|
| Client signing | `ES256` (P-256) | client_assertion JWT + DPoP proofs | 11-month cadence |
| Client encryption | `ECDH-ES+A256GCM` | decrypting ID token + userinfo JWE from Singpass | 11-month cadence |

Four JWKs total (sandbox pair + prod pair), zero overlap.

### Env vars (identical names, different values per environment)

```
SINGPASS_ENV=sandbox | prod
SINGPASS_CLIENT_ID=<issued by portal>
SINGPASS_SIGNING_PRIVATE_JWK=<JSON string>
SINGPASS_SIGNING_KID=<key-id>
SINGPASS_ENCRYPTION_PRIVATE_JWK=<JSON string>
SINGPASS_ENCRYPTION_KID=<key-id>
SINGPASS_REDIRECT_URI=https://getthatbread.sg/api/auth/singpass/callback
```

Set per-environment in Vercel: Development, Preview, Production.

### Public JWKS endpoint

`/.well-known/jwks.json` — route handler that reads the private JWKs,
strips secret components, returns the public-key set. Unauthenticated,
cacheable. Singpass fetches this to verify our client_assertion and
DPoP proofs.

### Key rotation procedure (11-month cadence)

1. Generate fresh keypair (`node scripts/generate-singpass-jwks.ts`)
2. Add new public key to our JWKS endpoint (now returns both old+new)
3. Wait 5 minutes for caches
4. Flip `SINGPASS_*_KID` env to new key — live traffic signs with new,
   Singpass still accepts old for verification
5. After 24 hours, remove old key from JWKS
6. Delete old private key from env

### Sandbox → production cutover sequence

The day GovTech approves:

1. Log into developer portal → production tab → register prod client → get prod `client_id`
2. Upload same JWKS endpoint URL for prod client
3. In Vercel Production env: update `SINGPASS_ENV=prod`, `SINGPASS_CLIENT_ID=<prod value>`, optionally rotate JWKs
4. Redeploy. Zero downtime.
5. Sandbox env stays on Preview / Development branches — PR previews keep hitting sandbox forever.

Users mid-flow during cutover: cookie state becomes invalid against
the new client_id, they see "session expired," restart.

### Secret hygiene

- Private JWKs **never** in git, Sentry, logs, or client code
- `process.env` access only in `runtime = "nodejs"` route handlers
- Leaked encryption JWK = full rotation + re-register with GovTech

## Data model

Existing (migration 017):

```sql
create table creator_verifications (
  profile_id     uuid        primary key references profiles(id) on delete cascade,
  method         text        not null check (method = 'singpass'),
  uinfin_hash    text        not null,
  verified_name  text        not null,
  verified_dob   date,
  nationality    text,
  residency      text,
  verified_at    timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create unique index creator_verifications_uinfin_hash_unique
  on creator_verifications (uinfin_hash);
```

New in this project (migration 018, TBD):

```sql
-- Audit/override hook for manual admin-side approvals (foreigners etc.)
alter table profiles
  add column kyc_override_reason text null;
```

### State-field reconciliation

Three places track "is this creator verified":

- `creator_verifications` row exists → Singpass-verified (the authority)
- `project_manager_profiles.singpass_verified = true` → cached flag for fast dashboard reads
- `profiles.kyc_status = 'approved'` → generic enum used by admin queue

On successful Singpass callback, all three are updated in one
transaction. The `creator_verifications` row is the source of truth;
the other two are denormalized convenience.

## Linkup application deliverables

The following seven items ship as appendices of this spec. When you're
ready to submit, I'll export them into the GovTech `.pptx` template
(for the user journey) and freeform prose (for the rest).

### 1. User-journey deck (GovTech template, .pptx)

Wireframes are acceptable for first submission — you do not need a
working sandbox screenshot before submitting. I'll hand you slide
content; you paste into the official template after downloading it
from the developer portal.

Slides:
1. Creator signs up → lands on dashboard
2. Dashboard shows `SingpassVerificationCard` (wireframe)
3. Click → consent page at `/kyc/singpass/start` (wireframe, with
   visible foreigner-escape link highlighted)
4. Redirect to Singpass (standard Singpass UI — out of scope)
5. User authenticates + consents on Singpass
6. Redirect back to `/dashboard?verified=1` with success toast +
   verified badge
7. "Submit for review" button now active on project-edit page
8. Error states: underage, foreigner, duplicate (screenshots of each
   dedicated error page)

### 2. Data-field justification

| Field | Why we need it | How we use it |
|---|---|---|
| `uinfin` | Prevent duplicate-account fraud — our primary anti-abuse concern on a platform that solicits public funds | SHA-256 hashed immediately; raw never persisted. Hash is unique key on `creator_verifications` |
| `name` | Match payout recipient against campaign creator (AML hygiene) | Stored as `verified_name`; admin-only display; cross-checked against PayNow/bank-account name at payout |
| `dob` | Verify 18+ (SG commercial age of majority) | Age computed on verify; DOB stored for audit; not displayed publicly |
| `nationality` | IRAS tax-residency determination at payout | Stored, not displayed |
| `residentialstatus` | Platform is open only to SG Citizens + PRs | Hard gate on verify; Foreigners + FIN-holders (blank value) blocked with foreigner-escape redirect |

### 3. Alternative (non-Singpass) path

Prose for the application:

> Creators who cannot use Singpass (non-SG nationals, individuals
> without a Singpass account, long-term pass holders with blank
> residential status) may contact hello@getthatbread.sg to initiate a
> manual onboarding process. The founding team evaluates the
> prospective creator's suitability, conducts KYC via submitted identity
> documents (passport + proof of address), and if accepted, sets up the
> creator's account with `kyc_status='approved'` and
> `kyc_override_reason` populated with the onboarding rationale. This
> alternative is surfaced directly on the Singpass verification screen
> as a visible link (not email-only), consistent with GovTech's
> "Singpass cannot be the sole onboarding option" guidance. This path
> is expected to be rare (<5% of creators) and is intended primarily for
> foreign-based creators with SG-relevant campaigns.

### 4. PDPA consent + retention

Prose for the application:

> Get That Bread retrieves, processes, and stores the following Myinfo
> fields with user consent: uinfin (hashed), name, date of birth,
> nationality, residential status. Consent is obtained via a dedicated
> consent screen prior to redirect, which enumerates each field and
> its purpose.
>
> Raw UINFIN is not persisted at any point — it is SHA-256 hashed
> immediately on retrieval and the plaintext is discarded with the
> response object. Retrieved Myinfo fields are displayed read-only in
> admin contexts and are not displayed to the creator themselves.
>
> **Retention:** Verification records are retained for the lifetime of
> the creator's account plus five years post-closure, consistent with
> commercial record-keeping norms and anticipated AML obligations if
> the platform ever moves into regulated crowdfunding activities.
> Creators may request account closure and data deletion at any time
> by emailing hello@getthatbread.sg; deletion is effected within 30
> days as required by PDPA Section 22.
>
> **Draft purge:** Abandoned Singpass authorization flows (user starts
> but does not complete) leave no persistent state — the ephemeral
> state cookie expires after 10 minutes and no database rows are
> written until a successful callback.
>
> **Storage:** Data is stored encrypted at rest in Supabase's Singapore
> region. Row-Level Security policies restrict access to the
> creator themselves and authorized administrators. The production
> database is accessible only via TLS.

### 5. Security practices

Prose for the application:

> - **TLS everywhere.** All traffic to and from Get That Bread is
>   served over HTTPS with TLS 1.2+. HSTS enabled with 63072000-second
>   max-age.
> - **FAPI 2.0 readiness.** The integration targets FAPI 2.0 from day
>   one, using PKCE, DPoP-bound access tokens, and private_key_jwt
>   client authentication. We intend to meet the 31 Dec 2026 compliance
>   deadline well in advance.
> - **JWK management.** Signing (ES256) and encryption (ECDH-ES+A256GCM)
>   private keys are stored as encrypted environment variables in
>   Vercel, accessible only to Node.js runtime route handlers. Never
>   committed to version control. Never logged. Annual rotation with
>   11-month safety margin and graceful overlap period.
> - **Public JWKS endpoint.** Public keys published at
>   `https://getthatbread.sg/.well-known/jwks.json` for Singpass to
>   fetch.
> - **Error tracking.** Sentry configured with a `beforeSend` scrubber
>   that regex-strips any UINFIN-formatted strings
>   (`[STFG]\d{7}[A-Z]`) from event payloads as defense-in-depth
>   against accidental logging.
> - **Database security.** PostgreSQL (via Supabase) with Row-Level
>   Security policies on `creator_verifications`. Service-role
>   writes from server-only context. Creator self-select, admin read-
>   all; no public access.
> - **Incident response.** Sentry alerts route to founder on-call. We
>   commit to notifying GovTech of any Singpass-data-related incident
>   within the timeframes required by the API Services Agreement.

### 6. Redirect URI registration

- **Sandbox:** `https://getthatbread.sg/api/auth/singpass/callback`
  (plus a preview-deployment wildcard if GovTech permits — typically
  `https://*.vercel.app/api/auth/singpass/callback`)
- **Production:** same URL, different client_id

### 7. Privacy policy additions

New "Identity Verification" section to add to `/terms` or `/privacy`
before submitting the linkup application (GovTech visits this URL to
verify):

> **Identity Verification via Singpass Myinfo**
>
> Creators on Get That Bread are required to verify their identity
> through Singpass Myinfo before publishing a campaign. When you
> verify, Singpass returns the following information to us with your
> explicit consent:
>
> - Your NRIC/FIN (which we immediately hash and never store in raw
>   form)
> - Your legal name
> - Your date of birth
> - Your nationality
> - Your residential status
>
> We use this information to: (a) prevent the same person from creating
> multiple creator accounts; (b) match campaign payouts to the real
> person running the campaign; (c) verify you are at least 18 years
> old; (d) determine appropriate tax treatment at payout; (e) confirm
> the platform is currently available to you (Singapore Citizens and
> Permanent Residents only).
>
> We retain your verification record for the lifetime of your account
> plus five years after account closure. You may request deletion at
> any time by emailing hello@getthatbread.sg; we will effect deletion
> within 30 days as required under Singapore's Personal Data
> Protection Act.
>
> If you cannot use Singpass — for example, because you are based
> outside Singapore — you may contact hello@getthatbread.sg to discuss
> alternative onboarding arrangements on a case-by-case basis.

## Testing strategy

### Unit tests (`lib/singpass/`)

- `config.ts` — env switching works; missing env vars throw clear errors
- `persist.ts` — transactional DB writes; underage throws
  `UnderageError`; foreigner throws `ForeignerError`; duplicate UINFIN
  throws `DuplicateUinfinError`; successful path writes all three rows
- `consent.ts` — field list matches `creator_verifications` schema
- `errors.ts` — each error has the right user-facing message

### Integration tests (happy path)

- `app/api/auth/singpass/callback` end-to-end with a mocked Singpass
  response (using `msw` or similar): verify state validation, cookie
  clearing, DB writes, 302 target
- Re-entry (already verified) → 302 to dashboard with query param
- State mismatch → 4xx + clear error

### Sandbox end-to-end

Using GovTech's published test UINFINs (e.g., `S9812381D` et al.) and
a live Vercel preview deployment:

1. Complete full flow with a happy-path test NRIC
2. Test underage NRIC (DOB < 18y ago)
3. Test foreigner NRIC (residentialstatus=Foreigner)
4. Test FIN-holder (blank residentialstatus)
5. Test duplicate-verification (run happy path twice with same NRIC —
   second should fail)
6. Test mid-flow cancel (click Cancel in Singpass UI)

Screenshots of each case go into the user-journey deck as
"error-state" slides.

### Not tested

- Real-identity verification (obviously — sandbox only uses test data)
- Production client_id flow (we test prod manually on the day of
  cutover; no automated prod-only test)

## Open questions (to resolve during implementation)

1. **PAR support in `@govtechsg/singpass-myinfo-oidc-helper`.** If
   absent, swap to `openid-client` or `oauth4webapi`. Decision in week 1.
2. **Preview-deployment redirect URI wildcard.** GovTech's policy on
   wildcards varies; ask during sandbox-client registration.
3. **Exact sandbox client registration flow.** Self-serve but requires
   Corppass-authenticated SDP account — user needs to finish that
   before we can register the client.

## What the user does next

These are blocking for the approval clock to start. The coding can
proceed in parallel as soon as step 3 is done.

1. **This week.** Create a Singpass developer account at
   https://developer.singpass.gov.sg via Corppass (using the UEN). If
   Corppass isn't set up, do that first at https://www.corppass.gov.sg.
2. **This week.** Confirm self as authorized signatory inside Corppass
   for the API Services Agreement.
3. **This week.** Register a sandbox client in the developer portal.
   Upload our public JWKS URL. Receive the sandbox `client_id`. This
   unblocks me to ship the sandbox integration end-to-end.
4. **Before submitting — log into SDP billing tab.** Screenshot
   current Myinfo Standard pricing tier (pricing is behind Singpass
   auth and changes; don't rely on external estimates).
5. **When drafts are ready.** Review this spec's appendices, paste
   into the GovTech `.pptx` template + linkup form, attach pricing
   screenshot, submit. Clock starts.
6. **When GovTech responds** (~2 weeks): iterate on any back-and-
   forth. Sign the API Services Agreement when sent.
7. **When approved:** follow the sandbox → production cutover
   sequence in the "Keys, env vars, cutover" section above.

## References

- [Pre-requisites for onboarding](https://docs.developer.singpass.gov.sg/docs/getting-started/pre-requisites-for-onboarding)
- [Key principles](https://docs.developer.singpass.gov.sg/docs/products/singpass-myinfo/key-principles)
- [User journey submission](https://docs.developer.singpass.gov.sg/docs/products/myinfo/user-journey)
- [Quick start](https://docs.developer.singpass.gov.sg/docs/getting-started/quick-start)
- [Myinfo data catalog](https://docs.developer.singpass.gov.sg/docs/data-catalog-myinfo/catalog)
- [Data display guidelines](https://docs.developer.singpass.gov.sg/docs/products/singpass-myinfo/data-display-guidelines)
- [Myinfo FAQ](https://docs.developer.singpass.gov.sg/docs/products/singpass-myinfo/faq)
- [GovTechSG/singpass-myinfo-oidc-helper](https://github.com/GovTechSG/singpass-myinfo-oidc-helper)
- FAPI 2.0 compliance deadline: 31 December 2026
