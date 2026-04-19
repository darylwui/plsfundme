const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(title: string, inner: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${esc(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#14110D;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF6EE;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#FFF7E8;border:1px solid #E8DFD0;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px 0 rgba(20,17,13,0.06);">
          <tr><td style="padding:32px 40px 0 40px;">
            <a href="${SITE}" style="text-decoration:none;color:#14110D;font-size:20px;font-weight:800;letter-spacing:-0.01em;display:inline-flex;align-items:center;">
              <img src="${SITE}/bread-icon.png" alt="" width="28" height="28" style="vertical-align:middle;margin-right:10px;border:0;" />
              get that bread
            </a>
          </td></tr>
          ${inner}
          <tr><td style="padding:32px 40px 0 40px;"><div style="border-top:1px solid #E8DFD0;height:1px;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
          <tr><td style="padding:20px 40px 32px 40px;">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#8E8070;">get that bread · Singapore · <a href="${SITE}" style="color:#8E8070;text-decoration:underline;">getthatbread.sg</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function linkSection(args: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
}) {
  return `
    <tr><td style="padding:28px 40px 8px 40px;">
      <h1 style="margin:0 0 12px 0;font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:#14110D;">${args.heading}</h1>
      <p style="margin:0 0 28px 0;font-size:16px;line-height:1.6;color:#6B5D4D;">${args.body}</p>
    </td></tr>
    <tr><td style="padding:0 40px 8px 40px;">
      <a href="${esc(args.ctaUrl)}" style="display:inline-block;background:#E07F14;color:#FFF7E8;font-size:16px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.01em;">${args.ctaLabel}</a>
    </td></tr>
    <tr><td style="padding:24px 40px 0 40px;">
      <p style="margin:0 0 6px 0;font-size:13px;line-height:1.5;color:#8E8070;">Button not working? Paste this link into your browser:</p>
      <p style="margin:0;font-size:13px;word-break:break-all;line-height:1.5;"><a href="${esc(args.ctaUrl)}" style="color:#AC5811;text-decoration:underline;">${esc(args.ctaUrl)}</a></p>
    </td></tr>
    <tr><td style="padding:20px 40px 0 40px;">
      <p style="margin:0;font-size:12px;line-height:1.5;color:#8E8070;">${args.footer}</p>
    </td></tr>`;
}

const BRAND = `<strong style="color:#14110D;font-weight:700;">get that bread</strong>`;

export function renderConfirmSignup(args: { confirmUrl: string }) {
  return shell("Confirm your email", linkSection({
    heading: "Confirm your email",
    body: `Welcome to ${BRAND} — Singapore's home for creators raising capital from backers. Tap the button below to confirm your email and start baking.`,
    ctaLabel: "Confirm my email →",
    ctaUrl: args.confirmUrl,
    footer: "Didn't sign up? You can safely ignore this email.",
  }));
}

export function renderMagicLink(args: { confirmUrl: string }) {
  return shell("Your sign-in link", linkSection({
    heading: "Your sign-in link",
    body: `Tap the button below to sign in to ${BRAND}. No password needed — this link expires in 1 hour and can only be used once.`,
    ctaLabel: "Sign in →",
    ctaUrl: args.confirmUrl,
    footer: "Didn't request this? Someone may have typed your email by mistake — you can safely ignore this email.",
  }));
}

export function renderInvite(args: { confirmUrl: string }) {
  return shell("You're invited", linkSection({
    heading: "You're invited 🎉",
    body: `You've been invited to join ${BRAND} — Singapore's home for creators raising capital from backers. Accept the invite to finish setting up your account.`,
    ctaLabel: "Accept invite →",
    ctaUrl: args.confirmUrl,
    footer: "Not expecting this invite? You can safely ignore this email.",
  }));
}

export function renderResetPassword(args: { confirmUrl: string }) {
  return shell("Reset your password", linkSection({
    heading: "Reset your password",
    body: `We got a request to reset the password on your ${BRAND} account. Tap the button below to choose a new one. This link expires in 1 hour.`,
    ctaLabel: "Reset password →",
    ctaUrl: args.confirmUrl,
    footer: "Didn't request this? You can safely ignore this email — your password won't change unless you tap the link above.",
  }));
}

export function renderChangeEmail(args: { confirmUrl: string; newEmail: string }) {
  return shell("Confirm your new email", `
    <tr><td style="padding:28px 40px 8px 40px;">
      <h1 style="margin:0 0 12px 0;font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:#14110D;">Confirm your new email</h1>
      <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#6B5D4D;">You requested to change your ${BRAND} account email to <strong style="color:#14110D;font-weight:700;">${esc(args.newEmail)}</strong>. Tap the button below to confirm.</p>
      <p style="margin:0 0 28px 0;font-size:14px;line-height:1.6;color:#8E8070;">Your old email will stay active until the new one is confirmed.</p>
    </td></tr>
    <tr><td style="padding:0 40px 8px 40px;">
      <a href="${esc(args.confirmUrl)}" style="display:inline-block;background:#E07F14;color:#FFF7E8;font-size:16px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.01em;">Confirm new email →</a>
    </td></tr>
    <tr><td style="padding:24px 40px 0 40px;">
      <p style="margin:0 0 6px 0;font-size:13px;line-height:1.5;color:#8E8070;">Button not working? Paste this link into your browser:</p>
      <p style="margin:0;font-size:13px;word-break:break-all;line-height:1.5;"><a href="${esc(args.confirmUrl)}" style="color:#AC5811;text-decoration:underline;">${esc(args.confirmUrl)}</a></p>
    </td></tr>
    <tr><td style="padding:20px 40px 0 40px;">
      <p style="margin:0;font-size:12px;line-height:1.5;color:#8E8070;">Didn't request this change? Secure your account immediately by resetting your password.</p>
    </td></tr>`);
}

export function renderReauthentication(args: { token: string }) {
  return shell("Your verification code", `
    <tr><td style="padding:28px 40px 8px 40px;">
      <h1 style="margin:0 0 12px 0;font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:#14110D;">Verify it's you</h1>
      <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#6B5D4D;">Before we can finish this action on your ${BRAND} account, enter the 6-digit code below. It expires in 10 minutes.</p>
    </td></tr>
    <tr><td style="padding:0 40px 8px 40px;" align="center">
      <div style="display:inline-block;background:#FFEBCA;border:1px solid #E8DFD0;border-radius:12px;padding:20px 32px;font-family:'SF Mono',Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:800;letter-spacing:0.3em;color:#14110D;">${esc(args.token)}</div>
    </td></tr>
    <tr><td style="padding:20px 40px 0 40px;">
      <p style="margin:0;font-size:12px;line-height:1.5;color:#8E8070;">Didn't request this code? Someone may be trying to access your account — secure it by resetting your password.</p>
    </td></tr>`);
}
