import { getResend, FROM, REPLY_TO, ADMIN_EMAIL } from "./resend";
import { formatSgd } from "@/lib/utils/currency";

interface CampaignFundedArgs {
  creatorEmail: string;
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
  amountRaised: number;
  backerCount: number;
}

interface CampaignFailedArgs {
  creatorEmail: string;
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
  amountRaised: number;
  goal: number;
}

interface PledgeConfirmedArgs {
  backerEmail: string;
  backerName: string;
  projectTitle: string;
  projectSlug: string;
  amount: number;
  deadline: string;
}

interface PledgeRefundedArgs {
  backerEmail: string;
  backerName: string;
  projectTitle: string;
  amount: number;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";

function sendEmail(payload: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0]) {
  return getResend().emails.send({ replyTo: REPLY_TO, ...payload });
}

export async function sendCampaignFundedEmail(args: CampaignFundedArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: `🎉 Your campaign "${args.projectTitle}" has been funded!`,
    html: `
      <h2>Congratulations, ${args.creatorName}! 🎉</h2>
      <p>Your campaign <strong>${args.projectTitle}</strong> has reached its funding goal!</p>
      <ul>
        <li><strong>Amount raised:</strong> ${formatSgd(args.amountRaised)}</li>
        <li><strong>Total backers:</strong> ${args.backerCount}</li>
      </ul>
      <p>Your funds are being processed and will be transferred to your account shortly.</p>
      <a href="${appUrl}/dashboard" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Go to dashboard
      </a>
    `,
  });
}

export async function sendCampaignFailedEmail(args: CampaignFailedArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: `Your campaign "${args.projectTitle}" didn't reach its goal`,
    html: `
      <h2>Hi ${args.creatorName},</h2>
      <p>Unfortunately, your campaign <strong>${args.projectTitle}</strong> ended without reaching its goal.</p>
      <ul>
        <li><strong>Amount raised:</strong> ${formatSgd(args.amountRaised)} of ${formatSgd(args.goal)}</li>
      </ul>
      <p>No backers were charged. You can relaunch your campaign anytime.</p>
      <a href="${appUrl}/projects/create" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Relaunch campaign
      </a>
    `,
  });
}

export async function sendPledgeConfirmedEmail(args: PledgeConfirmedArgs) {
  return sendEmail({
    from: FROM,
    to: args.backerEmail,
    subject: `You backed "${args.projectTitle}" 🚀`,
    html: `
      <h2>You're in, ${args.backerName}! 🚀</h2>
      <p>Your pledge of <strong>${formatSgd(args.amount)}</strong> to <strong>${args.projectTitle}</strong> is confirmed.</p>
      <p>You'll only be charged if the campaign reaches its goal by <strong>${new Date(args.deadline).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
      <a href="${appUrl}/projects/${args.projectSlug}" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        View campaign
      </a>
    `,
  });
}

interface ProjectApprovedArgs {
  creatorEmail: string;
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
}

interface ProjectRejectedArgs {
  creatorEmail: string;
  creatorName: string;
  projectTitle: string;
  reasonCode?: string;
  message: string;
}

interface ProjectRemovedArgs {
  creatorEmail: string;
  creatorName: string;
  projectTitle: string;
  reason: string;
}

export async function sendProjectApprovedEmail(args: ProjectApprovedArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: `🎉 Your campaign "${args.projectTitle}" is now live!`,
    html: `
      <h2>Great news, ${args.creatorName}! 🎉</h2>
      <p>Your campaign <strong>${args.projectTitle}</strong> has been reviewed and approved. It is now live on get that bread and visible to backers.</p>
      <p>Share it with your network to start raising funds!</p>
      <a href="${appUrl}/projects/${args.projectSlug}" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        View your campaign
      </a>
    `,
  });
}

export async function sendProjectRejectedEmail(args: ProjectRejectedArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: `Feedback on your campaign "${args.projectTitle}"`,
    html: `
      <h2>Hi ${args.creatorName},</h2>
      <p>Thank you for submitting <strong>${args.projectTitle}</strong> to get that bread. Our team reviewed your campaign and has some feedback:</p>
      ${
        args.reasonCode
          ? `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:16px 0;border-radius:4px;">
              <p style="margin:0;font-weight:bold;color:#92400e;">📋 ${args.reasonCode === "unclear_goal" ? "Unclear project goal" : args.reasonCode === "weak_description" ? "Description needs work" : args.reasonCode === "missing_rewards" ? "Rewards unclear or missing" : args.reasonCode === "unrealistic_timeline" ? "Timeline or goal unrealistic" : args.reasonCode === "low_quality_assets" ? "Cover image or video quality" : args.reasonCode === "category_mismatch" ? "Wrong category selected" : args.reasonCode === "policy_violation" ? "Policy violation" : "Other feedback"}</p>
            </div>`
          : ""
      }
      <p><strong>Feedback:</strong></p>
      <p>${args.message}</p>
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>Address the feedback above in your campaign</li>
        <li>Edit your project in your dashboard</li>
        <li>Click "Resubmit for review"</li>
      </ol>
      <p>Our team will review your updated campaign within 1–2 business days. If you have questions, please reply to this email.</p>
      <a href="${appUrl}/dashboard/projects" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Go to dashboard
      </a>
    `,
  });
}

