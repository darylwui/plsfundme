import {
  SignJWT,
  importJWK,
  createRemoteJWKSet,
  jwtVerify,
  compactDecrypt,
} from "jose";
import { singpassConfig } from "./config";

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

export async function buildClientAssertion(): Promise<string> {
  const privateKey = await loadSigKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: "gtb-sig-1" })
    .setIssuer(singpassConfig.clientId)
    .setSubject(singpassConfig.clientId)
    .setAudience(singpassConfig.tokenEndpoint)
    .setIssuedAt(now)
    .setExpirationTime(now + 300) // 5 min validity
    .setJti(crypto.randomUUID())
    .sign(privateKey);
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ id_token: string; access_token: string }> {
  const clientAssertion = await buildClientAssertion();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: singpassConfig.redirectUri,
    client_id: singpassConfig.clientId,
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
  });

  const response = await fetch(singpassConfig.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
