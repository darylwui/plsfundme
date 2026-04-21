# Singpass Myinfo KYC for Creators — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Singpass Myinfo KYC flow that every creator must pass before they can submit a campaign on Get That Bread, delivering all credential-free scaffolding immediately (Phase 1) and wiring real Singpass calls once the sandbox `client_id` arrives (Phase 2), with zero-code production cutover once GovTech approves (Phase 3).

**Architecture:** One environment-switched implementation (sandbox vs prod selected by `SINGPASS_ENV`). Server-only OIDC flow in two App Router API routes (`/api/auth/singpass/start`, `/api/auth/singpass/callback`) using stateless signed+encrypted cookies for CSRF/PKCE. Business-logic helpers in a new `lib/singpass/` module with typed error classes. The `/admin/kyc` page and dashboard card evolve in-place to surface the new verification state. A thin typed shim around `@govtechsg/singpass-myinfo-oidc-helper` keeps the wire details isolated and testable.

**Tech Stack:** Next.js 16 App Router (Node runtime for all Singpass routes), React 19, TypeScript, Supabase Postgres with RLS, Vercel env vars (Sandbox / Preview / Production), `@govtechsg/singpass-myinfo-oidc-helper` (pending PAR-support check), `jose` (already transitively available) for JWK operations, Sentry for error capture, Vitest + @testing-library/react (already configured) for unit tests.

---

## Phases at a Glance

| Phase | Blocker | Tasks | Deliverable |
|---|---|---|---|
| **Phase 1 — Credential-free foundation** | None (can start today) | Tasks 1–16 | Everything runs against a *stubbed* Singpass client. Feature flag off. |
| **Phase 2 — Real sandbox wiring** | User has registered sandbox client + env vars set | Tasks 17–21 | Real OIDC round-trip against `stg-id.singpass.gov.sg`. Feature flag on for admins. |
| **Phase 3 — Production cutover** | GovTech linkup approved + prod `client_id` issued | Tasks 22–23 | Feature flag on for all creators. Submit-for-review gate active. |

Each phase is independently commit-and-merge-able.

---

## File Structure

### New files

**`lib/singpass/` — server-only module**
- `lib/singpass/config.ts` — reads `SINGPASS_ENV` and returns endpoints + credentials for the chosen environment.
- `lib/singpass/errors.ts` — typed error subclasses: `UnderageError`, `ForeignerError`, `DuplicateUinfinError`, `StateMismatchError`, `SingpassUnavailableError`, `CryptoError`, `AlreadyVerifiedError`.
- `lib/singpass/consent.ts` — list of Myinfo fields we request + human-readable labels (used in UI + linkup docs).
- `lib/singpass/state-cookie.ts` — encodes/decodes the httpOnly state cookie (state + nonce + PKCE verifier).
- `lib/singpass/client.ts` — thin wrapper around the GovTech helper library; in Phase 1 exports stubs that the tests control.
- `lib/singpass/persist.ts` — transactional writer: Myinfo response → `creator_verifications` + `project_manager_profiles.singpass_verified` + `profiles.kyc_status`.
- `lib/singpass/hash.ts` — `sha256Uinfin(raw)` helper (plus a `redactUinfin` helper used by the Sentry scrubber).
- `lib/singpass/__tests__/*.test.ts` — unit tests colocated with the module.

**App Router routes (server-only, `runtime = "nodejs"`)**
- `app/kyc/singpass/start/page.tsx` — server component: consent screen.
- `app/kyc/singpass/start/StartButton.tsx` — client component: form that POSTs to `/api/auth/singpass/start`.
- `app/api/auth/singpass/start/route.ts` — POST handler: builds auth URL, sets state cookie, 302s to Singpass.
- `app/api/auth/singpass/callback/route.ts` — GET handler: code exchange → persist → 302.
- `app/.well-known/jwks.json/route.ts` — GET: publishes our public signing+encryption JWKS.
- `app/kyc/singpass/error/page.tsx` — fallback error page (generic).
- `app/kyc/singpass/underage/page.tsx`
- `app/kyc/singpass/foreigner/page.tsx`
- `app/kyc/singpass/duplicate/page.tsx`

**New UI components**
- `components/creation/ProjectSubmitGate.tsx` — wraps the Step4 submit button; shows either the real button or an "Verify first" CTA depending on server-resolved verification state.
- `components/admin/RecentlyVerifiedList.tsx` — top-of-page section for `/admin/kyc` listing the last 30 `creator_verifications` rows (read-only).

**Migrations + scripts**
- `supabase/migrations/018_kyc_override_reason.sql` — adds `profiles.kyc_override_reason text null`.
- `scripts/generate-singpass-jwks.ts` — one-shot key generator for rotation / first-time setup.

**Sentry scrubber**
- `sentry.server.config.ts` (modify) + `sentry.edge.config.ts` (modify) — add `beforeSend` hook using `redactUinfin`.

### Files modified

- `components/dashboard/SingpassVerificationCard.tsx` — flip from "Coming soon" placeholder to live card.
- `components/creation/Step4_Review.tsx` — replace raw `<Button onClick={handleLaunch}>` with `<ProjectSubmitGate />`; move `handleLaunch`'s DB insert behind a server action that re-checks verification.
- `app/admin/kyc/page.tsx` — fetch and render `RecentlyVerifiedList` above existing `KycApprovalList`.
- `package.json` — add `@govtechsg/singpass-myinfo-oidc-helper`, `jose`.
- `.env.example` — document all `SINGPASS_*` vars.

### Files explicitly NOT touched

- `supabase/migrations/017_creator_verifications.sql` — already captures the final schema; no changes.
- Existing `/admin/kyc` approve/reject logic — stays as admin-override for manually-onboarded foreigners.

---

## Phase 1 — Credential-Free Foundation (Tasks 1–16)

Everything in Phase 1 can ship today. No Singpass credentials required. Real Singpass calls are stubbed via a `mockSingpassClient` that tests drive. The feature flag `SINGPASS_ENV` defaults to `disabled` — in which case the consent page shows "Verification isn't live yet" and the start route returns 503.

### Task 1: Add the `018_kyc_override_reason` migration

**Files:**
- Create: `supabase/migrations/018_kyc_override_reason.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Audit/override hook: when an admin manually approves a non-Singpass
-- creator (e.g., foreigners contacted via hello@getthatbread.sg), we
-- store the reason here so future audits can distinguish
-- Singpass-verified approvals from admin-override approvals.
--
-- Nullable. Only populated when profiles.kyc_status='approved' *without*
-- a matching creator_verifications row.

alter table profiles
  add column if not exists kyc_override_reason text null;

comment on column profiles.kyc_override_reason is
  'Non-null only for admin-override KYC approvals (no creator_verifications row). '
  'Example: "Foreign-based creator, contacted via hello@getthatbread.sg on 2026-06-01".';
```

- [ ] **Step 2: Apply locally via Supabase CLI (if linked) or via the MCP tool**

Run: `npx supabase db push` (or use `mcp__*__apply_migration` if you prefer — both acceptable). Verify with:

```sql
select column_name, is_nullable
from information_schema.columns
where table_name = 'profiles' and column_name = 'kyc_override_reason';
```

Expected: one row, `is_nullable = YES`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/018_kyc_override_reason.sql
git commit -m "feat(kyc): add profiles.kyc_override_reason for admin-override audit trail"
```

---

### Task 2: Install Singpass + JOSE dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the packages**

```bash
npm install @govtechsg/singpass-myinfo-oidc-helper jose
```

Note: if the helper package fails (private registry / package renamed), note the failure in the PR description and continue with `jose` + `openid-client`. Resolving the registry issue is a separate follow-up.

- [ ] **Step 2: Verify the install**

```bash
npm ls @govtechsg/singpass-myinfo-oidc-helper jose
```

Expected: both packages resolve with a version, no `UNMET DEPENDENCY` warnings.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(kyc): install singpass-myinfo-oidc-helper and jose"
```

---

### Task 3: Document env vars in `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Append the Singpass block**

