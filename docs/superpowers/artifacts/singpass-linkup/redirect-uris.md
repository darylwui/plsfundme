# Redirect URI Registration

GovTech's developer portal asks for the exact set of redirect URIs
allowed for the Singpass OIDC authorization code flow. These are
what `redirect_uri` parameter values we'll send on `/authorize`.

## Production client — register these URIs

```
https://getthatbread.sg/api/auth/singpass/callback
https://www.getthatbread.sg/api/auth/singpass/callback
```

The second entry (`www.` subdomain) is a defensive entry in case the
apex / www redirect configuration is ever inverted. Both land at the
same Next.js App Router route handler at
`app/api/auth/singpass/callback/route.ts`.

**No wildcard subdomain registration is requested for production.**
Production traffic flows through one canonical host.

## Sandbox client — register these URIs

```
https://getthatbread.sg/api/auth/singpass/callback
https://www.getthatbread.sg/api/auth/singpass/callback
http://localhost:3000/api/auth/singpass/callback
```

**Optional: preview-deployment wildcard.** If the sandbox client
registration form allows wildcarded Vercel preview URLs, we would
additionally like:

```
https://plsfundme-git-*.vercel.app/api/auth/singpass/callback
https://*-darylwui-projects.vercel.app/api/auth/singpass/callback
```

If wildcards are not supported for sandbox registration, we will
manually re-register the callback URI for each branch preview that
needs end-to-end testing, or we will route all sandbox testing through
`localhost:3000` via the local development server.

## Notes

- All URIs use TLS except `localhost`, which Singpass sandbox
  explicitly allows for development.
- The callback path is identical across environments; environment
  selection is done via the `SINGPASS_ENV` server-side env var, not
  via URL.
- No port is specified on production URIs (default 443).
- The path `/api/auth/singpass/callback` is served by a Node.js
  runtime route handler (`runtime = "nodejs"`) to support the full
  JOSE cryptography stack required for ID-token decryption.
