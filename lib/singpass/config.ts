const env = process.env.SINGPASS_ENVIRONMENT ?? "staging";
const baseUrl =
  env === "production" ? "https://id.singpass.gov.sg" : "https://stg-id.singpass.gov.sg";

export const singpassConfig = {
  clientId: process.env.SINGPASS_CLIENT_ID!,
  redirectUri: process.env.SINGPASS_REDIRECT_URI!,
  privateKeyBase64: process.env.SINGPASS_PRIVATE_KEY_BASE64!,
  issuer: baseUrl,
  authEndpoint: `${baseUrl}/auth`,
  parEndpoint: `${baseUrl}/fapi/par`,
  tokenEndpoint: `${baseUrl}/token`,
  jwksUri: `${baseUrl}/.well-known/keys`,
  // SingPass requires the client_assertion `aud` claim to be the FAPI base URL,
  // NOT the specific endpoint being called. Confirmed against staging.
  clientAssertionAudience: `${baseUrl}/fapi`,
};