Append to `.env.example` (create the file with an empty body if it doesn't exist):

```env
# ─── Singpass Myinfo KYC ─────────────────────────────────────────────────
# One of: disabled | sandbox | prod
# "disabled" means the verification flow returns 503 and UI shows a pre-launch notice.
SINGPASS_ENV=disabled

# Issued by the Singpass developer portal (sandbox value until GovTech approves prod).
SINGPASS_CLIENT_ID=

# Stringified JWK (ES256 private key) + its key id. Generate with:
#   npx tsx scripts/generate-singpass-jwks.ts
SINGPASS_SIGNING_PRIVATE_JWK=
SINGPASS_SIGNING_KID=

# Stringified JWK (ECDH-ES+A256GCM private key) + its key id.
SINGPASS_ENCRYPTION_PRIVATE_JWK=
SINGPASS_ENCRYPTION_KID=

# Must match exactly what's registered with Singpass.
# Dev: http://localhost:3000/api/auth/singpass/callback
# Prod: https://getthatbread.sg/api/auth/singpass/callback
SINGPASS_REDIRECT_URI=http://localhost:3000/api/auth/singpass/callback
# ────────────────────────────────────────────────────────────────────────
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs(kyc): document SINGPASS_* env vars in .env.example"
```

---

### Task 4: Write the JWK generator script

**Files:**
- Create: `scripts/generate-singpass-jwks.ts`

- [ ] **Step 1: Write the script**

```ts
/**
 * One-shot generator for a Singpass client keypair (signing + encryption).
 *
 * Run:   npx tsx scripts/generate-singpass-jwks.ts
 * Output: private JWK JSON (for env vars) + public JWK JSON (for JWKS endpoint preview).
 *
 * Use once per environment (sandbox + prod get separate keypairs).
 * Rotate every ~11 months per the spec's key rotation procedure.
 */
import { generateKeyPair, exportJWK } from "jose";
import { randomUUID } from "node:crypto";

async function main() {
  const { privateKey: sigPriv, publicKey: sigPub } = await generateKeyPair("ES256");
  const { privateKey: encPriv, publicKey: encPub } = await generateKeyPair("ECDH-ES+A256GCM", {
    crv: "P-256",
  });

  const sigKid = randomUUID();
  const encKid = randomUUID();

  const sigPrivJwk = { ...(await exportJWK(sigPriv)), kid: sigKid, use: "sig", alg: "ES256" };
  const sigPubJwk = { ...(await exportJWK(sigPub)), kid: sigKid, use: "sig", alg: "ES256" };
  const encPrivJwk = {
    ...(await exportJWK(encPriv)),
    kid: encKid,
    use: "enc",
    alg: "ECDH-ES+A256GCM",
  };
  const encPubJwk = {
    ...(await exportJWK(encPub)),
    kid: encKid,
    use: "enc",
    alg: "ECDH-ES+A256GCM",
  };

  console.log("# --- Add these to Vercel env vars ---");
  console.log(`SINGPASS_SIGNING_PRIVATE_JWK='${JSON.stringify(sigPrivJwk)}'`);
  console.log(`SINGPASS_SIGNING_KID=${sigKid}`);
  console.log(`SINGPASS_ENCRYPTION_PRIVATE_JWK='${JSON.stringify(encPrivJwk)}'`);
  console.log(`SINGPASS_ENCRYPTION_KID=${encKid}`);
  console.log("");
  console.log("# --- Public JWKS (for sanity-checking /.well-known/jwks.json) ---");
  console.log(JSON.stringify({ keys: [sigPubJwk, encPubJwk] }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Smoke test the script**

Run: `npx tsx scripts/generate-singpass-jwks.ts`
Expected: prints two env-var blocks and a public JWKS JSON with two keys (`use: "sig"` + `use: "enc"`). Discard the output — this is just a smoke test.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-singpass-jwks.ts
git commit -m "feat(kyc): add scripts/generate-singpass-jwks.ts for keypair generation"
```

---

### Task 5: Write the errors module

**Files:**
- Create: `lib/singpass/errors.ts`
- Test: `lib/singpass/__tests__/errors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/singpass/__tests__/errors.test.ts
import { describe, expect, it } from "vitest";
import {
  AlreadyVerifiedError,
  CryptoError,
  DuplicateUinfinError,
  ForeignerError,
  isSingpassError,
  SingpassError,
  SingpassUnavailableError,
  StateMismatchError,
  UnderageError,
} from "../errors";

describe("SingpassError hierarchy", () => {
  it("all subclasses inherit from SingpassError", () => {
    expect(new UnderageError("x")).toBeInstanceOf(SingpassError);
    expect(new ForeignerError("x")).toBeInstanceOf(SingpassError);
    expect(new DuplicateUinfinError("x")).toBeInstanceOf(SingpassError);
    expect(new StateMismatchError("x")).toBeInstanceOf(SingpassError);
    expect(new SingpassUnavailableError("x")).toBeInstanceOf(SingpassError);
    expect(new CryptoError("x")).toBeInstanceOf(SingpassError);
    expect(new AlreadyVerifiedError("x")).toBeInstanceOf(SingpassError);
  });

  it("isSingpassError narrows the type", () => {
    const err: unknown = new UnderageError("nope");
    expect(isSingpassError(err)).toBe(true);
    expect(isSingpassError(new Error("plain"))).toBe(false);
    expect(isSingpassError(null)).toBe(false);
  });

  it("each error exposes a stable `code` for routing", () => {
    expect(new UnderageError("x").code).toBe("UNDERAGE");
    expect(new ForeignerError("x").code).toBe("FOREIGNER");
    expect(new DuplicateUinfinError("x").code).toBe("DUPLICATE_UINFIN");
    expect(new StateMismatchError("x").code).toBe("STATE_MISMATCH");
    expect(new SingpassUnavailableError("x").code).toBe("UNAVAILABLE");
    expect(new CryptoError("x").code).toBe("CRYPTO");
    expect(new AlreadyVerifiedError("x").code).toBe("ALREADY_VERIFIED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/singpass/__tests__/errors.test.ts`
Expected: FAIL with "Cannot find module '../errors'".

- [ ] **Step 3: Write the implementation**

```ts
// lib/singpass/errors.ts
export type SingpassErrorCode =
  | "UNDERAGE"
  | "FOREIGNER"
  | "DUPLICATE_UINFIN"
  | "STATE_MISMATCH"
  | "UNAVAILABLE"
  | "CRYPTO"
  | "ALREADY_VERIFIED";

export class SingpassError extends Error {
  public readonly code: SingpassErrorCode;
  constructor(code: SingpassErrorCode, message: string) {
    super(message);
    this.name = "SingpassError";
    this.code = code;
  }
}

export class UnderageError extends SingpassError {
  constructor(message = "User is under 18.") {
    super("UNDERAGE", message);
    this.name = "UnderageError";
  }
}

export class ForeignerError extends SingpassError {
  constructor(message = "User is not a Singapore Citizen or PR.") {
    super("FOREIGNER", message);
    this.name = "ForeignerError";
  }
}

export class DuplicateUinfinError extends SingpassError {
  constructor(message = "This NRIC is already linked to another account.") {
    super("DUPLICATE_UINFIN", message);
    this.name = "DuplicateUinfinError";
  }
}

export class StateMismatchError extends SingpassError {
  constructor(message = "OAuth state did not match; possible CSRF.") {
    super("STATE_MISMATCH", message);
    this.name = "StateMismatchError";
  }
}

export class SingpassUnavailableError extends SingpassError {
  constructor(message = "Singpass is temporarily unavailable.") {
    super("UNAVAILABLE", message);
    this.name = "SingpassUnavailableError";
  }
}

export class CryptoError extends SingpassError {
  constructor(message = "JWE/JWS processing failed.") {
    super("CRYPTO", message);
    this.name = "CryptoError";
  }
}

export class AlreadyVerifiedError extends SingpassError {
  constructor(message = "This account is already verified.") {
    super("ALREADY_VERIFIED", message);
    this.name = "AlreadyVerifiedError";
  }
}

export function isSingpassError(err: unknown): err is SingpassError {
  return err instanceof SingpassError;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/singpass/__tests__/errors.test.ts`
Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/singpass/errors.ts lib/singpass/__tests__/errors.test.ts
git commit -m "feat(kyc): add typed Singpass error hierarchy"
```

---

### Task 6: Write the hash helper

**Files:**
- Create: `lib/singpass/hash.ts`
- Test: `lib/singpass/__tests__/hash.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/singpass/__tests__/hash.test.ts
import { describe, expect, it } from "vitest";
import { redactUinfin, sha256Uinfin } from "../hash";

describe("sha256Uinfin", () => {
  it("returns a stable 64-char lowercase hex string", () => {
    const out = sha256Uinfin("S1234567D");
    expect(out).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Uinfin("S1234567D")).toBe(out); // deterministic
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(sha256Uinfin("s1234567d")).toBe(sha256Uinfin("S1234567D"));
    expect(sha256Uinfin(" S1234567D ")).toBe(sha256Uinfin("S1234567D"));
  });
});

