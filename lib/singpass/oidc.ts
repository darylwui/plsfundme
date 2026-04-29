import {
  SignJWT,
  importJWK,
  createRemoteJWKSet,
  jwtVerify,
  compactDecrypt,
} from "jose";
import { singpassConfig } from "./config";
import { buildDpopProof, fetchWithDpop } from "./dpop";

// Cache the remote JWKS set so we don't re-fetch on every request
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getSingPassJwks() {
  if (!cachedJwks) {
    cachedJwks = createRemoteJWKSet(new URL(singpassConfig.jwksUri));
  }
  return cachedJwks;
}

// SINGPASS_PRIVATE_KEY_BASE64 is base64(JSON.stringify({ sig: JWK, enc: JWK }))
function parsePrivateKeys(): { sig: object; enc: object } {
  const json = Buffer.from(singpassConfig.privateKeyBase64, "base64").toString("utf8");
  return JSON.parse(json);
}

async function loadSigKey() {
  const { sig } = parsePrivateKeys();
  return importJWK(sig as Parameters<typeof importJWK>[0], "ES256");
}

async function loadEncKey() {
  const { enc } = parsePrivateKeys();
  // Singpass JWE uses `alg: ECDH-ES+A256KW, enc: A256GCM` for ID tokens
  // and Person responses. The hint here matches the JWE `alg`.
  return importJWK(enc as Parameters<typeof importJWK>[0], "ECDH-ES+A256KW");
}

/**
 * Decrypt a Singpass-issued JWE (ID token or Person response) and return
 * the inner signed JWT.
 */
async function decryptJwe(jwe: string): Promise<string> {
  // A signed JWT has 3 segments; a JWE has 5. Some flows return the JWT
  // already decrypted, so we tolerate both.
  if (jwe.split(".").length !== 5) return jwe;
  const encKey = await loadEncKey();
  const { plaintext } = await compactDecrypt(jwe, encKey);
  return new TextDecoder().decode(plaintext);
}

/**
 * Singpass v5 returns `sub` as `s=<UINFIN>,u=<uuid>`. Older / non-Myinfo
 * flows return the bare UINFIN. Pull the UINFIN out so we can hash it
 * consistently and use it as a path param for the Person API.
 */
export function parseUinfinFromSub(sub: string): string {
  const match = sub.match(/(?:^|,)s=([^,]+)/);
  return match ? match[1] : sub;
}

