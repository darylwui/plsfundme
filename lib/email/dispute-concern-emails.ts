// Email template for the admin notification when a backer files a
// Stage 1 dispute concern. Self-contained styling parallel to
// `auth-emails.ts` — kept separate because the audience (internal
// admin) is different from the user-facing transactional set.

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface DisputeConcernEmailArgs {
  concernId: string;
  pledgeId: string;
  projectTitle: string;
  projectSlug: string;
  backerEmail: string;
  backerDisplayName: string;
  milestoneNumber: number | null;
  message: string;
  createdAt: string;
}

export function renderDisputeConcernAdminEmail(args: DisputeConcernEmailArgs) {
  const milestoneLine = args.milestoneNumber
    ? `Milestone ${args.milestoneNumber}`
    : "Whole campaign";
  const projectUrl = `${SITE}/projects/${args.projectSlug}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${esc(`New backer concern — ${args.projectTitle}`)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#14110D;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF6EE;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#FFF7E8;border:1px solid #E8DFD0;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px 40px 8px 40px;">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.18em;color:#AC5811;text-transform:uppercase;">Stage 1 dispute concern</p>
            <h1 style="margin:8px 0 16px 0;font-size:22px;line-height:1.3;font-weight:800;letter-spacing:-0.01em;color:#14110D;">New backer concern — ${esc(args.projectTitle)}</h1>
          </td></tr>
          <tr><td style="padding:0 40px 12px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFEBCA;border:1px solid #E8DFD0;border-radius:10px;">
              <tr><td style="padding:16px 18px;">
                <p style="margin:0 0 6px 0;font-size:13px;color:#6B5D4D;"><strong style="color:#14110D;">Backer:</strong> ${esc(args.backerDisplayName)} &lt;${esc(args.backerEmail)}&gt;</p>
                <p style="margin:0 0 6px 0;font-size:13px;color:#6B5D4D;"><strong style="color:#14110D;">Scope:</strong> ${esc(milestoneLine)}</p>
                <p style="margin:0 0 6px 0;font-size:13px;color:#6B5D4D;"><strong style="color:#14110D;">Pledge ID:</strong> <code style="font-family:'SF Mono',Menlo,monospace;font-size:12px;">${esc(args.pledgeId)}</code></p>
                <p style="margin:0;font-size:13px;color:#6B5D4D;"><strong style="color:#14110D;">Concern ID:</strong> <code style="font-family:'SF Mono',Menlo,monospace;font-size:12px;">${esc(args.concernId)}</code></p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:8px 40px 8px 40px;">
            <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#14110D;">Message</p>
            <div style="background:#FFFFFF;border:1px solid #E8DFD0;border-radius:10px;padding:16px 18px;font-size:14px;line-height:1.6;color:#14110D;white-space:pre-wrap;">${esc(args.message)}</div>
          </td></tr>
          <tr><td style="padding:20px 40px 8px 40px;">
            <a href="${projectUrl}" style="display:inline-block;background:#E07F14;color:#FFF7E8;font-size:14px;font-weight:700;padding:11px 22px;border-radius:8px;text-decoration:none;">Open campaign →</a>
          </td></tr>
          <tr><td style="padding:24px 40px 32px 40px;">
            <div style="border-top:1px solid #E8DFD0;height:1px;line-height:1px;font-size:1px;">&nbsp;</div>
            <p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#8E8070;">Filed at ${esc(args.createdAt)}. Per the Refund &amp; Dispute Policy, the creator has 14 calendar days to respond. Reply to the backer directly or update the concern status in the dispute_concerns table.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