describe("redactUinfin", () => {
  it("replaces a UINFIN in a string with [REDACTED]", () => {
    expect(redactUinfin("leaked: S1234567D in logs")).toBe("leaked: [REDACTED] in logs");
  });

  it("handles all prefix letters S/T/F/G", () => {
    expect(redactUinfin("T0000001Z")).toBe("[REDACTED]");
    expect(redactUinfin("F1234567B")).toBe("[REDACTED]");
    expect(redactUinfin("G9999999A")).toBe("[REDACTED]");
  });

  it("redacts multiple occurrences", () => {
    expect(redactUinfin("S1234567D and T0000001Z both leaked")).toBe(
      "[REDACTED] and [REDACTED] both leaked"
    );
  });

  it("does not over-redact", () => {
    expect(redactUinfin("no UINFIN here, just text")).toBe("no UINFIN here, just text");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/singpass/__tests__/hash.test.ts`
Expected: FAIL with "Cannot find module '../hash'".

- [ ] **Step 3: Write the implementation**

```ts
// lib/singpass/hash.ts
import { createHash } from "node:crypto";

/**
 * SHA-256 of a normalized UINFIN. Used as the primary dedup key in
 * creator_verifications. RAW UINFIN IS NEVER PERSISTED ANYWHERE — this
 * hash is the only form we keep.
 */
export function sha256Uinfin(raw: string): string {
  const normalized = raw.trim().toUpperCase();
  return createHash("sha256").update(normalized).digest("hex");
}

// UINFIN format: [STFG]\d{7}[A-Z]
const UINFIN_REGEX = /\b[STFG]\d{7}[A-Z]\b/g;

/**
 * Strips any UINFIN-shaped substring from a string. Used by the Sentry
 * `beforeSend` hook as a belt-and-suspenders guard against raw UINFIN
 * leaking into breadcrumbs / error messages.
 */
export function redactUinfin(input: string): string {
  return input.replace(UINFIN_REGEX, "[REDACTED]");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/singpass/__tests__/hash.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/singpass/hash.ts lib/singpass/__tests__/hash.test.ts
git commit -m "feat(kyc): add sha256Uinfin + redactUinfin helpers"
```

---

### Task 7: Write the config module

**Files:**
- Create: `lib/singpass/config.ts`
- Test: `lib/singpass/__tests__/config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/singpass/__tests__/config.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSingpassConfig, SingpassConfigError } from "../config";

describe("getSingpassConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear Singpass env vars between tests.
    for (const k of Object.keys(process.env)) {
      if (k.startsWith("SINGPASS_")) delete process.env[k];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when SINGPASS_ENV is unset or 'disabled'", () => {
    expect(getSingpassConfig()).toBeNull();
    process.env.SINGPASS_ENV = "disabled";
    expect(getSingpassConfig()).toBeNull();
  });

  it("returns sandbox endpoints when SINGPASS_ENV=sandbox", () => {
    process.env.SINGPASS_ENV = "sandbox";
    process.env.SINGPASS_CLIENT_ID = "sandbox-client";
    process.env.SINGPASS_SIGNING_PRIVATE_JWK = '{"kty":"EC","kid":"k1"}';
    process.env.SINGPASS_SIGNING_KID = "k1";
    process.env.SINGPASS_ENCRYPTION_PRIVATE_JWK = '{"kty":"EC","kid":"k2"}';
    process.env.SINGPASS_ENCRYPTION_KID = "k2";
    process.env.SINGPASS_REDIRECT_URI = "http://localhost:3000/cb";

    const cfg = getSingpassConfig();
    expect(cfg).not.toBeNull();
    expect(cfg!.env).toBe("sandbox");
    expect(cfg!.issuer).toBe("https://stg-id.singpass.gov.sg");
    expect(cfg!.clientId).toBe("sandbox-client");
    expect(cfg!.scopes).toContain("openid");
    expect(cfg!.scopes).toContain("uinfin");
  });

  it("returns prod endpoints when SINGPASS_ENV=prod", () => {
    process.env.SINGPASS_ENV = "prod";
    process.env.SINGPASS_CLIENT_ID = "prod-client";
    process.env.SINGPASS_SIGNING_PRIVATE_JWK = '{"kty":"EC","kid":"k1"}';
    process.env.SINGPASS_SIGNING_KID = "k1";
    process.env.SINGPASS_ENCRYPTION_PRIVATE_JWK = '{"kty":"EC","kid":"k2"}';
    process.env.SINGPASS_ENCRYPTION_KID = "k2";
    process.env.SINGPASS_REDIRECT_URI = "https://getthatbread.sg/cb";

    const cfg = getSingpassConfig();
    expect(cfg!.env).toBe("prod");
    expect(cfg!.issuer).toBe("https://id.singpass.gov.sg");
  });

  it("throws SingpassConfigError when enabled but required vars missing", () => {
    process.env.SINGPASS_ENV = "sandbox";
    // Missing client_id, JWKs, etc.
    expect(() => getSingpassConfig()).toThrow(SingpassConfigError);
  });

  it("throws when SINGPASS_ENV is an unknown value", () => {
    process.env.SINGPASS_ENV = "staging-weird";
    expect(() => getSingpassConfig()).toThrow(SingpassConfigError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/singpass/__tests__/config.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/singpass/config.ts

/**
 * Server-only. Do NOT import from client components or the middleware.
 *
 * Reads SINGPASS_ENV and returns the endpoints + credentials for the
 * chosen environment. Returns null when SINGPASS_ENV is "disabled" or
 * unset — callers then know to render "Verification not yet available".
 */
export class SingpassConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SingpassConfigError";
  }
}

export type SingpassEnv = "sandbox" | "prod";

export interface SingpassConfig {
  env: SingpassEnv;
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
  clientId: string;
  redirectUri: string;
  signingJwk: Record<string, unknown>;
  signingKid: string;
  encryptionJwk: Record<string, unknown>;
  encryptionKid: string;
  scopes: string[];
}

const ENDPOINTS: Record<SingpassEnv, { issuer: string }> = {
  sandbox: { issuer: "https://stg-id.singpass.gov.sg" },
  prod: { issuer: "https://id.singpass.gov.sg" },
};

const SCOPES = ["openid", "uinfin", "name", "dob", "nationality", "residentialstatus"];

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new SingpassConfigError(
      `Missing required env var ${name}. See .env.example for the Singpass block.`
    );
  }
  return v;
}

function parseJwk(name: string): Record<string, unknown> {
  const raw = required(name);
  try {
    return JSON.parse(raw);
  } catch {
    throw new SingpassConfigError(`${name} is not valid JSON.`);
  }
}

export function getSingpassConfig(): SingpassConfig | null {
  const envRaw = process.env.SINGPASS_ENV;
  if (!envRaw || envRaw === "disabled") return null;
  if (envRaw !== "sandbox" && envRaw !== "prod") {
    throw new SingpassConfigError(
      `Invalid SINGPASS_ENV="${envRaw}". Expected one of: disabled, sandbox, prod.`
    );
  }
  const env = envRaw as SingpassEnv;
  const issuer = ENDPOINTS[env].issuer;

  return {
    env,
    issuer,
    authorizationEndpoint: `${issuer}/auth`,
    tokenEndpoint: `${issuer}/token`,
    userinfoEndpoint: `${issuer}/userinfo`,
    jwksUri: `${issuer}/.well-known/keys`,
    clientId: required("SINGPASS_CLIENT_ID"),
    redirectUri: required("SINGPASS_REDIRECT_URI"),
    signingJwk: parseJwk("SINGPASS_SIGNING_PRIVATE_JWK"),
    signingKid: required("SINGPASS_SIGNING_KID"),
    encryptionJwk: parseJwk("SINGPASS_ENCRYPTION_PRIVATE_JWK"),
    encryptionKid: required("SINGPASS_ENCRYPTION_KID"),
    scopes: SCOPES,
  };
}
```

> **Open question (to verify during Phase 2):** the `authorizationEndpoint`, `tokenEndpoint`, `userinfoEndpoint`, `jwksUri` paths here are the conventional Singpass paths but MUST be confirmed against the live OIDC discovery document at `{issuer}/.well-known/openid-configuration` before Phase 2 merges. If discovery returns different paths, switch to discovery-driven config in Task 17.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/singpass/__tests__/config.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/singpass/config.ts lib/singpass/__tests__/config.test.ts
git commit -m "feat(kyc): add env-switched Singpass config module"
```

---

### Task 8: Write the consent + fields module

**Files:**
- Create: `lib/singpass/consent.ts`
- Test: `lib/singpass/__tests__/consent.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/singpass/__tests__/consent.test.ts
import { describe, expect, it } from "vitest";
import { SINGPASS_REQUESTED_FIELDS } from "../consent";

describe("SINGPASS_REQUESTED_FIELDS", () => {
  it("includes exactly the 5 minimum-data-set fields", () => {
    const keys = SINGPASS_REQUESTED_FIELDS.map((f) => f.key).sort();
    expect(keys).toEqual(["dob", "name", "nationality", "residentialstatus", "uinfin"]);
  });

  it("each field has a human-readable label and reason", () => {
    for (const f of SINGPASS_REQUESTED_FIELDS) {
      expect(f.label.length).toBeGreaterThan(0);
      expect(f.reason.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/singpass/__tests__/consent.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// lib/singpass/consent.ts

/**
 * The Myinfo fields we request. Each entry's `reason` is shown verbatim
 * on the /kyc/singpass/start consent page AND copied into the linkup
 * application justification doc, so these are the single source of
 * truth for both surfaces.
 */
export interface RequestedField {
  key: "uinfin" | "name" | "dob" | "nationality" | "residentialstatus";
  label: string;
  reason: string;
}

export const SINGPASS_REQUESTED_FIELDS: readonly RequestedField[] = [
  {
    key: "uinfin",
    label: "NRIC / FIN",
    reason:
      "We store a one-way hash of your NRIC to prevent the same person " +
      "running multiple creator accounts. Your raw NRIC is never saved.",
  },
  {
    key: "name",
    label: "Legal name",
    reason:
      "Displayed on tax receipts and used to verify payouts match the " +
      "person we've verified.",
  },
  {
    key: "dob",
    label: "Date of birth",
    reason:
      "We require creators to be at least 18 — the minimum age for " +
      "entering commercial contracts in Singapore.",
  },
  {
    key: "nationality",
    label: "Nationality",
    reason:
      "Stored for tax-reporting and cross-border-payout compliance checks.",
  },
  {
    key: "residentialstatus",
    label: "Residential status",
    reason:
      "Get That Bread is currently open to Singapore Citizens and " +
      "Permanent Residents only. FIN-holders and foreigners can reach " +
      "out via hello@getthatbread.sg.",
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/singpass/__tests__/consent.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/singpass/consent.ts lib/singpass/__tests__/consent.test.ts
git commit -m "feat(kyc): define requested Myinfo fields + human-readable reasons"
```

---

### Task 9: Write the state-cookie module

**Files:**
- Create: `lib/singpass/state-cookie.ts`
- Test: `lib/singpass/__tests__/state-cookie.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/singpass/__tests__/state-cookie.test.ts
import { describe, expect, it } from "vitest";
import {
  COOKIE_NAME,
  encodeStateCookie,
  decodeStateCookie,
  generateStateTriple,
} from "../state-cookie";

const SECRET = "a".repeat(64); // 32-byte hex-ish; the module uses sha256(SECRET) internally

describe("state cookie", () => {
  it("round-trips state/nonce/pkceVerifier", async () => {
    const triple = generateStateTriple();
    const encoded = await encodeStateCookie(triple, SECRET);
    const decoded = await decodeStateCookie(encoded, SECRET);
    expect(decoded).toEqual(triple);
  });

  it("rejects a tampered cookie", async () => {
    const triple = generateStateTriple();
    const encoded = await encodeStateCookie(triple, SECRET);
    const tampered = encoded.slice(0, -4) + "zzzz";
    await expect(decodeStateCookie(tampered, SECRET)).rejects.toThrow();
  });

  it("rejects when secret differs", async () => {
    const triple = generateStateTriple();
    const encoded = await encodeStateCookie(triple, SECRET);
    await expect(decodeStateCookie(encoded, "b".repeat(64))).rejects.toThrow();
  });

  it("generateStateTriple produces distinct random values", () => {
    const a = generateStateTriple();
    const b = generateStateTriple();
    expect(a.state).not.toBe(b.state);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.pkceVerifier).not.toBe(b.pkceVerifier);
    expect(a.state.length).toBeGreaterThanOrEqual(32);
  });

  it("COOKIE_NAME is stable + prefixed", () => {
    expect(COOKIE_NAME).toBe("__Host-singpass-state");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/singpass/__tests__/state-cookie.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// lib/singpass/state-cookie.ts
import { createHash, randomBytes } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";

export const COOKIE_NAME = "__Host-singpass-state";
export const COOKIE_MAX_AGE_SECONDS = 600; // 10 min

export interface StateTriple {
  state: string;
  nonce: string;
  pkceVerifier: string;
}

export function generateStateTriple(): StateTriple {
  return {
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    pkceVerifier: randomBytes(32).toString("base64url"),
  };
}

/** Derive a 32-byte key from an app secret via sha256. */
function keyFromSecret(secret: string): Uint8Array {
  return createHash("sha256").update(secret).digest();
}

export async function encodeStateCookie(triple: StateTriple, secret: string): Promise<string> {
  const key = keyFromSecret(secret);
  return await new EncryptJWT(triple as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SECONDS}s`)
    .encrypt(key);
}

export async function decodeStateCookie(jwe: string, secret: string): Promise<StateTriple> {
  const key = keyFromSecret(secret);
  const { payload } = await jwtDecrypt(jwe, key);
  const { state, nonce, pkceVerifier } = payload as unknown as StateTriple;
  if (!state || !nonce || !pkceVerifier) {
    throw new Error("Invalid state cookie payload.");
  }
  return { state, nonce, pkceVerifier };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/singpass/__tests__/state-cookie.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/singpass/state-cookie.ts lib/singpass/__tests__/state-cookie.test.ts
git commit -m "feat(kyc): add encrypted state/nonce/PKCE cookie helper"
```

---

### Task 10: Write the client wrapper with stubbable interface

**Files:**
- Create: `lib/singpass/client.ts`
- Test: `lib/singpass/__tests__/client.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/singpass/__tests__/client.test.ts
import { describe, expect, it, vi } from "vitest";
import { buildAuthorizationUrl, setSingpassClientForTests, getSingpassClient } from "../client";
import type { SingpassConfig } from "../config";

const baseConfig: SingpassConfig = {
  env: "sandbox",
  issuer: "https://stg-id.singpass.gov.sg",
  authorizationEndpoint: "https://stg-id.singpass.gov.sg/auth",
  tokenEndpoint: "https://stg-id.singpass.gov.sg/token",
  userinfoEndpoint: "https://stg-id.singpass.gov.sg/userinfo",
  jwksUri: "https://stg-id.singpass.gov.sg/.well-known/keys",
  clientId: "my-client",
  redirectUri: "https://getthatbread.sg/cb",
  signingJwk: {},
  signingKid: "k1",
  encryptionJwk: {},
  encryptionKid: "k2",
  scopes: ["openid", "uinfin", "name", "dob", "nationality", "residentialstatus"],
};

describe("buildAuthorizationUrl", () => {
  it("builds a URL with all required OAuth params", async () => {
    const url = await buildAuthorizationUrl(baseConfig, {
      state: "S",
      nonce: "N",
      pkceVerifier: "V".repeat(64),
    });
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://stg-id.singpass.gov.sg/auth");
    expect(u.searchParams.get("client_id")).toBe("my-client");
    expect(u.searchParams.get("redirect_uri")).toBe("https://getthatbread.sg/cb");
    expect(u.searchParams.get("response_type")).toBe("code");
    expect(u.searchParams.get("scope")).toBe(
      "openid uinfin name dob nationality residentialstatus"
    );
    expect(u.searchParams.get("state")).toBe("S");
    expect(u.searchParams.get("nonce")).toBe("N");
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("code_challenge")).toBeTruthy();
  });
});

describe("getSingpassClient", () => {
  it("returns the stub set via setSingpassClientForTests", () => {
    const stub = {
      exchangeCode: vi.fn(),
      fetchUserInfo: vi.fn(),
    };
    setSingpassClientForTests(stub as never);
    expect(getSingpassClient()).toBe(stub);
    setSingpassClientForTests(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/singpass/__tests__/client.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// lib/singpass/client.ts
import { createHash } from "node:crypto";
import type { SingpassConfig } from "./config";
import type { StateTriple } from "./state-cookie";

/**
 * Myinfo response shape we depend on. Only the fields we request.
 * All strings are as they come off the wire (already decrypted + verified).
 */
export interface MyinfoPayload {
  uinfin: string;
  name: string;
  dob: string; // "YYYY-MM-DD"
  nationality: string;
  residentialstatus: string; // "Citizen" | "Permanent Resident" | "Foreigner" | ""
}

export interface SingpassClient {
  exchangeCode(args: {
    code: string;
    pkceVerifier: string;
    config: SingpassConfig;
  }): Promise<{ idToken: string; accessToken: string }>;

  fetchUserInfo(args: {
    accessToken: string;
    config: SingpassConfig;
  }): Promise<MyinfoPayload>;
}

let _testClient: SingpassClient | null = null;

/**
 * Test-only hook. Production code must NEVER call this.
 * Pass `null` to clear.
 */
export function setSingpassClientForTests(client: SingpassClient | null): void {
  _testClient = client;
}

export function getSingpassClient(): SingpassClient {
  if (_testClient) return _testClient;
  // Phase 1: no real client is wired; callers should use the stub.
  // Phase 2 (Task 17) replaces this branch with a real implementation.
  throw new Error(
    "Real Singpass client not yet implemented. In tests, call setSingpassClientForTests()."
  );
}

/** RFC 7636: BASE64URL(SHA256(verifier)). */
function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function buildAuthorizationUrl(
  config: SingpassConfig,
  triple: StateTriple
): Promise<string> {
  const url = new URL(config.authorizationEndpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", triple.state);
  url.searchParams.set("nonce", triple.nonce);
  url.searchParams.set("code_challenge", pkceChallenge(triple.pkceVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}
```

> **Note:** Phase 2 (Task 17) replaces the `getSingpassClient()` stub body with the real GovTech-helper-backed implementation. `buildAuthorizationUrl` also changes in Phase 2 if we move to PAR (Pushed Authorization Requests).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/singpass/__tests__/client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/singpass/client.ts lib/singpass/__tests__/client.test.ts
git commit -m "feat(kyc): add Singpass client shim with test-injection point"
```

---

### Task 11: Write the persist module

**Files:**
- Create: `lib/singpass/persist.ts`
- Test: `lib/singpass/__tests__/persist.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/singpass/__tests__/persist.test.ts
import { describe, expect, it } from "vitest";
import { ForeignerError, UnderageError } from "../errors";
import { validateMyinfoPayload } from "../persist";
import type { MyinfoPayload } from "../client";

function basePayload(overrides: Partial<MyinfoPayload> = {}): MyinfoPayload {
  return {
    uinfin: "S1234567D",
    name: "JANE TAN",
    dob: "1990-01-15",
    nationality: "Singaporean",
    residentialstatus: "Citizen",
    ...overrides,
  };
}

describe("validateMyinfoPayload", () => {
  it("accepts a Singapore Citizen aged 18+", () => {
    expect(() => validateMyinfoPayload(basePayload(), new Date("2026-04-21"))).not.toThrow();
  });

  it("accepts a Singapore PR aged 18+", () => {
    expect(() =>
      validateMyinfoPayload(basePayload({ residentialstatus: "Permanent Resident" }), new Date("2026-04-21"))
    ).not.toThrow();
  });

  it("throws UnderageError when DOB is less than 18 years ago", () => {
    expect(() =>
      validateMyinfoPayload(basePayload({ dob: "2010-01-01" }), new Date("2026-04-21"))
    ).toThrow(UnderageError);
  });

  it("throws UnderageError exactly on the day before 18th birthday", () => {
    // 18th birthday = 2026-04-22; check on 2026-04-21 → still underage.
    expect(() =>
      validateMyinfoPayload(basePayload({ dob: "2008-04-22" }), new Date("2026-04-21"))
    ).toThrow(UnderageError);
  });

  it("accepts exactly on 18th birthday", () => {
    expect(() =>
      validateMyinfoPayload(basePayload({ dob: "2008-04-21" }), new Date("2026-04-21"))
    ).not.toThrow();
  });

  it("throws ForeignerError for Foreigner status", () => {
    expect(() =>
      validateMyinfoPayload(basePayload({ residentialstatus: "Foreigner" }), new Date("2026-04-21"))
    ).toThrow(ForeignerError);
  });

  it("throws ForeignerError for blank residential status (FIN-holder)", () => {
    expect(() =>
      validateMyinfoPayload(basePayload({ residentialstatus: "" }), new Date("2026-04-21"))
    ).toThrow(ForeignerError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/singpass/__tests__/persist.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// lib/singpass/persist.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MyinfoPayload } from "./client";
import { DuplicateUinfinError, ForeignerError, UnderageError } from "./errors";
import { sha256Uinfin } from "./hash";

const ALLOWED_RESIDENCIES = new Set(["Citizen", "Permanent Resident"]);

/**
 * Pure validation: asserts age + residency. Throws one of the typed
 * errors on failure. Called by persistVerification BEFORE the DB write.
 */
export function validateMyinfoPayload(payload: MyinfoPayload, now: Date = new Date()): void {
  // Age check (18+).
  const dob = new Date(payload.dob + "T00:00:00Z");
  const eighteenth = new Date(dob);
  eighteenth.setUTCFullYear(dob.getUTCFullYear() + 18);
  if (eighteenth.getTime() > now.getTime()) {
    throw new UnderageError();
  }

  // Residency check (Citizen or PR only; blank = FIN-holder = foreigner).
  if (!ALLOWED_RESIDENCIES.has(payload.residentialstatus)) {
    throw new ForeignerError();
  }
}

/**
 * Writes a verified Myinfo response to the DB in a single transaction
 * (via an RPC) and flips the two denormalized cache columns.
 *
 * - creator_verifications insert → source of truth
 * - project_manager_profiles.singpass_verified = true
 * - profiles.kyc_status = 'approved'
 *
 * A unique-violation on creator_verifications.uinfin_hash → DuplicateUinfinError.
 */
export async function persistVerification(args: {
  supabase: SupabaseClient;
  profileId: string;
  payload: MyinfoPayload;
  now?: Date;
}): Promise<void> {
  const { supabase, profileId, payload } = args;
  validateMyinfoPayload(payload, args.now);

  const uinfinHash = sha256Uinfin(payload.uinfin);

  // Supabase's client doesn't support BEGIN/COMMIT directly. We lean on
  // a Postgres function `persist_creator_verification` (created in
  // Task 12's migration, via an RPC) which wraps the three writes in
  // one transaction. A unique-violation on uinfin_hash becomes an
  // explicit exception we translate below.
  const { error } = await supabase.rpc("persist_creator_verification", {
    p_profile_id: profileId,
    p_uinfin_hash: uinfinHash,
    p_verified_name: payload.name,
    p_verified_dob: payload.dob,
    p_nationality: payload.nationality,
    p_residency: payload.residentialstatus,
  });

  if (error) {
    // Postgres unique-violation code is 23505.
    if (error.code === "23505" || /duplicate key/i.test(error.message)) {
      throw new DuplicateUinfinError();
    }
    throw error;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/singpass/__tests__/persist.test.ts`
Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/singpass/persist.ts lib/singpass/__tests__/persist.test.ts
git commit -m "feat(kyc): add Myinfo payload validation + persist RPC call"
```

---

### Task 12: Add the `persist_creator_verification` RPC migration

**Files:**
- Create: `supabase/migrations/019_persist_creator_verification_rpc.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Transactional writer for a successful Singpass verification.
--
-- Wraps three writes in a single transaction:
--   1. INSERT INTO creator_verifications (uniqueness check lives here)
--   2. UPDATE project_manager_profiles.singpass_verified = true
--   3. UPDATE profiles.kyc_status = 'approved'
--
-- Called via `supabase.rpc('persist_creator_verification', {...})`
-- from the Singpass callback route.
--
-- Security: runs with SECURITY DEFINER (elevated) so service-role clients
-- can invoke it. The route is server-only and already auth-checks the
-- caller before calling this, so there's no direct client-side exposure.

create or replace function persist_creator_verification(
  p_profile_id    uuid,
  p_uinfin_hash   text,
  p_verified_name text,
  p_verified_dob  date,
  p_nationality   text,
  p_residency     text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into creator_verifications (
    profile_id, method, uinfin_hash,
    verified_name, verified_dob, nationality, residency
  ) values (
    p_profile_id, 'singpass', p_uinfin_hash,
    p_verified_name, p_verified_dob, p_nationality, p_residency
  );

  update project_manager_profiles
     set singpass_verified = true
   where id = p_profile_id;

  update profiles
     set kyc_status = 'approved',
         kyc_reviewed_at = now()
   where id = p_profile_id;
end;
$$;

-- Only the service role can invoke this.
revoke all on function persist_creator_verification(uuid, text, text, date, text, text) from public;
grant execute on function persist_creator_verification(uuid, text, text, date, text, text) to service_role;
```

- [ ] **Step 2: Apply locally + verify**

Run: `npx supabase db push` (or MCP `apply_migration`).

Verify:
```sql
select proname, prosecdef from pg_proc where proname = 'persist_creator_verification';
-- Expect one row with prosecdef = true.
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/019_persist_creator_verification_rpc.sql
git commit -m "feat(kyc): add persist_creator_verification transactional RPC"
```

---

### Task 13: Write the JWKS endpoint

**Files:**
- Create: `app/.well-known/jwks.json/route.ts`
- Test: `app/.well-known/jwks.json/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/.well-known/jwks.json/__tests__/route.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "../route";

describe("GET /.well-known/jwks.json", () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    for (const k of Object.keys(process.env)) {
      if (k.startsWith("SINGPASS_")) delete process.env[k];
    }
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 503 when Singpass is disabled", async () => {
    process.env.SINGPASS_ENV = "disabled";
    const res = await GET();
    expect(res.status).toBe(503);
  });

  it("returns a public-only JWKS with two keys (sig + enc) when enabled", async () => {
    // Minimal realistic JWKs (P-256 EC keys).
    process.env.SINGPASS_ENV = "sandbox";
    process.env.SINGPASS_CLIENT_ID = "c";
    process.env.SINGPASS_REDIRECT_URI = "http://localhost/cb";
    process.env.SINGPASS_SIGNING_KID = "sig-1";
    process.env.SINGPASS_ENCRYPTION_KID = "enc-1";
    process.env.SINGPASS_SIGNING_PRIVATE_JWK = JSON.stringify({
      kty: "EC",
      crv: "P-256",
      kid: "sig-1",
      use: "sig",
      alg: "ES256",
      x: "x-val",
      y: "y-val",
      d: "d-SECRET",
    });
    process.env.SINGPASS_ENCRYPTION_PRIVATE_JWK = JSON.stringify({
      kty: "EC",
      crv: "P-256",
      kid: "enc-1",
      use: "enc",
      alg: "ECDH-ES+A256GCM",
      x: "x-val",
      y: "y-val",
      d: "d-SECRET",
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keys).toHaveLength(2);
    for (const k of body.keys) {
      expect(k.d).toBeUndefined(); // private component stripped
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/.well-known/jwks.json/__tests__/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// app/.well-known/jwks.json/route.ts
import { NextResponse } from "next/server";
import { getSingpassConfig } from "@/lib/singpass/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint. Singpass fetches this to verify our client_assertion
 * JWTs and DPoP proofs. We expose only the PUBLIC JWK components
 * (strip `d`, `p`, `q`, `dp`, `dq`, `qi` etc.) and cache for 1 hour.
 */
export async function GET() {
  const cfg = getSingpassConfig();
  if (!cfg) {
    return new NextResponse("Singpass KYC not enabled in this environment.", { status: 503 });
  }

  const pub = (jwk: Record<string, unknown>) => {
    const out = { ...jwk };
    for (const secret of ["d", "p", "q", "dp", "dq", "qi", "oth"]) {
      delete out[secret];
    }
    return out;
  };

  return NextResponse.json(
    { keys: [pub(cfg.signingJwk), pub(cfg.encryptionJwk)] },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" } }
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/.well-known/jwks.json/__tests__/route.test.ts`
Expected: all 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/.well-known/jwks.json/route.ts app/.well-known/jwks.json/__tests__/route.test.ts
git commit -m "feat(kyc): publish public JWKS at /.well-known/jwks.json"
```

---

### Task 14: Wire the Sentry UINFIN scrubber

**Files:**
- Modify: `sentry.server.config.ts`
- Modify: `sentry.edge.config.ts` (if present)
- Modify: `sentry.client.config.ts` (if present, as defense in depth)

- [ ] **Step 1: Verify which Sentry config files exist**

Run: `ls sentry.*.config.ts 2>/dev/null`

- [ ] **Step 2: Add the scrubber to every existing Sentry config**

For each existing `sentry.*.config.ts`, add `beforeSend` if absent, or extend the existing one:

```ts
import * as Sentry from "@sentry/nextjs";
import { redactUinfin } from "@/lib/singpass/hash";

Sentry.init({
  // ...existing options...

  beforeSend(event) {
    // Belt-and-suspenders: scrub UINFIN from message, exception values,
    // breadcrumbs, and extra/tags. Raw UINFIN should never be captured
    // to Sentry in the first place, but this guards against accidental
    // `console.log(rawUinfin)` calls leaking in via the integration.
    if (event.message) event.message = redactUinfin(event.message);
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value) ex.value = redactUinfin(ex.value);
      }
    }
    if (event.breadcrumbs) {
      for (const bc of event.breadcrumbs) {
        if (bc.message) bc.message = redactUinfin(bc.message);
      }
    }
    return event;
  },
});
```

If a `beforeSend` already exists, compose the scrubber with it rather than replacing.

- [ ] **Step 3: Add a minimal integration test**

**Create:** `lib/singpass/__tests__/sentry-scrubber.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { redactUinfin } from "../hash";

describe("Sentry scrubber behaviour", () => {
  it("covers all UINFIN prefixes in a realistic error message", () => {
    const msg =
      "Failed to hash S1234567D for user; secondary UINFIN T9876543A seen in payload";
    expect(redactUinfin(msg)).toBe(
      "Failed to hash [REDACTED] for user; secondary UINFIN [REDACTED] seen in payload"
    );
  });
});
```

- [ ] **Step 4: Run the whole test suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: all tests (including pre-existing ones) pass.

- [ ] **Step 5: Commit**

```bash
git add sentry.*.config.ts lib/singpass/__tests__/sentry-scrubber.test.ts
git commit -m "feat(kyc): scrub UINFIN from Sentry events via beforeSend"
```

---

### Task 15: Write the start-auth API route

**Files:**
- Create: `app/api/auth/singpass/start/route.ts`
- Test: `app/api/auth/singpass/start/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/api/auth/singpass/start/__tests__/route.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the current-user lookup before importing the route.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "profile-1" } },
        error: null,
      })),
    },
  })),
}));

// Mock existing verification lookup to "not verified".
vi.mock("@/lib/singpass/verification-state", () => ({
  isAlreadyVerified: vi.fn(async () => false),
}));

describe("POST /api/auth/singpass/start", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const k of Object.keys(process.env)) {
      if (k.startsWith("SINGPASS_")) delete process.env[k];
    }
    process.env.APP_SECRET = "x".repeat(64);
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 503 when SINGPASS_ENV is disabled", async () => {
    const { POST } = await import("../route");
    process.env.SINGPASS_ENV = "disabled";
    const res = await POST(new Request("http://localhost/api/auth/singpass/start", { method: "POST" }));
    expect(res.status).toBe(503);
  });

  it("302s to the Singpass auth endpoint and sets the state cookie", async () => {
    const { POST } = await import("../route");
    process.env.SINGPASS_ENV = "sandbox";
    process.env.SINGPASS_CLIENT_ID = "c";
    process.env.SINGPASS_REDIRECT_URI = "http://localhost/cb";
    process.env.SINGPASS_SIGNING_KID = "sig-1";
    process.env.SINGPASS_ENCRYPTION_KID = "enc-1";
    process.env.SINGPASS_SIGNING_PRIVATE_JWK = JSON.stringify({ kty: "EC", crv: "P-256", kid: "sig-1" });
    process.env.SINGPASS_ENCRYPTION_PRIVATE_JWK = JSON.stringify({ kty: "EC", crv: "P-256", kid: "enc-1" });

    const res = await POST(new Request("http://localhost/api/auth/singpass/start", { method: "POST" }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("https://stg-id.singpass.gov.sg/auth");
    expect(res.headers.get("set-cookie") ?? "").toContain("__Host-singpass-state=");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/auth/singpass/start/__tests__/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the shared "already verified?" helper it depends on**

Create `lib/singpass/verification-state.ts`:

```ts
// lib/singpass/verification-state.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAlreadyVerified(
  supabase: SupabaseClient,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("creator_verifications")
    .select("profile_id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return !!data;
}
```

- [ ] **Step 4: Write the route**

```ts
// app/api/auth/singpass/start/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthorizationUrl } from "@/lib/singpass/client";
import { getSingpassConfig } from "@/lib/singpass/config";
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  encodeStateCookie,
  generateStateTriple,
} from "@/lib/singpass/state-cookie";
import { isAlreadyVerified } from "@/lib/singpass/verification-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function appSecret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) {
    throw new Error("APP_SECRET must be set to at least 32 characters for cookie encryption.");
  }
  return s;
}

export async function POST(_req: Request) {
  const cfg = getSingpassConfig();
  if (!cfg) {
    return new NextResponse("Verification isn't available yet. Check back soon.", { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in → bounce to sign-in and preserve intent.
    return NextResponse.redirect(new URL("/login?next=/kyc/singpass/start", _req.url), 302);
  }

  if (await isAlreadyVerified(supabase, user.id)) {
    return NextResponse.redirect(new URL("/dashboard?already_verified=1", _req.url), 302);
  }

  const triple = generateStateTriple();
  const cookie = await encodeStateCookie(triple, appSecret());
  const authUrl = await buildAuthorizationUrl(cfg, triple);

  const res = NextResponse.redirect(authUrl, 302);
  res.cookies.set(COOKIE_NAME, cookie, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run app/api/auth/singpass/start/__tests__/route.test.ts`
Expected: all 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/auth/singpass/start/route.ts app/api/auth/singpass/start/__tests__/route.test.ts lib/singpass/verification-state.ts
git commit -m "feat(kyc): add POST /api/auth/singpass/start route"
```

---

### Task 16: Write the callback API route + error pages + consent UI + UI surface changes

This task is large on purpose — all six UI pieces change together and depend on the same stubs. Split into sub-commits but keep the work in a single task context.

**Files:**
- Create: `app/api/auth/singpass/callback/route.ts`
- Test: `app/api/auth/singpass/callback/__tests__/route.test.ts`
- Create: `app/kyc/singpass/start/page.tsx`
- Create: `app/kyc/singpass/start/StartButton.tsx`
- Create: `app/kyc/singpass/error/page.tsx`
- Create: `app/kyc/singpass/underage/page.tsx`
- Create: `app/kyc/singpass/foreigner/page.tsx`
- Create: `app/kyc/singpass/duplicate/page.tsx`
- Create: `components/creation/ProjectSubmitGate.tsx`
- Create: `components/admin/RecentlyVerifiedList.tsx`
- Modify: `components/dashboard/SingpassVerificationCard.tsx`
- Modify: `components/creation/Step4_Review.tsx`
- Modify: `app/admin/kyc/page.tsx`

#### Sub-commit 1 — Callback route (with tests)

- [ ] **Step 1: Write the failing callback test**

```ts
// app/api/auth/singpass/callback/__tests__/route.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyinfoPayload } from "@/lib/singpass/client";

// Mock supabase user + persist.
const mockRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "profile-1" } }, error: null })) },
    rpc: mockRpc,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
    }),
  })),
}));

// We'll inject a stub Singpass client for each test.
import { setSingpassClientForTests } from "@/lib/singpass/client";
import { encodeStateCookie } from "@/lib/singpass/state-cookie";

const okPayload: MyinfoPayload = {
  uinfin: "S1234567D",
  name: "JANE TAN",
  dob: "1990-01-01",
  nationality: "Singaporean",
  residentialstatus: "Citizen",
};

async function makeCookieHeader() {
  const cookie = await encodeStateCookie(
    { state: "S", nonce: "N", pkceVerifier: "V".repeat(43) },
    "x".repeat(64)
  );
  return `__Host-singpass-state=${cookie}`;
}

beforeEach(() => {
  for (const k of Object.keys(process.env)) if (k.startsWith("SINGPASS_")) delete process.env[k];
  process.env.APP_SECRET = "x".repeat(64);
  process.env.SINGPASS_ENV = "sandbox";
  process.env.SINGPASS_CLIENT_ID = "c";
  process.env.SINGPASS_REDIRECT_URI = "http://localhost/cb";
  process.env.SINGPASS_SIGNING_KID = "sig-1";
  process.env.SINGPASS_ENCRYPTION_KID = "enc-1";
  process.env.SINGPASS_SIGNING_PRIVATE_JWK = JSON.stringify({ kty: "EC", crv: "P-256", kid: "sig-1" });
  process.env.SINGPASS_ENCRYPTION_PRIVATE_JWK = JSON.stringify({ kty: "EC", crv: "P-256", kid: "enc-1" });

  mockRpc.mockReset();
  mockRpc.mockResolvedValue({ error: null });
});
afterEach(() => setSingpassClientForTests(null));

describe("GET /api/auth/singpass/callback", () => {
  it("redirects to /dashboard?verified=1 on the happy path", async () => {
    setSingpassClientForTests({
      exchangeCode: vi.fn(async () => ({ idToken: "idt", accessToken: "at" })),
      fetchUserInfo: vi.fn(async () => okPayload),
    });
    const { GET } = await import("../route");
    const url = "http://localhost/api/auth/singpass/callback?state=S&code=abc";
    const res = await GET(new Request(url, { headers: { cookie: await makeCookieHeader() } }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/dashboard?verified=1");
    expect(mockRpc).toHaveBeenCalledWith(
      "persist_creator_verification",
      expect.objectContaining({ p_verified_name: "JANE TAN" })
    );
  });

  it("redirects to /kyc/singpass/underage when DOB < 18y ago", async () => {
    setSingpassClientForTests({
      exchangeCode: vi.fn(async () => ({ idToken: "idt", accessToken: "at" })),
      fetchUserInfo: vi.fn(async () => ({ ...okPayload, dob: "2015-01-01" })),
    });
    const { GET } = await import("../route");
    const url = "http://localhost/api/auth/singpass/callback?state=S&code=abc";
    const res = await GET(new Request(url, { headers: { cookie: await makeCookieHeader() } }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/kyc/singpass/underage");
  });

  it("redirects to /kyc/singpass/foreigner when residency is 'Foreigner'", async () => {
    setSingpassClientForTests({
      exchangeCode: vi.fn(async () => ({ idToken: "idt", accessToken: "at" })),
      fetchUserInfo: vi.fn(async () => ({ ...okPayload, residentialstatus: "Foreigner" })),
    });
    const { GET } = await import("../route");
    const url = "http://localhost/api/auth/singpass/callback?state=S&code=abc";
    const res = await GET(new Request(url, { headers: { cookie: await makeCookieHeader() } }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/kyc/singpass/foreigner");
  });

  it("redirects to /kyc/singpass/duplicate on DuplicateUinfinError", async () => {
    setSingpassClientForTests({
      exchangeCode: vi.fn(async () => ({ idToken: "idt", accessToken: "at" })),
      fetchUserInfo: vi.fn(async () => okPayload),
    });
    mockRpc.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });
    const { GET } = await import("../route");
    const url = "http://localhost/api/auth/singpass/callback?state=S&code=abc";
    const res = await GET(new Request(url, { headers: { cookie: await makeCookieHeader() } }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/kyc/singpass/duplicate");
  });

  it("returns 400 when state param doesn't match the cookie", async () => {
    setSingpassClientForTests({
      exchangeCode: vi.fn(async () => ({ idToken: "idt", accessToken: "at" })),
      fetchUserInfo: vi.fn(async () => okPayload),
    });
    const { GET } = await import("../route");
    const url = "http://localhost/api/auth/singpass/callback?state=WRONG&code=abc";
    const res = await GET(new Request(url, { headers: { cookie: await makeCookieHeader() } }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/kyc/singpass/error?reason=state");
  });

  it("redirects when user cancels on Singpass (error=access_denied)", async () => {
    const { GET } = await import("../route");
    const url = "http://localhost/api/auth/singpass/callback?error=access_denied";
    const res = await GET(new Request(url, { headers: { cookie: await makeCookieHeader() } }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/kyc/singpass/start?cancelled=1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/auth/singpass/callback/__tests__/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the callback route**

```ts
// app/api/auth/singpass/callback/route.ts
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getSingpassClient } from "@/lib/singpass/client";
import { getSingpassConfig } from "@/lib/singpass/config";
import {
  DuplicateUinfinError,
  ForeignerError,
  UnderageError,
  isSingpassError,
} from "@/lib/singpass/errors";
import { persistVerification } from "@/lib/singpass/persist";
import {
  COOKIE_NAME,
  decodeStateCookie,
} from "@/lib/singpass/state-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function appSecret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) throw new Error("APP_SECRET must be set (>= 32 chars).");
  return s;
}

function redirect(url: string, req: Request): NextResponse {
  const res = NextResponse.redirect(new URL(url, req.url), 302);
  // Always clear the state cookie when we leave this route — it's one-shot.
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, secure: true, path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: Request) {
  const cfg = getSingpassConfig();
  if (!cfg) return new NextResponse("Singpass not enabled.", { status: 503 });

  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  if (error === "access_denied") {
    return redirect("/kyc/singpass/start?cancelled=1", req);
  }
  if (error) {
    Sentry.captureMessage(`Singpass returned OAuth error: ${error}`, "warning");
    return redirect("/kyc/singpass/error?reason=provider", req);
  }
  if (!code || !stateParam) {
    return redirect("/kyc/singpass/error?reason=missing", req);
  }

  // Decode the state cookie.
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return redirect("/kyc/singpass/error?reason=state", req);

  let triple;
  try {
    triple = await decodeStateCookie(match[1], appSecret());
  } catch {
    return redirect("/kyc/singpass/error?reason=state", req);
  }
  if (triple.state !== stateParam) {
    Sentry.captureMessage("Singpass CSRF state mismatch", "warning");
    return redirect("/kyc/singpass/error?reason=state", req);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login?next=/kyc/singpass/start", req);

  try {
    const client = getSingpassClient();
    const { accessToken } = await client.exchangeCode({
      code,
      pkceVerifier: triple.pkceVerifier,
      config: cfg,
    });
    const payload = await client.fetchUserInfo({ accessToken, config: cfg });

    await persistVerification({ supabase, profileId: user.id, payload });
    return redirect("/dashboard?verified=1", req);
  } catch (err: unknown) {
    if (err instanceof UnderageError) return redirect("/kyc/singpass/underage", req);
    if (err instanceof ForeignerError) return redirect("/kyc/singpass/foreigner", req);
    if (err instanceof DuplicateUinfinError) {
      Sentry.captureMessage("Duplicate UINFIN attempted", "warning");
      return redirect("/kyc/singpass/duplicate", req);
    }
    if (isSingpassError(err)) {
      Sentry.captureException(err);
      return redirect(`/kyc/singpass/error?reason=${err.code.toLowerCase()}`, req);
    }
    Sentry.captureException(err);
    return redirect("/kyc/singpass/error?reason=unknown", req);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/auth/singpass/callback/__tests__/route.test.ts`
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit sub-commit 1**

```bash
git add app/api/auth/singpass/callback/route.ts app/api/auth/singpass/callback/__tests__/route.test.ts
git commit -m "feat(kyc): add GET /api/auth/singpass/callback route"
```

#### Sub-commit 2 — Consent page + error pages

- [ ] **Step 6: Write the consent page**

Create `app/kyc/singpass/start/page.tsx`:

```tsx
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SINGPASS_REQUESTED_FIELDS } from "@/lib/singpass/consent";
import { isAlreadyVerified } from "@/lib/singpass/verification-state";
import { StartButton } from "./StartButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/kyc/singpass/start");
  if (await isAlreadyVerified(supabase, user.id)) redirect("/dashboard?already_verified=1");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-[var(--color-brand-crust)]" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">
          Verify your identity with Singpass
        </h1>
      </div>

      {sp.cancelled && (
        <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Verification cancelled. Ready when you are.
        </div>
      )}

      <p className="text-[var(--color-ink-muted)] leading-relaxed">
        Get That Bread requires every creator to verify through Singpass before
        running a campaign. It takes under a minute and gives your backers extra
        confidence that a real Singaporean is behind your project.
      </p>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-3">
        <h2 className="font-bold text-[var(--color-ink)]">What we&apos;ll receive</h2>
        <ul className="flex flex-col gap-3">
          {SINGPASS_REQUESTED_FIELDS.map((f) => (
            <li key={f.key} className="flex flex-col gap-0.5">
              <span className="font-semibold text-[var(--color-ink)]">{f.label}</span>
              <span className="text-sm text-[var(--color-ink-muted)]">{f.reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <StartButton />

      <p className="text-sm text-[var(--color-ink-subtle)]">
        Based outside Singapore? Campaigns from foreign-based creators are handled
        separately —{" "}
        <Link
          href="mailto:hello@getthatbread.sg?subject=Foreign%20creator%20interest"
          className="underline"
        >
          email hello@getthatbread.sg
        </Link>{" "}
        and we&apos;ll be in touch.
      </p>
    </main>
  );
}
```

- [ ] **Step 7: Write the StartButton client component**

Create `app/kyc/singpass/start/StartButton.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";

export function StartButton() {
  return (
    <form action="/api/auth/singpass/start" method="post">
      <Button type="submit" size="lg">
        Continue to Singpass →
      </Button>
    </form>
  );
}
```

- [ ] **Step 8: Write the four error pages**

Create `app/kyc/singpass/underage/page.tsx`:

```tsx
export default function Page() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center flex flex-col gap-4">
      <h1 className="text-2xl font-bold">You must be 18 to run a campaign</h1>
      <p className="text-[var(--color-ink-muted)]">
        Come back when you hit 18 — we&apos;ll save your spot on Get That Bread.
      </p>
    </main>
  );
}
```

Create `app/kyc/singpass/foreigner/page.tsx`:

```tsx
import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Creators need to be Singapore Citizens or PRs</h1>
      <p className="text-[var(--color-ink-muted)]">
        Get That Bread is currently open to Singapore Citizens and Permanent
        Residents only. If you&apos;re based outside Singapore and interested in
        running a campaign,{" "}
        <Link
          href="mailto:hello@getthatbread.sg?subject=Foreign%20creator%20interest"
          className="underline"
        >
          email hello@getthatbread.sg
        </Link>{" "}
        and we&apos;ll reach out.
      </p>
    </main>
  );
}
```

Create `app/kyc/singpass/duplicate/page.tsx`:

```tsx
import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center flex flex-col gap-4">
      <h1 className="text-2xl font-bold">This NRIC is already linked to another account</h1>
      <p className="text-[var(--color-ink-muted)]">
        If that wasn&apos;t you,{" "}
        <Link
          href="mailto:hello@getthatbread.sg?subject=Duplicate%20NRIC%20on%20Get%20That%20Bread"
          className="underline"
        >
          email hello@getthatbread.sg
        </Link>{" "}
        and our team will look into it.
      </p>
    </main>
  );
}
```

Create `app/kyc/singpass/error/page.tsx`:

```tsx
import Link from "next/link";

const REASONS: Record<string, string> = {
  state: "Your session expired. Please start over.",
  provider: "Singpass reported an error. Please try again in a few minutes.",
  missing: "Something went wrong with the verification request. Please start over.",
  unavailable: "Singpass is temporarily unavailable. Please try again in a few minutes.",
  crypto:
    "We couldn't verify the signed response from Singpass. Please try again, or email hello@getthatbread.sg.",
  unknown:
    "Something went wrong verifying your identity. Please try again, or email hello@getthatbread.sg.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const sp = await searchParams;
  const reason = sp.reason ?? "unknown";
  const message = REASONS[reason] ?? REASONS.unknown;

  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Verification didn&apos;t go through</h1>
      <p className="text-[var(--color-ink-muted)]">{message}</p>
      <Link
        href="/kyc/singpass/start"
        className="self-center inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </Link>
    </main>
  );
}
```

- [ ] **Step 9: Smoke test the pages build**

Run: `npx next build` (or `npm run build` if the repo aliases that)
Expected: build succeeds. If the JWKS endpoint route-collects fail because of `runtime = "nodejs"`, confirm that directive is present.

- [ ] **Step 10: Commit sub-commit 2**

```bash
git add app/kyc/singpass
git commit -m "feat(kyc): add consent page + four error pages + start button"
```

#### Sub-commit 3 — SingpassVerificationCard goes live

- [ ] **Step 11: Rewrite `components/dashboard/SingpassVerificationCard.tsx`**

Replace the whole file (keep `SingpassVerifiedBadge` as-is at the bottom):

```tsx
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function SingpassVerificationCard({ alreadyVerified }: { alreadyVerified: boolean }) {
  if (alreadyVerified) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-brand-success)]/30 bg-[var(--color-brand-success)]/5 p-5 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-[var(--color-brand-success)]" />
        <div className="flex-1">
          <p className="font-bold text-[var(--color-ink)]">Identity verified via Singpass</p>
          <p className="text-sm text-[var(--color-ink-muted)]">
            You&apos;re all set to run a campaign.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-lg">🇸🇬</span>
        <span className="font-bold text-[var(--color-ink)]">
          Verify your identity with Singpass
        </span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Required before you can submit a campaign
        </span>
      </div>
      <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
        Takes under a minute. We use Singpass to verify you&apos;re a Singapore
        Citizen or PR aged 18+ — no raw NRIC is saved.
      </p>
      <Link
        href="/kyc/singpass/start"
        className="self-start inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] px-4 py-2 text-sm font-semibold text-white"
      >
        <span>🇸🇬</span>
        Verify with Singpass
      </Link>
    </div>
  );
}

export function SingpassVerifiedBadge() {
  return (
    <span
      title="This creator's identity has been verified through Singpass"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-success)]/10 border border-[var(--color-brand-success)]/30 text-xs font-bold text-[var(--color-brand-success)]"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      Singpass verified
    </span>
  );
}
```

- [ ] **Step 12: Update the card's caller(s)**

Find callers: Run grep for `<SingpassVerificationCard`. For each call site, pass `alreadyVerified` — read `project_manager_profiles.singpass_verified` server-side where the card is rendered. If the caller is `app/dashboard/page.tsx`, the existing query already reads `singpass_verified`; just pass it through.

Example patch for `app/dashboard/page.tsx` (around the spot that renders the card):

```tsx
<SingpassVerificationCard alreadyVerified={!!managerProfile?.singpass_verified} />
```

- [ ] **Step 13: Commit sub-commit 3**

```bash
git add components/dashboard/SingpassVerificationCard.tsx app/dashboard/page.tsx
git commit -m "feat(kyc): flip SingpassVerificationCard from 'Coming soon' to live"
```

#### Sub-commit 4 — ProjectSubmitGate + Step4 gate + server-side re-check

- [ ] **Step 14: Move `handleLaunch` DB insert into a server action that re-checks verification**

Create `app/dashboard/submit-project/action.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugifyUnique } from "@/lib/utils/slugify";
import { sanitizeRichHtml } from "@/lib/utils/sanitize";
import type { ProjectDraft } from "@/types/project";
import type { RewardFormData } from "@/types/reward";

export async function submitProjectForReview(args: {
  draft: ProjectDraft;
  rewards: RewardFormData[];
}): Promise<{ ok: true; slug: string } | { ok: false; reason: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not-authenticated" };

  // Authority check: re-read from Postgres, not from client state.
  const { data: manager } = await supabase
    .from("project_manager_profiles")
    .select("singpass_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (!manager?.singpass_verified) {
    return { ok: false, reason: "not-verified" };
  }

  const slug = slugifyUnique(args.draft.title);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      creator_id: user.id,
      category_id: args.draft.category_id,
      title: args.draft.title,
      slug,
      short_description: args.draft.short_description,
      full_description: sanitizeRichHtml(args.draft.full_description ?? ""),
      cover_image_url: args.draft.cover_image_url,
      video_url: args.draft.video_url,
      funding_goal_sgd: args.draft.funding_goal_sgd,
      payout_mode: args.draft.payout_mode,
      start_date: args.draft.start_date,
      deadline: args.draft.deadline,
      status: "pending_review",
      launched_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (projectError || !project) {
    return { ok: false, reason: projectError?.message ?? "insert-failed" };
  }

  if (args.rewards.length > 0) {
    const rewardRows = args.rewards.map((r, i) => ({
      project_id: project.id,
      title: r.title,
      description: r.description,
      minimum_pledge_sgd: r.minimum_pledge_sgd,
      estimated_delivery_date: r.estimated_delivery_date || null,
      max_backers: r.max_backers,
      includes_physical_item: r.includes_physical_item,
      display_order: i,
    }));
    await supabase.from("rewards").insert(rewardRows);
  }

  revalidatePath("/dashboard/projects");
  return { ok: true, slug };
}
```

- [ ] **Step 15: Create `components/creation/ProjectSubmitGate.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitProjectForReview } from "@/app/dashboard/submit-project/action";
import type { ProjectDraft } from "@/types/project";
import type { RewardFormData } from "@/types/reward";

export function ProjectSubmitGate({
  verified,
  allReady,
  draft,
  rewards,
  onSuccess,
}: {
  verified: boolean;
  allReady: boolean;
  draft: ProjectDraft;
  rewards: RewardFormData[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!verified) {
    return (
      <div className="w-full rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-amber-900">
          <strong>Verify your identity with Singpass</strong> before submitting your campaign.
        </p>
        <Link
          href="/kyc/singpass/start"
          className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand-crust)] px-4 py-2 text-sm font-semibold text-white"
        >
          Verify now →
        </Link>
      </div>
    );
  }

  async function onClick() {
    setLoading(true);
    setError(null);
    const res = await submitProjectForReview({ draft, rewards });
    setLoading(false);
    if (!res.ok) {
      if (res.reason === "not-verified") {
        router.push("/kyc/singpass/start");
        return;
      }
      setError(res.reason);
      return;
    }
    onSuccess?.();
    router.push(`/dashboard/projects?submitted=1&slug=${res.slug}`);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button
        size="lg"
        loading={loading}
        disabled={!allReady || loading}
        onClick={onClick}
        title={!allReady ? "Complete all required fields to submit" : ""}
      >
        <Rocket className="w-4 h-4" />
        Submit for review
      </Button>
    </div>
  );
}
```

- [ ] **Step 16: Replace Step4_Review's submit button**

In `components/creation/Step4_Review.tsx`:

1. Remove the `handleLaunch` function body (lines 97–159) — the action now lives in `submitProjectForReview`.
2. Add a `verified` prop to the component:

```tsx
interface Step4Props {
  draft: ProjectDraft;
  rewards: RewardFormData[];
  categories: Category[];
  verified: boolean;            // NEW
  onBack: () => void;
  onSuccess?: () => void;
}
```

3. Replace the existing submit `<Button>` block (lines 287–297) with:

```tsx
<ProjectSubmitGate
  verified={verified}
  allReady={allReady}
  draft={draft}
  rewards={rewards}
  onSuccess={onSuccess}
/>
```

4. Update the parent chain so `verified` flows from the server page down to `Step4_Review`:
   - **`app/projects/create/page.tsx`** (server component) — add:

     ```tsx
     const { data: managerVerified } = await supabase
       .from("project_manager_profiles")
       .select("singpass_verified")
       .eq("id", user.id)
       .maybeSingle();
     // ...then pass down:
     <ProjectCreationForm
       categories={(categories as Category[]) ?? []}
       verified={!!managerVerified?.singpass_verified}
     />
     ```

   - **`components/creation/ProjectCreationForm.tsx`** — add `verified: boolean` to `ProjectCreationFormProps`, accept it in the destructure, and forward to `<Step4_Review verified={verified} … />`.

- [ ] **Step 17: Smoke test**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 18: Commit sub-commit 4**

```bash
git add app/dashboard/submit-project/action.ts components/creation/ProjectSubmitGate.tsx components/creation/Step4_Review.tsx components/creation/ProjectCreationForm.tsx app/projects/create/page.tsx
git commit -m "feat(kyc): gate Submit-for-review on Singpass verification (server + client)"
```

#### Sub-commit 5 — Admin: RecentlyVerifiedList

- [ ] **Step 19: Create `components/admin/RecentlyVerifiedList.tsx`**

```tsx
import { formatDate } from "@/lib/utils/dates";

export interface RecentVerification {
  profile_id: string;
  display_name: string;
  verified_name: string;
  verified_dob: string | null;
  nationality: string | null;
  residency: string | null;
  uinfin_hash: string;
  verified_at: string;
}

export function RecentlyVerifiedList({ rows }: { rows: RecentVerification[] }) {
  if (rows.length === 0) {
    return (
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-muted)]">
        <h2 className="font-bold text-[var(--color-ink)] mb-1">
          Recently Singpass-verified creators
        </h2>
        No verifications yet.
      </section>
    );
  }
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-3">
      <h2 className="font-bold text-[var(--color-ink)]">
        Recently Singpass-verified creators ({rows.length})
      </h2>
      <p className="text-xs text-[var(--color-ink-subtle)]">
        Read-only. Government-originated data cannot be edited here.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-ink-muted)]">
              <th className="py-1 pr-4">Account</th>
              <th className="py-1 pr-4">Legal name</th>
              <th className="py-1 pr-4">DOB</th>
              <th className="py-1 pr-4">Nationality</th>
              <th className="py-1 pr-4">Residency</th>
              <th className="py-1 pr-4">UINFIN (last 6)</th>
              <th className="py-1 pr-4">Verified</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.profile_id} className="border-t border-[var(--color-border)]">
                <td className="py-2 pr-4 font-semibold">{r.display_name}</td>
                <td className="py-2 pr-4">{r.verified_name}</td>
                <td className="py-2 pr-4">{r.verified_dob ?? "—"}</td>
                <td className="py-2 pr-4">{r.nationality ?? "—"}</td>
                <td className="py-2 pr-4">{r.residency ?? "—"}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  …{r.uinfin_hash.slice(-6)}
                </td>
                <td className="py-2 pr-4">{formatDate(r.verified_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 20: Extend `app/admin/kyc/page.tsx` to fetch + render it**

Read the existing file first, then add — above the existing `<KycApprovalList …/>` render — a server-side fetch:

```tsx
// inside the default-exported async page component, before the return:
const { data: recent } = await supabase
  .from("creator_verifications")
  .select(
    "profile_id, verified_name, verified_dob, nationality, residency, uinfin_hash, verified_at, " +
    "profile:profiles!creator_verifications_profile_id_fkey(display_name)"
  )
  .order("verified_at", { ascending: false })
  .limit(30);

const recentRows = (recent ?? []).map((r) => ({
  profile_id: r.profile_id,
  display_name: r.profile?.display_name ?? "—",
  verified_name: r.verified_name,
  verified_dob: r.verified_dob,
  nationality: r.nationality,
  residency: r.residency,
  uinfin_hash: r.uinfin_hash,
  verified_at: r.verified_at,
}));
```

Then in the JSX:

```tsx
<div className="flex flex-col gap-8">
  <RecentlyVerifiedList rows={recentRows} />
  <KycApprovalList profiles={pendingProfiles} />
</div>
```

Add the import at the top:

```tsx
import { RecentlyVerifiedList } from "@/components/admin/RecentlyVerifiedList";
```

- [ ] **Step 21: Smoke test**

Run: `npm run build`
Expected: build succeeds with no TS errors. (If the Supabase FK name differs from `creator_verifications_profile_id_fkey`, check `supabase/migrations/017_creator_verifications.sql` — the FK to `profiles(id)` may be unnamed, in which case either name it in a new migration or re-express the select without the nested relation and do a second query for display names.)

- [ ] **Step 22: Commit sub-commit 5**

```bash
git add components/admin/RecentlyVerifiedList.tsx app/admin/kyc/page.tsx
git commit -m "feat(kyc): show recently Singpass-verified creators on /admin/kyc"
```

**End of Phase 1. Everything above can merge to `main` without Singpass credentials; the flow simply 503s until `SINGPASS_ENV=sandbox` and the env vars land.**

---

## Phase 2 — Real Sandbox Wiring (Tasks 17–21)

**Prerequisites (user-side homework):**
1. Create Singpass developer account at https://developer.singpass.gov.sg (via Corppass).
2. Register a sandbox client; note the issued `client_id`.
3. Run `npx tsx scripts/generate-singpass-jwks.ts`; paste the public JWKS URL (`https://<vercel-preview-url>/.well-known/jwks.json`) into the developer portal.
4. Set the six `SINGPASS_*` env vars in Vercel **Preview** + **Development** to sandbox values; leave Production on `SINGPASS_ENV=disabled`.
5. Send me the sandbox `client_id` so I can wire up real traffic tests.

---

### Task 17: Check PAR support + wire the real helper

**Files:**
- Modify: `lib/singpass/client.ts`

- [ ] **Step 1: Read the helper library's README + examples**

```bash
npm ls @govtechsg/singpass-myinfo-oidc-helper
ls node_modules/@govtechsg/singpass-myinfo-oidc-helper
```

Read its README. Answer two questions:
1. Does it expose a PAR (Pushed Authorization Request) endpoint helper?
2. Does it accept our JWK format (`jose`-generated EC P-256 keys) directly?

If PAR is **not** supported and we can't wait for a helper update, fall back to `openid-client`. In that case, replace the implementation below with an `openid-client`-based version and record the decision in the PR body.

- [ ] **Step 2: Replace `getSingpassClient()` with the real implementation**

Add a new section below the existing exports:

```ts
// Inside lib/singpass/client.ts, replace the placeholder `getSingpassClient`:
import {
  OidcHelper,
  MyInfoHelper,
} from "@govtechsg/singpass-myinfo-oidc-helper";

let _realClient: SingpassClient | null = null;

function buildRealClient(): SingpassClient {
  return {
    async exchangeCode({ code, pkceVerifier, config }) {
      const oidc = new OidcHelper({
        oidcConfigUrl: `${config.issuer}/.well-known/openid-configuration`,
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        clientAssertionSignKey: config.signingJwk,
        additionalHeaders: {},
      });
      const tokens = await oidc.getTokens({
        authCode: code,
        pkceCodeVerifier: pkceVerifier,
      });
      return { idToken: tokens.id_token, accessToken: tokens.access_token };
    },
    async fetchUserInfo({ accessToken, config }) {
      const myinfo = new MyInfoHelper({
        oidcConfigUrl: `${config.issuer}/.well-known/openid-configuration`,
        clientId: config.clientId,
        clientAssertionSignKey: config.signingJwk,
        jweDecryptKey: config.encryptionJwk,
      });
      const person = await myinfo.getPerson({
        accessToken,
        scope: config.scopes.join(" "),
      });
      return {
        uinfin: person.uinfin?.value ?? "",
        name: person.name?.value ?? "",
        dob: person.dob?.value ?? "",
        nationality: person.nationality?.desc ?? person.nationality?.code ?? "",
        residentialstatus:
          person.residentialstatus?.desc ?? person.residentialstatus?.code ?? "",
      };
    },
  };
}

export function getSingpassClient(): SingpassClient {
  if (_testClient) return _testClient;
  if (!_realClient) _realClient = buildRealClient();
  return _realClient;
}
```

> **⚠️ Real-world shape correction, to verify during this task:** the exact field names returned by `MyInfoHelper.getPerson()` depend on the helper library version. Pull the TypeScript types from `node_modules/@govtechsg/singpass-myinfo-oidc-helper/dist/**/*.d.ts` and adjust the payload-extraction code to match. The spec's residential-status handling (prefer `desc`, fall back to `code`, empty string for FIN-holders) is the contract the validator relies on — keep that exact behavior regardless of library shape.

- [ ] **Step 3: Run existing tests to ensure the stubbable interface still works**

Run: `npx vitest run lib/singpass`
Expected: all tests pass (stub injection still short-circuits the real client).

- [ ] **Step 4: Commit**

```bash
git add lib/singpass/client.ts
git commit -m "feat(kyc): wire real @govtechsg/singpass-myinfo-oidc-helper behind the shim"
```

---

### Task 18: Manual end-to-end smoke against sandbox

**Files:** (manual only — no code changes)

- [ ] **Step 1: Deploy a preview**

Push the branch; wait for Vercel preview URL.

- [ ] **Step 2: Confirm JWKS endpoint**

`curl https://<preview>.vercel.app/.well-known/jwks.json`
Expected: 200, two public keys, no `d` field.

- [ ] **Step 3: Run the full flow**

Log in with your test account → dashboard → click "Verify with Singpass" → complete Singpass sandbox login (use a test NRIC from the portal) → confirm redirect to `/dashboard?verified=1`.

- [ ] **Step 4: Check the DB**

```sql
select * from creator_verifications where profile_id = '<your test profile id>';
select singpass_verified from project_manager_profiles where id = '<your test profile id>';
select kyc_status from profiles where id = '<your test profile id>';
```

Expected: one row in `creator_verifications`, `singpass_verified = true`, `kyc_status = 'approved'`.

- [ ] **Step 5: Try to verify a second account with the same sandbox NRIC**

Expected: redirected to `/kyc/singpass/duplicate`.

- [ ] **Step 6: Try cancelling on the Singpass consent screen**

Expected: redirected to `/kyc/singpass/start?cancelled=1` with the cancelled banner visible.

- [ ] **Step 7: Document results in PR #30 comment**

(No commit — just note test outcomes on the PR thread.)

---

### Task 19: Seed an E2E test that hits the stubbed client end-to-end

**Files:**
- Create: `app/api/auth/singpass/__tests__/e2e.test.ts`

- [ ] **Step 1: Write the test**

```ts
// app/api/auth/singpass/__tests__/e2e.test.ts
// End-to-end: start → mocked Singpass response → callback → DB writes.
// Uses the injected stub client; does not hit the network.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSingpassClientForTests } from "@/lib/singpass/client";
import { encodeStateCookie, generateStateTriple } from "@/lib/singpass/state-cookie";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "profile-E2E" } }, error: null })) },
    rpc: mockRpc,
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }),
  })),
}));

beforeEach(() => {
  for (const k of Object.keys(process.env)) if (k.startsWith("SINGPASS_")) delete process.env[k];
  process.env.APP_SECRET = "x".repeat(64);
  process.env.SINGPASS_ENV = "sandbox";
  process.env.SINGPASS_CLIENT_ID = "c";
  process.env.SINGPASS_REDIRECT_URI = "http://localhost/cb";
  process.env.SINGPASS_SIGNING_KID = "sig-1";
  process.env.SINGPASS_ENCRYPTION_KID = "enc-1";
  process.env.SINGPASS_SIGNING_PRIVATE_JWK = JSON.stringify({ kty: "EC", crv: "P-256", kid: "sig-1" });
  process.env.SINGPASS_ENCRYPTION_PRIVATE_JWK = JSON.stringify({ kty: "EC", crv: "P-256", kid: "enc-1" });
  mockRpc.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => setSingpassClientForTests(null));

describe("Singpass happy-path E2E", () => {
  it("writes creator_verifications + flips flags on successful callback", async () => {
    setSingpassClientForTests({
      exchangeCode: async () => ({ idToken: "idt", accessToken: "at" }),
      fetchUserInfo: async () => ({
        uinfin: "S9999999Z",
        name: "E2E TESTER",
        dob: "1995-05-05",
        nationality: "Singaporean",
        residentialstatus: "Citizen",
      }),
    });

    const triple = generateStateTriple();
    const cookie = await encodeStateCookie(triple, "x".repeat(64));

    const { GET } = await import("../callback/route");
    const url = `http://localhost/api/auth/singpass/callback?state=${encodeURIComponent(
      triple.state
    )}&code=sandbox-code`;
    const res = await GET(new Request(url, { headers: { cookie: `__Host-singpass-state=${cookie}` } }));

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/dashboard?verified=1");
    expect(mockRpc).toHaveBeenCalledWith(
      "persist_creator_verification",
      expect.objectContaining({
        p_profile_id: "profile-E2E",
        p_verified_name: "E2E TESTER",
        p_residency: "Citizen",
      })
    );
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run app/api/auth/singpass/__tests__/e2e.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/singpass/__tests__/e2e.test.ts
git commit -m "test(kyc): add end-to-end start→callback happy-path test"
```