export async function sendProjectRemovedEmail(args: ProjectRemovedArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: `Your campaign "${args.projectTitle}" has been removed`,
    html: `
      <h2>Hi ${args.creatorName},</h2>
      <p>We have removed your campaign <strong>${args.projectTitle}</strong> from get that bread due to a violation of our <a href="${appUrl}/terms">Terms of Service</a>.</p>
      <p><strong>Reason:</strong> ${args.reason}</p>
      <p>Any active pledges will be refunded to backers. If you believe this is a mistake, please contact us by replying to this email.</p>
    `,
  });
}

interface CreatorApplicationSubmittedArgs {
  creatorEmail: string;
  creatorName: string;
}

export async function sendCreatorApplicationSubmittedEmail(args: CreatorApplicationSubmittedArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: "We received your creator application 🙌",
    html: `
      <h2>Hi ${args.creatorName},</h2>
      <p>We've received your application to become a creator on get that bread. Our team reviews all applications within <strong>1–2 business days</strong>.</p>
      <p>You'll get an email as soon as a decision is made. In the meantime, you can check your application status in your dashboard.</p>
      <a href="${appUrl}/dashboard" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        View your dashboard
      </a>
      <p style="margin-top:24px;font-size:14px;color:#6b7280;">
        Questions? Reply to this email or contact us at <a href="mailto:hello@getthatbread.sg">hello@getthatbread.sg</a>.
      </p>
    `,
  });
}

interface CreatorApprovedArgs {
  creatorEmail: string;
  creatorName: string;
}

interface CreatorRejectedArgs {
  creatorEmail: string;
  creatorName: string;
  rejectionReason: string;
}

export async function sendCreatorApprovedEmail(args: CreatorApprovedArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: "🎉 You're approved — launch your first campaign!",
    html: `
      <h2>Welcome aboard, ${args.creatorName}! 🎉</h2>
      <p>Great news — your creator application has been reviewed and <strong>approved</strong>.</p>
      <p>You can now create and publish your first campaign on get that bread. Share your idea with backers and start raising funds today.</p>
      <p style="margin-top:16px;font-size:14px;color:#6b7280;">
        Not sure where to start?
        <a href="${appUrl}/for-creators/launch-guide" style="color:#7C3AED;">Run through our launch checklist</a>
        — it covers everything you need to prepare before you open the campaign form.
      </p>
      <a href="${appUrl}/projects/create" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Launch your first campaign
      </a>
      <p style="margin-top:24px;font-size:14px;color:#6b7280;">
        Questions? Reply to this email or contact us at <a href="mailto:hello@getthatbread.sg">hello@getthatbread.sg</a>.
      </p>
    `,
  });
}

export async function sendCreatorRejectedEmail(args: CreatorRejectedArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: "Update on your creator application",
    html: `
      <h2>Hi ${args.creatorName},</h2>
      <p>Thank you for applying to become a creator on get that bread. After reviewing your application, we're unable to approve it at this time.</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:16px 0;border-radius:4px;">
        <p style="margin:0;font-weight:bold;color:#991b1b;">Feedback from our team:</p>
        <p style="margin:8px 0 0;color:#b91c1c;">${args.rejectionReason}</p>
      </div>
      <p>You're welcome to address the feedback and re-apply at any time.</p>
      <a href="${appUrl}/apply/creator" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Re-apply as a Creator
      </a>
      <p style="margin-top:24px;font-size:14px;color:#6b7280;">
        If you have questions, reply to this email or contact us at <a href="mailto:hello@getthatbread.sg">hello@getthatbread.sg</a>.
      </p>
    `,
  });
}

// ── Admin notification emails ─────────────────────────────────────────────────

interface AdminNewCreatorApplicationArgs {
  applicantName: string;
  applicantEmail: string;
  projectType: string;
  projectDescription: string;
}

interface AdminNewProjectSubmittedArgs {
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
  fundingGoal: number;
}

