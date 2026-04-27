// Renders each Supabase auth email with Go-template placeholders
// (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Token }}`) baked in and
// writes the HTML to scripts/out/*.html.
//
// Use this when you've changed an `emails/*.tsx` template and need to
// re-paste the static HTML into Supabase → Auth → Email Templates. Each
// file in scripts/out/ corresponds to one Supabase template (filename
// matches the dashboard template's slug).
//
// **Long-term:** wire the Send Email Hook in Supabase
// (Auth → Hooks → Send Email Hook → /api/auth/hooks/send-email) and this
// paste-loop becomes unnecessary — the live React Email components run
// per-send instead.
//
// Usage:
//   npx tsx scripts/render-supabase-emails.ts
//
// Output:
//   scripts/out/confirm-signup.html
//   scripts/out/magic-link.html
//   scripts/out/invite.html
//   scripts/out/reset-password.html
//   scripts/out/change-email.html
//   scripts/out/reauthentication.html
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  renderConfirmSignup,
  renderMagicLink,
  renderInvite,
  renderResetPassword,
  renderChangeEmail,
  renderReauthentication,
} from '../lib/email/auth-emails';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, 'out');
mkdirSync(outDir, { recursive: true });

const CONFIRM = '{{ .ConfirmationURL }}';
const EMAIL = '{{ .Email }}';
const TOKEN = '{{ .Token }}';

const targets = [
  ['confirm-signup', () => renderConfirmSignup({ confirmUrl: CONFIRM })],
  ['magic-link', () => renderMagicLink({ confirmUrl: CONFIRM })],
  ['invite', () => renderInvite({ confirmUrl: CONFIRM })],
  ['reset-password', () => renderResetPassword({ confirmUrl: CONFIRM })],
  ['change-email', () => renderChangeEmail({ confirmUrl: CONFIRM, newEmail: EMAIL })],
  ['reauthentication', () => renderReauthentication({ token: TOKEN })],
];

async function main() {
  for (const [name, fn] of targets) {
    const html = await fn();
    const path = resolve(outDir, `${name}.html`);
    writeFileSync(path, html);
    console.log(`✓ ${name} → ${path} (${html.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