---

### Task 20: Draft supporting artefacts for the linkup application

**Files:**
- Create: `docs/superpowers/artifacts/singpass-linkup/README.md`
- Create: `docs/superpowers/artifacts/singpass-linkup/field-justifications.md`
- Create: `docs/superpowers/artifacts/singpass-linkup/pdpa-statement.md`
- Create: `docs/superpowers/artifacts/singpass-linkup/security-practices.md`
- Create: `docs/superpowers/artifacts/singpass-linkup/redirect-uris.md`

- [ ] **Step 1: Write `README.md`** — one-page checklist mapping each deliverable to the GovTech portal field it fills. List the user-journey `.pptx` as a separate manual deliverable the user owns.

- [ ] **Step 2: Write `field-justifications.md`** — one paragraph per requested Myinfo field, copied from `SINGPASS_REQUESTED_FIELDS` in `lib/singpass/consent.ts`.

- [ ] **Step 3: Write `pdpa-statement.md`** — 1 page covering (a) what we collect, (b) how long we retain it ("for the lifetime of your creator account + 5 years for tax/audit"), (c) withdrawal (Section 22 of PDPA: delete on request within 30 days), (d) DPO contact `hello@getthatbread.sg`, (e) incident notification commitment.

- [ ] **Step 4: Write `security-practices.md`** — bullet list: TLS 1.2+, JWK rotation cadence (11 months), private keys stored in Vercel encrypted env vars (never in git/logs/Sentry), Sentry UINFIN scrubber, transactional DB writes, hashed UINFIN only.

