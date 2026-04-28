const env = process.env.SINGPASS_ENVIRONMENT ?? "staging";

export const singpassConfig = {
  clientId: process.env.SINGPASS_CLIENT_ID!,
  redirectUri: process.env.SINGPASS_REDIRECT_URI!,
  privateKeyBase64: process.env.SINGPASS_PRIVATE_KEY_BASE64!,
  authEndpoint:
    env === "production"
      ? "https://id.singpass.gov.sg/auth"
      : "https://stg-id.singpass.gov.sg/auth",
  tokenEndpoint:
    env === "production"
      ? "https://id.singpass.gov.sg/token"
      : "https://stg-id.singpass.gov.sg/token",
  jwksUri:
    env === "production"
      ? "https://id.singpass.gov.sg/.well-known/keys"
      : "https://stg-id.singpass.gov.sg/.well-known/keys",
};
