# PDPA Consent, Retention, and Data-Handling Statement

## Consent

Get That Bread obtains explicit, informed consent from every creator
before initiating a Singpass Myinfo retrieval. Consent is obtained via
a dedicated consent screen at `/kyc/singpass/start` that, **prior to
the redirect to Singpass**, enumerates each of the five requested
Myinfo fields alongside a plain-English explanation of the purpose
each field serves. A visible secondary link on the same screen directs
creators who cannot or do not wish to use Singpass to an alternative,
email-based onboarding path (`hello@getthatbread.sg`), ensuring that
Singpass is not the sole available onboarding option.

After Singpass returns the retrieved data, we display it read-only to
the creator on a confirmation screen (`/kyc/singpass/confirm`) for
their verification before any record is created. The creator must
explicitly click "Confirm and continue" for the `creator_verifications`
row to be written. If the data looks wrong or the creator changes
their mind, a cancel link on the same screen clears the session and
writes no record.

## Data collected

The five Myinfo fields we collect are:

| Field | Stored? | Stored form | Visible to creator | Visible to admin |
|---|---|---|---|---|
| `uinfin` | No (hashed only) | SHA-256 hash | No (last-6 of hash shown in admin, not to creator) | Last-6 of hash only |
| `name` | Yes | Plaintext | Read-only on confirmation screen and dashboard badge | Read-only |
| `dob` | Yes | ISO date | Read-only on confirmation screen | Read-only |
| `nationality` | Yes | Plaintext | Read-only on confirmation screen | Read-only |
| `residentialstatus` | Yes | Plaintext | Read-only on confirmation screen | Read-only |

The raw UINFIN is **never** persisted at any point. It is SHA-256
hashed on retrieval and the plaintext is garbage-collected with the
OIDC response object. It never enters application logs, Sentry
breadcrumbs, database rows, or admin UI.

## No data reuse across sessions

In accordance with GovTech's Myinfo Key Principles, Get That Bread
**does not retrieve Myinfo data on behalf of a user and cache it for
re-use** in a later session or for a different purpose than the one
consented to at retrieval time.

Specifically:

- Each Singpass authorization is a **one-time retrieval**. Access and
  refresh tokens are discarded immediately after the user-info call
  that populates the confirmation screen; we do not refresh or reuse
  them.
- The four retained fields (name, DOB, nationality, residency) are
  the **attested verification outcome** — a record that verification
  occurred at a point in time — not a cached copy of the user's
  Myinfo profile for re-use.
- The `creator_verifications` row is written once per successful
  verification event and is not updated by subsequent background
  Myinfo calls. If a creator's verified identity needs to be refreshed
  or corrected, they re-authenticate through Singpass and a new
  verification record is created.

## Retention

Verification records (`creator_verifications` rows) are retained for:

- The **lifetime of the creator's Get That Bread account**, plus
- **Five years after account closure**, to satisfy commercial
  record-keeping norms and anticipated audit / AML obligations should
  the platform later fall within a regulated crowdfunding framework.

## Withdrawal and deletion

Creators may request account closure and data deletion at any time by
emailing `hello@getthatbread.sg`. In accordance with **Section 22 of
the Personal Data Protection Act 2012**, deletion is effected within
30 days of the verified request. Deletion cascades the `profile_id`
foreign key to the `creator_verifications` table and purges the
hashed UINFIN along with all other stored fields.

## Incomplete flows

Abandoned Singpass authorization flows leave no persistent state:

- The state cookie (`__Host-singpass-state`, 10-minute TTL) carrying
  CSRF state + PKCE verifier expires on its own and is not backed by
  any server-side store.
- The pending-payload cookie (`__Host-singpass-pending`, 5-minute
  TTL) carrying the read-only-display payload expires on its own and
  is cleared explicitly if the creator clicks "Something's wrong —
  cancel" on the confirmation screen.
- No database rows are written until a successful, user-confirmed
  callback through `/api/auth/singpass/confirm`.

## Storage and access control

Data is stored encrypted at rest in Supabase's Singapore region.
Row-Level Security (RLS) policies restrict access to the creator
themselves (read-only, own row only) and to authorised administrators
(read-only, all rows). Write access is limited to the server-side
`persist_creator_verification` RPC (Postgres `SECURITY DEFINER`)
invoked only from the `/api/auth/singpass/confirm` route handler under
a logged-in user session. The production database is accessible only
via TLS 1.2+.

## Data Protection Officer

For all data-protection queries, including access, correction, and
deletion requests:

**Daryl Wui** — `hello@getthatbread.sg`

## Incident notification

Should any incident occur involving unauthorised access to Myinfo-
retrieved data, we commit to notifying GovTech within the timeframe
required by the Singpass Myinfo API Services Agreement, and the
Singapore Personal Data Protection Commission within 72 hours where
applicable under the PDPA Data Breach Notification Obligation.
