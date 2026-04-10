import { resend, FROM } from "./resend";
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://plsfundme.sg";

export async function sendCampaignFundedEmail(args: CampaignFundedArgs) {
  return resend.emails.send({
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
  return resend.emails.send({
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
  return resend.emails.send({
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

export async function sendPledgeRefundedEmail(args: PledgeRefundedArgs) {
  return resend.emails.send({
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