- [ ] **Step 5: Write `redirect-uris.md`** — explicit list of redirect URIs to register with GovTech:
  - Sandbox: `https://<any>.vercel.app/api/auth/singpass/callback` (Vercel wildcard) + `http://localhost:3000/api/auth/singpass/callback`
  - Production: `https://getthatbread.sg/api/auth/singpass/callback`

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/artifacts/singpass-linkup
git commit -m "docs(kyc): draft supporting artefacts for GovTech linkup application"
```

---

### Task 21: Flip sandbox on in Vercel Preview

**Files:** (manual config only)

- [ ] **Step 1: Confirm sandbox env vars are set in Vercel Preview + Development**

- [ ] **Step 2: Merge the Phase 2 PR to main**

At this point `main` has all of Phase 1 + 2. Production still reads `SINGPASS_ENV=disabled`, so end users see the pre-launch 503 — preview deployments hit sandbox Singpass for end-to-end QA.

**End of Phase 2.**

---

## Phase 3 — Production Cutover (Tasks 22–23)

**Prerequisites:** GovTech has emailed approval for the linkup application and a production `client_id` is issued.

### Task 22: Production env var swap

**Files:** (Vercel dashboard only)

- [ ] **Step 1: Generate prod keypair**

Run `npx tsx scripts/generate-singpass-jwks.ts` locally. Save the output securely (1Password or similar).

- [ ] **Step 2: Register production client with GovTech**

In the developer portal → Production tab → create client → paste `https://getthatbread.sg/.well-known/jwks.json` as the JWKS URL → get prod `client_id`.

