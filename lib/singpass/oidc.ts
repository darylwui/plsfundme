import {
  SignJWT,
  importJWK,
  createRemoteJWKSet,
  jwtVerify,
  compactDecrypt,
} from "jose";
import { singpassConfig } from "./config";
import { buildDpopProof } from "./dpop";

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
  return importJWK(enc as Parameters<typeof importJWK>[0], "ECDH-ES+A256KW");
}

// FAPI 2.0: POST all params to /fapi/par, get back a request_uri
export async function pushAuthorizationRequest(params: {
  state: string;
  nonce: string;
  codeChallenge: string;
}): Promise<string> {
  const clientAssertion = await buildClientAssertion(singpassConfig.clientAssertionAudience);

  // Per SingPass FAPI 2.0 docs: all OIDC params go directly in the PAR body.
  // No `request` JWT parameter — SingPass does NOT use a signed request object.
  // `authentication_context_type` is REQUIRED (matches the auth context types
  // configured in the SingPass developer portal).
  const body = new URLSearchParams({
    client_id: singpassConfig.clientId,
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
    response_type: "code",
    scope: "openid name",
    redirect_uri: singpassConfig.redirectUri,
    state: params.state,
    nonce: params.nonce,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
    authentication_context_type: "APP_AUTHENTICATION_DEFAULT",
  });

  // FAPI 2.0: PAR request requires a DPoP proof bound to (POST, parEndpoint)
  const dpopProof = await buildDpopProof("POST", singpassConfig.parEndpoint);

  const response = await fetch(singpassConfig.parEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      DPoP: dpopProof,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PAR request failed: ${response.status} ${text}`);
  }

  const json = await response.json() as { request_uri: string };
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
): Promise<{ id_token: string; access_token: string }> {
  // SingPass expects client_assertion `aud` to be the FAPI base URL for both
  // PAR and token endpoints (verified against staging).
  const clientAssertion = await buildClientAssertion(singpassConfig.clientAssertionAudience);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: singpassConfig.redirectUri,
    client_id: singpassConfig.clientId,
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
    code_verifier: codeVerifier,
  });

  // FAPI 2.0: token request also requires a DPoP proof
  const dpopProof = await buildDpopProof("POST", singpassConfig.tokenEndpoint);

  const response = await fetch(singpassConfig.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      DPoP: dpopProof,
    },
    body: body.toString(),
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
): Promise<{ sub: string; name?: string }> {
  const jwks = getSingPassJwks();

  // SingPass encrypts the ID token as a JWE — decrypt it first with our enc private key
  let jwt = idToken;
  if (idToken.split(".").length === 5) {
    const encKey = await loadEncKey();
    const { plaintext } = await compactDecrypt(idToken, encKey);
    jwt = new TextDecoder().decode(plaintext);
  }

  const { payload } = await jwtVerify(jwt, jwks, {
    issuer: singpassConfig.tokenEndpoint.replace("/token", ""),
    audience: singpassConfig.clientId,
  });

  if (payload.nonce !== expectedNonce) {
    throw new Error("Nonce mismatch — possible replay attack");
  }

  return {
    sub: payload.sub as string,
    name: payload.name as string | undefined,
  };
}