// FAPI 2.0: POST all params to /fapi/par, get back a request_uri
export async function pushAuthorizationRequest(params: {
  state: string;
  nonce: string;
  codeChallenge: string;
}): Promise<string> {
  // Per SingPass FAPI 2.0 docs: all OIDC params go directly in the PAR body.
  // No `request` JWT parameter — SingPass does NOT use a signed request object.
  // `authentication_context_type` is REQUIRED (matches the auth context types
  // configured in the SingPass developer portal).
  const buildBody = async () => {
    const clientAssertion = await buildClientAssertion(
      singpassConfig.clientAssertionAudience
    );
    return new URLSearchParams({
      client_id: singpassConfig.clientId,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
      response_type: "code",
      scope: singpassConfig.scopeString,
      redirect_uri: singpassConfig.redirectUri,
      state: params.state,
      nonce: params.nonce,
      code_challenge: params.codeChallenge,
      code_challenge_method: "S256",
      authentication_context_type: "APP_AUTHENTICATION_DEFAULT",
    }).toString();
  };

  const response = await fetchWithDpop(singpassConfig.parEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: await buildBody(),
    buildProof: (nonce) =>
      buildDpopProof("POST", singpassConfig.parEndpoint, { nonce }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PAR request failed: ${response.status} ${text}`);
  }

  const json = (await response.json()) as { request_uri: string };
  return json.request_uri;
}

export async function buildClientAssertion(audience?: string): Promise<string> {
  const privateKey = await loadSigKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: "gtb-sig-1" })
    .setIssuer(singpassConfig.clientId)
    .setSubject(singpassConfig.clientId)
    .setAudience(audience ?? singpassConfig.clientAssertionAudience)
    .setIssuedAt(now)
    .setExpirationTime(now + 300) // 5 min validity
    .setJti(crypto.randomUUID())
    .sign(privateKey);
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ id_token: string; access_token: string; scope?: string }> {
  // SingPass expects client_assertion `aud` to be the FAPI base URL for both
  // PAR and token endpoints (verified against staging).
  const buildBody = async () => {
    const clientAssertion = await buildClientAssertion(
      singpassConfig.clientAssertionAudience
    );
    return new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: singpassConfig.redirectUri,
      client_id: singpassConfig.clientId,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
      code_verifier: codeVerifier,
    }).toString();
  };

  const response = await fetchWithDpop(singpassConfig.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: await buildBody(),
    buildProof: (nonce) =>
      buildDpopProof("POST", singpassConfig.tokenEndpoint, { nonce }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function verifyIdToken(
  idToken: string,
  expectedNonce: string
): Promise<{ sub: string; name?: string; iat?: number }> {
  const jwks = getSingPassJwks();
  const jwt = await decryptJwe(idToken);

  const { payload } = await jwtVerify(jwt, jwks, {
    issuer: singpassConfig.issuer,
    audience: singpassConfig.clientId,
  });

  if (payload.nonce !== expectedNonce) {
    throw new Error("Nonce mismatch — possible replay attack");
  }

  return {
    sub: payload.sub as string,
    name: payload.name as string | undefined,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
  };
}

/**
 * Myinfo Person API field shape. Most fields come back as
 * `{ value, classifier?, source?, lastupdated? }` or
 * `{ code, desc, classifier?, ... }` depending on the field.
 */
type PersonField =
  | { value?: string; code?: string; desc?: string; classifier?: string }
  | undefined
  | null;

export type MyinfoPerson = {
  uinfin?: PersonField;
  name?: PersonField;
  dob?: PersonField;
  nationality?: PersonField;
  residentialstatus?: PersonField;
  // Singpass also returns transaction metadata at the top level. The exact
  // key is portal-configurable — we keep both shapes the staging account
  // commonly uses.
  txnNo?: string;
  txnno?: string;
};

function fieldString(f: PersonField): string | null {
  if (!f) return null;
  return f.value ?? f.code ?? f.desc ?? null;
}

/**
 * Pull canonical creator-KYC fields out of a Myinfo Person response.
 */
export function extractPersonFields(person: MyinfoPerson) {
  return {
    name: fieldString(person.name),
    dob: fieldString(person.dob), // YYYY-MM-DD per Myinfo spec
    nationality: fieldString(person.nationality),
    residency: fieldString(person.residentialstatus),
    myinfoTxnId: person.txnNo ?? person.txnno ?? null,
  };
}

/**
 * Call the Myinfo Person API for the given UINFIN. Authenticated with the
 * access token (Authorization: DPoP <token>) and a DPoP proof bound to
 * (GET, person URL, ath=sha256(access_token)).
 *
 * The response is itself a JWE (signed JWT inside) so we decrypt + verify
 * before returning the claims object.
 */
export async function fetchPerson(
  uinfin: string,
  accessToken: string
): Promise<MyinfoPerson> {
  // Person URLs end with a trailing slash per Myinfo v4 convention.
  const personUrl = `${singpassConfig.personApiBase}/com/v4/person/${encodeURIComponent(
    uinfin
  )}/`;

  // Some Myinfo profiles allow narrowing the response via an `attributes`
  // query string. Singpass-OIDC clients usually omit this — the access
  // token's scope is the source of truth — but some staging tenants
  // require it. Override with SINGPASS_PERSON_ATTRIBUTES if your dev
  // portal is configured that way.
  const attrs = process.env.SINGPASS_PERSON_ATTRIBUTES;
  const fullUrl = attrs ? `${personUrl}?attributes=${attrs}` : personUrl;

  const response = await fetchWithDpop(fullUrl, {
    method: "GET",
    headers: {
      Authorization: `DPoP ${accessToken}`,
      Accept: "application/jwt, application/json",
    },
    // `htu` for DPoP must NOT include the query string (the helper strips
    // it, but we pass the canonical URL anyway).
    buildProof: (nonce) =>
      buildDpopProof("GET", personUrl, { nonce, accessToken }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Person fetch failed: ${response.status} ${text}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  // Two response shapes in the wild:
  //   - JWE-wrapped JWT (typical for Myinfo Personal v5)
  //   - Plain JSON (some tenants return JSON directly)
  if (contentType.includes("json") && body.trim().startsWith("{")) {
    return JSON.parse(body) as MyinfoPerson;
  }

  const jwt = await decryptJwe(body.trim());
  const jwks = getSingPassJwks();
  const { payload } = await jwtVerify(jwt, jwks, {
    issuer: singpassConfig.issuer,
  });

  return payload as unknown as MyinfoPerson;
}