- [ ] **Step 3: Set Vercel Production env vars**

```
SINGPASS_ENV=prod
SINGPASS_CLIENT_ID=<prod_client_id>
SINGPASS_SIGNING_PRIVATE_JWK=<prod stringified JWK>
SINGPASS_SIGNING_KID=<prod kid>
SINGPASS_ENCRYPTION_PRIVATE_JWK=<prod stringified JWK>
SINGPASS_ENCRYPTION_KID=<prod kid>
SINGPASS_REDIRECT_URI=https://getthatbread.sg/api/auth/singpass/callback
```

- [ ] **Step 4: Trigger a production redeploy**

`vercel --prod` (or the dashboard button).

- [ ] **Step 5: Confirm prod JWKS endpoint**

`curl https://getthatbread.sg/.well-known/jwks.json` → 200 with two keys.

---

### Task 23: Prod smoke test + launch announcement

**Files:** (manual + memory update)

- [ ] **Step 1: Run the same flow from Task 18 against production**

Use your own Singpass credentials. Expected: end-to-end success → `creator_verifications` row exists in prod DB.

- [ ] **Step 2: Delete the test verification row**

```sql
delete from creator_verifications where profile_id = '<your profile id>';
update project_manager_profiles set singpass_verified = false where id = '<your profile id>';
update profiles set kyc_status = 'none' where id = '<your profile id>';
```

