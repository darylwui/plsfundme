#!/usr/bin/env node
/**
 * Standalone test harness for SingPass FAPI 2.0 PAR.
 *
 * Loads creds from .env.local, builds the PAR request the same way
 * the production route handler does, posts to SingPass staging, and
 * prints the full response so we can iterate on the exact spec mismatch.
 *
 * Usage: node scripts/test-singpass-par.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SignJWT, importJWK, exportJWK } from "jose";

// ── Load env from .env.local (no dotenv dep needed) ─────────────────────────
const envText = readFileSync(resolve(".env.local"), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (!m) continue;
  let val = m[2];
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  if (!process.env[m[1]]) process.env[m[1]] = val;
}

// ── Config — mirrors lib/singpass/config.ts ─────────────────────────────────
const env = process.env.SINGPASS_ENVIRONMENT ?? "staging";
const issuer =
  env === "production" ? "https://id.singpass.gov.sg" : "https://stg-id.singpass.gov.sg";
const config = {
  clientId: process.env.SINGPASS_CLIENT_ID,
  redirectUri: process.env.SINGPASS_REDIRECT_URI,
  privateKeyBase64: process.env.SINGPASS_PRIVATE_KEY_BASE64,
  issuer,
  parEndpoint: `${issuer}/fapi/par`,
  // FIX CANDIDATE: client_assertion aud should be <issuer>/fapi per the
  // official sample request, NOT the specific endpoint URL
  clientAssertionAudience: `${issuer}/fapi`,
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function base64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function generatePkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const challenge = base64url(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  );
  return { verifier, challenge };
}

function parsePrivateKeys() {
  const json = Buffer.from(config.privateKeyBase64, "base64").toString("utf8");
  return JSON.parse(json);
}

async function loadSigKey() {
  return importJWK(parsePrivateKeys().sig, "ES256");
}

async function buildClientAssertion(audience) {
  const privateKey = await loadSigKey();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: "gtb-sig-1" })
    .setIssuer(config.clientId)
    .setSubject(config.clientId)
    .setAudience(audience)
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .setJti(crypto.randomUUID())
    .sign(privateKey);
}

async function buildDpopProof(htm, htu) {
  const privateKey = await loadSigKey();
  // Parse public-key fields directly from the raw JWK — importJWK returns
  // a non-extractable CryptoKey, so we can't exportJWK it.
  const rawSig = parsePrivateKeys().sig;
  const headerJwk = {
    kty: rawSig.kty,
    crv: rawSig.crv,
    x: rawSig.x,
    y: rawSig.y,
  };
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    htm,
    htu: htu.split("?")[0].split("#")[0],
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk: headerJwk })
    .setIssuedAt(now)
    .setExpirationTime(now + 60)
    .sign(privateKey);
}

// ── Main: PAR request ───────────────────────────────────────────────────────
async function runPar() {
  const state = randomHex(32);
  const nonce = randomHex(16);
  const { challenge: codeChallenge } = await generatePkce();

  const clientAssertion = await buildClientAssertion(config.clientAssertionAudience);
  const dpop = await buildDpopProof("POST", config.parEndpoint);

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
    response_type: "code",
    scope: "openid name",
    redirect_uri: config.redirectUri,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    authentication_context_type: "APP_AUTHENTICATION_DEFAULT",
  });

  console.log("─── REQUEST ────────────────────────────────────────────────");
  console.log("URL:", config.parEndpoint);
  console.log("Headers:");
  console.log("  Content-Type: application/x-www-form-urlencoded");
  console.log("  DPoP:", dpop.slice(0, 60) + "...");
  console.log("Body params:");
  for (const [k, v] of body.entries()) {
    if (k === "client_assertion") console.log(`  ${k}: ${v.slice(0, 40)}...`);
    else console.log(`  ${k}: ${v}`);
  }
  console.log("\nClient assertion (decoded payload):");
  console.log("  iss:", config.clientId);
  console.log("  sub:", config.clientId);
  console.log("  aud:", config.clientAssertionAudience);

  const response = await fetch(config.parEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      DPoP: dpop,
    },
    body: body.toString(),
  });

  console.log("\n─── RESPONSE ───────────────────────────────────────────────");
  console.log("Status:", response.status, response.statusText);
  console.log("Headers:");
  for (const [k, v] of response.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  const text = await response.text();
  console.log("Body:");
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
}

// (runPar invoked sequentially below)

// ── Bonus: test token endpoint request format with a fake code ──────────────
async function runTokenExchange() {
  console.log("\n\n═══════════════════════════════════════════════════════════");
  console.log("TOKEN EXCHANGE TEST (with fake code — expect invalid_grant)");
  console.log("═══════════════════════════════════════════════════════════");

  const tokenEndpoint = `${issuer}/token`;
  const clientAssertion = await buildClientAssertion(config.clientAssertionAudience);
  const dpop = await buildDpopProof("POST", tokenEndpoint);

  // Note: SingPass docs don't list client_id as required for token endpoint
  // (client_assertion JWT identifies the client via iss/sub claims)
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    // Realistic-looking but unknown code (proper base64url, ~43 chars)
    code: "abcDEFghiJKLmnoPQRstuVWXyz0123456789-_AAAAA",
    redirect_uri: config.redirectUri,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
    code_verifier: "this_is_a_fake_pkce_verifier_43_chars_minimum_long_enough_yes",
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      DPoP: dpop,
    },
    body: body.toString(),
  });

  console.log("Status:", response.status);
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    console.log("Body:", JSON.stringify(json, null, 2));
    if (json.error === "invalid_grant") {
      console.log("\n✅ Token endpoint request format is VALID (rejected only on the fake code)");
    } else if (json.error === "invalid_request") {
      console.log("\n❌ Token endpoint REQUEST FORMAT is wrong — needs another fix");
    } else {
      console.log(`\n⚠️  Unexpected error: ${json.error}`);
    }
  } catch {
    console.log("Body:", text);
  }
}

// Sequential runner
async function main() {
  await runPar();
  await runTokenExchange();
}
main().catch((err) => {
  console.error("Test harness error:", err);
  process.exit(1);
});