export async function sendAdminNewCreatorApplicationEmail(args: AdminNewCreatorApplicationArgs) {
  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🔔 New creator application — ${args.applicantName}`,
    html: `
      <h2>New creator application</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-weight:600;">Name</td><td style="padding:6px 0;">${args.applicantName}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-weight:600;">Email</td><td style="padding:6px 0;">${args.applicantEmail}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-weight:600;">Project type</td><td style="padding:6px 0;">${args.projectType}</td></tr>
      </table>
      <p style="font-weight:600;margin-top:16px;">Project description:</p>
      <p style="background:#f9fafb;border-left:3px solid #d1d5db;padding:12px;border-radius:4px;color:#374151;">${args.projectDescription}</p>
      <a href="${appUrl}/admin/creators" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Review in admin
      </a>
    `,
  });
}

export async function sendAdminNewProjectSubmittedEmail(args: AdminNewProjectSubmittedArgs) {
  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🔔 New campaign for review — "${args.projectTitle}"`,
    html: `
      <h2>New campaign submitted for review</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-weight:600;">Creator</td><td style="padding:6px 0;">${args.creatorName}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-weight:600;">Title</td><td style="padding:6px 0;">${args.projectTitle}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-weight:600;">Goal</td><td style="padding:6px 0;">${formatSgd(args.fundingGoal)}</td></tr>
      </table>
      <a href="${appUrl}/projects/${args.projectSlug}" style="background:#6b7280;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;margin-right:8px;">
        Preview campaign
      </a>
      <a href="${appUrl}/admin/projects" style="background:#7C3AED;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Review in admin
      </a>
    `,
  });
}

// ── Creator review thread emails ──────────────────────────────────────────────

interface CreatorRequestInfoArgs {
  creatorEmail: string;
  creatorName: string;
  question: string;
}

interface CreatorNewMessageArgs {
  creatorEmail: string;
  creatorName: string;
  message: string;
}

interface AdminCreatorRepliedArgs {
  applicantName: string;
  applicantEmail: string;
  reply: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendCreatorRequestInfoEmail(args: CreatorRequestInfoArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: "We need a bit more info on your creator application",
    html: `
      <h2>Hi ${args.creatorName},</h2>
      <p>Thanks for applying to become a creator on get that bread. Before we can make a decision, we'd like to ask you a few follow-up questions:</p>
      <div style="background:#fef9c3;border-left:4px solid #eab308;padding:12px 16px;margin:16px 0;border-radius:4px;">
        <p style="margin:0;white-space:pre-wrap;color:#713f12;">${escapeHtml(args.question)}</p>
      </div>
      <p>Reply directly in your application thread — we'll get a notification as soon as you respond.</p>
      <a href="${appUrl}/dashboard/application" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Open your application
      </a>
      <p style="margin-top:24px;font-size:14px;color:#6b7280;">
        Questions? Reply to this email or contact us at <a href="mailto:hello@getthatbread.sg">hello@getthatbread.sg</a>.
      </p>
    `,
  });
}

export async function sendCreatorNewMessageEmail(args: CreatorNewMessageArgs) {
  return sendEmail({
    from: FROM,
    to: args.creatorEmail,
    subject: "New message on your creator application",
    html: `
      <h2>Hi ${args.creatorName},</h2>
      <p>A reviewer just added a message to your creator application thread:</p>
      <div style="background:#f3f4f6;border-left:4px solid #9ca3af;padding:12px 16px;margin:16px 0;border-radius:4px;">
        <p style="margin:0;white-space:pre-wrap;color:#374151;">${escapeHtml(args.message)}</p>
      </div>
      <a href="${appUrl}/dashboard/application" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Open your application
      </a>
    `,
  });
}

export async function sendAdminCreatorRepliedEmail(args: AdminCreatorRepliedArgs) {
  return sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `💬 ${args.applicantName} replied on their creator application`,
    html: `
      <h2>${args.applicantName} replied</h2>
      <p style="font-size:14px;color:#6b7280;">${args.applicantEmail}</p>
      <div style="background:#f3f4f6;border-left:4px solid #9ca3af;padding:12px 16px;margin:16px 0;border-radius:4px;">
        <p style="margin:0;white-space:pre-wrap;color:#374151;">${escapeHtml(args.reply)}</p>
      </div>
      <a href="${appUrl}/dashboard/admin/creators?tab=needs_info" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Open in admin
      </a>
    `,
  });
}

export async function sendPledgeRefundedEmail(args: PledgeRefundedArgs) {
  return sendEmail({
    from: FROM,
    to: args.backerEmail,
    subject: `Your pledge to "${args.projectTitle}" has been refunded`,
    html: `
      <h2>Hi ${args.backerName},</h2>
      <p>The campaign <strong>${args.projectTitle}</strong> didn't reach its goal, so your pledge of <strong>${formatSgd(args.amount)}</strong> has been refunded in full.</p>
      <p>Keep an eye out for other exciting projects to back!</p>
      <a href="${appUrl}/explore" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Explore projects
      </a>
    `,
  });
}