(or keep it — your call. The row is real.)

- [ ] **Step 3: Update `~/.claude/projects/-Users-darylwui-plsfundme/memory/launch_todos.md`**

Mark the Singpass section as ✅ Done. Remove the "waiting on GovTech" block.

- [ ] **Step 4: Announce launch readiness**

(You, the user — post in Telegram / email creator waitlist / whatever the launch plan says.)

**End of Phase 3. Creator launch unblocked.**

---

## Testing Strategy Summary

- **Unit tests** (Vitest): `errors`, `hash`, `config`, `consent`, `state-cookie`, `client` (stubbable path), `persist` (validation only).
- **Route tests** (Vitest with mocked Supabase): `start` route + `callback` route + JWKS route.
- **E2E test** (Vitest, stubbed Singpass client): `start → callback → DB writes` happy path.
- **Manual smoke** (Phase 2 Task 18 + Phase 3 Task 23): real sandbox + real production flows with test NRICs.

Run the full suite: `npm test` (runs `vitest run`). Target: every new file has at least one test.

---

## Rollback Plan

Each phase is reversible.

- **Phase 1 rollback:** set `SINGPASS_ENV=disabled` in Vercel — the consent page + routes all return 503, the dashboard card hides the "Verify" CTA (the card code defaults to the `not alreadyVerified` branch, which just shows a disabled link — add a second env check if you want it fully hidden). No data is ever written.
- **Phase 2 rollback:** flip `SINGPASS_ENV` back to `disabled` on Preview. The helper library import stays in the codebase harmlessly.
- **Phase 3 rollback:** flip `SINGPASS_ENV` back to `sandbox` (or `disabled`) in Production. Users already in `creator_verifications` stay verified — the data is durable.

