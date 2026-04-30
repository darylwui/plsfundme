const env = process.env.SINGPASS_ENVIRONMENT ?? "staging";
const baseUrl =
  env === "production" ? "https://id.singpass.gov.sg" : "https://stg-id.singpass.gov.sg";

// Myinfo Person API host. The Person endpoint lives on a separate api.* host
// from the OIDC issuer — `test.api.myinfo.gov.sg` for sandbox, `api.myinfo.gov.sg`
// for prod. Override via env if your dev portal registered something else.
const personApiBase =
  process.env.SINGPASS_PERSON_API_BASE ??
  (env === "production"
    ? "https://api.myinfo.gov.sg"
    : "https://test.api.myinfo.gov.sg");

// Scopes requested at PAR. Must match what's enabled for this client_id in
// the Singpass dev portal. The default below covers the fields creator KYC
// needs for payout compliance: identity (uinfin), name, DOB, nationality,
// and residential status.
const defaultScopes = [
  "openid",
  "uinfin",
  "name",
  "dateofbirth",
  "nationality",
  "residentialstatus",
];

const scopes = (process.env.SINGPASS_SCOPES ?? defaultScopes.join(" "))
  .split(/\s+/)
  .filter(Boolean);

export const singpassConfig = {
  clientId: process.env.SINGPASS_CLIENT_ID!,
  redirectUri: process.env.SINGPASS_REDIRECT_URI!,
  privateKeyBase64: process.env.SINGPASS_PRIVATE_KEY_BASE64!,
  issuer: baseUrl,
  authEndpoint: `${baseUrl}/fapi/auth`,
  parEndpoint: `${baseUrl}/fapi/par`,
  tokenEndpoint: `${baseUrl}/token`,
  jwksUri: `${baseUrl}/.well-known/keys`,
  // SingPass requires the client_assertion `aud` claim to be the FAPI base URL,
  // NOT the specific endpoint being called. Confirmed against staging.
  clientAssertionAudience: `${baseUrl}/fapi`,
  // Myinfo Person API base. Person URLs are built as
  // `${personApiBase}/com/v4/person/${uinfin}/`.
  personApiBase,
  scopes,
  scopeString: scopes.join(" "),
};
