import { getResend, FROM } from "./resend";
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
  return getResend().emails.send(payload);
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

interface AdminNewProjectSubmittedArgs {
  creatorName: string;
  projectTitle: string;
  projectSlug: string;
  fundingGoal: number;
}

export async function sendAdminNewProjectSubmittedEmail(args: AdminNewProjectSubmittedArgs) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "daryl.wui@gmail.com";
  return sendEmail({
    from: FROM,
    to: adminEmail,
    subject: `New project submitted for review: "${args.projectTitle}"`,
    html: `
      <h2>New project pending review</h2>
      <ul>
        <li><strong>Title:</strong> ${args.projectTitle}</li>
        <li><strong>Creator:</strong> ${args.creatorName}</li>
        <li><strong>Funding goal:</strong> ${formatSgd(args.fundingGoal)}</li>
      </ul>
      <a href="${appUrl}/admin/projects/${args.projectSlug}" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">
        Review project
      </a>
    `,
  });
}