If we ever need to clear a specific verification (user dispute, wrong person verified): `delete from creator_verifications where profile_id = $1` + reset the two cache columns. The unique index lets them re-verify.

---

## Open Questions (to resolve during execution)

1. **PAR support in the helper library** — Task 17. If unsupported, fall back to `openid-client` (cost: ~1 extra day).
2. **Exact Myinfo response field names** from `MyInfoHelper.getPerson()` — Task 17. Check `.d.ts` files on install.
3. **FK name in `creator_verifications`** — Task 16 Sub-commit 5 Step 21. If unnamed, the nested Supabase `select` fails and we do two queries instead.

---

## Appendix: User-side homework (outside the plan)

These happen in parallel with Phase 1 code work. None of them block Phase 1 merge.

1. **Rotate the exposed Sentry auth token.** (Pre-existing launch-todo carryover.)
2. **Log into Corppass with your UEN.**
3. **Create a Singpass developer account** at https://developer.singpass.gov.sg.
4. **Confirm yourself as the authorized signatory** for the UEN in the developer portal.
5. **Register a sandbox client** and upload the JWKS URL from a deployed preview.
6. **Send me the sandbox `client_id`** (unlocks Phase 2).
7. **Prepare the GovTech linkup application package:**
   - User-journey deck in GovTech's required `.pptx` template (user owns this — I can draft copy but not fill the template).
   - Screenshot of your chosen Myinfo pricing tier.
   - Fill in the portal fields using the drafts from Task 20.
   - Submit.
8. **Wait for GovTech approval** (2–4 weeks typical, can be longer).
9. **Trigger Phase 3** when approval email lands.
