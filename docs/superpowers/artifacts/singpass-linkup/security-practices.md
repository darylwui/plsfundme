# Security Practices for Singpass Myinfo Integration

## Transport security

- All public-facing traffic is served over **HTTPS with TLS 1.2 or
  higher**. Plaintext HTTP is unconditionally redirected to HTTPS.
- HSTS is enabled with `max-age=63072000` (2 years) and
  `includeSubDomains`.
- The Singpass authorization endpoint and token endpoint are called
  server-side only; never from the browser.

## OAuth / OIDC security posture

- **FAPI 2.0-track from day one**: Pushed Authorization Requests (PAR
  — subject to helper library support, otherwise via direct
  `openid-client` calls), **PKCE** (S256) on every authorization
  request, **DPoP**-bound access tokens, and **private_key_jwt**
  client authentication.
- The `state`, `nonce`, and PKCE `code_verifier` are generated from
  32 bytes of `crypto.randomBytes()` per authorization attempt and are
  never reused.
- The `state` cookie is carried in a short-lived httpOnly cookie
  (`__Host-` prefix, `Secure`, `SameSite=Lax`, 10-minute TTL) as an
  encrypted JWE (alg `dir`, enc `A256GCM`) keyed on a server-side
  secret. No server-side session store is required.
- The retrieved Myinfo payload is shuttled to the user-confirmation
  step in a second `__Host-`-prefixed cookie (5-minute TTL, same JWE
  encryption) and is never written to the database until the creator
  explicitly confirms on the read-only display screen.

## JWK / key management

- Two keypairs per environment (sandbox + production), zero overlap:
  - **Signing key**: ES256 (P-256), used for `client_assertion` JWTs
    and DPoP proofs.
  - **Encryption key**: ECDH-ES+A256GCM, used to decrypt the ID token
    and user-info JWEs returned by Singpass.
- Private JWKs are stored as encrypted environment variables in
  Vercel. They are accessible only to Node.js runtime route handlers
  (`runtime = "nodejs"`) on server-side code paths.
- Private JWKs are **never** committed to git, **never** logged,
  **never** sent to Sentry, **never** exposed in client bundles.
- Public JWKs are published at
  `https://getthatbread.sg/.well-known/jwks.json` for Singpass to
  fetch during token exchange and DPoP verification.
- **Rotation cadence**: 11-month safety margin. Procedure is
  documented internally and follows a graceful overlap pattern —
  publish the new public key → wait for caches → flip the signing KID
  → wait 24h → delete the old key.

## Application security

- **Raw UINFIN never persisted.** SHA-256 hashing happens in the same
  stack frame as receipt; the plaintext is garbage-collected with the
  OIDC response object.
- **Sentry defence-in-depth scrubber.** A `beforeSend` hook regex-
  strips any UINFIN-formatted string (`[STFG]\d{7}[A-Z]`) from Sentry
  event payloads. This protects against accidental logging even in the
  presence of bugs.
- **Transactional DB writes.** The three-table write (insert into
  `creator_verifications`, update `project_manager_profiles`, update
  `profiles`) is wrapped in a single Postgres function
  (`persist_creator_verification`, `SECURITY DEFINER`, explicit
  transaction boundaries) so a failure in any of the three rolls back
  all three.
- **Singpass request correlation ID** is captured in every error log,
  enabling precise support queries to GovTech when debugging is
  required.

## Database security

- Supabase Postgres, **Singapore region**.
- **Row-Level Security (RLS)** on `creator_verifications`:
  - `SELECT` policy: the row's `profile_id = auth.uid()` (creator
    sees their own row only) OR caller has the `admin` role in
    `profiles.role` (admin sees all rows, read-only).
  - No `INSERT`/`UPDATE`/`DELETE` policies for end-users — writes
    happen only through the `persist_creator_verification`
    `SECURITY DEFINER` function.
- Service-role database credentials live only in server-side Vercel
  env vars.
- No public (unauthenticated) read access to the Singpass-derived
  tables.

## Incident response

- **Monitoring**: Sentry is configured to page the founder on-call
  for any `critical`-severity event (JWE decrypt failures, DB write
  failures mid-transaction, unexpected Singpass 5xx patterns).
- **Escalation**: Incidents affecting Singpass-retrieved data
  trigger the incident-notification commitments documented in
  `pdpa-statement.md`.
- **Key compromise**: A leaked encryption JWK triggers full rotation
  (new keypair, republish JWKS, rotate KID) and, per the API Services
  Agreement, notification to GovTech.
