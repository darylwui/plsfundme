interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface MilestoneApprovedInput {
  backer_name: string;
  creator_name: string;
  milestone_number: 1 | 2 | 3;
  product_name: string;
}

export function getMilestoneApprovedEmail(input: MilestoneApprovedInput): { subject: string; body: string } {
  const { backer_name, creator_name, milestone_number, product_name } = input;

  const milestoneTexts = {
    1: 'Tooling & Deposits — Factory has confirmed your order',
    2: 'Production Verified — Your product is being manufactured',
    3: 'Shipped & Fulfilled — Your orders are on the way',
  };

  const milestoneName = milestoneTexts[milestone_number].split(' — ')[0];
  const subject = `${milestoneName} — ${product_name}`;
  const body = `
Hi ${backer_name},

Great news: ${creator_name} just submitted proof of milestone ${milestone_number} for ${product_name}. We've verified it with the factory, and funds are being released.

**Milestone ${milestone_number}: ${milestoneTexts[milestone_number]}**

Your money is still safe in escrow until all milestones are complete. You'll get an update when the next milestone is ready.

Questions? Reply to this email.

— GetThatBread
  `;

  return { subject, body };
}

interface PostPledgeEducationInput {
  backer_name: string;
  product_name: string;
  amount_sgd: number;
}

export function getPostPledgeEducationEmail(input: PostPledgeEducationInput): { subject: string; body: string } {
  const { backer_name, product_name, amount_sgd } = input;

  const subject = "Your pledge is safe. Here's what happens next.";
  const body = `
Hi ${backer_name},

Thank you for backing ${product_name} with SGD ${amount_sgd}.

Your money is now in escrow — meaning it's held safely by GetThatBread until the creator delivers. The creator can't touch it until they hit three milestones:

1. **Tooling & Deposits** (40%) — We verify the factory has their order
2. **Production** (40%) — We confirm manufacturing is underway
3. **Fulfillment** (20%) — We track shipment to your door

**What happens if something goes wrong?**
- Creator delays? We notify you and hold funds.
- Creator disappears? File a dispute, and we help you recover your money.
- Product damaged? Report it, and we facilitate resolution or refund.

You'll get an email update every time a milestone is approved.

Questions? Visit our FAQ at getthatbread.sg/backer-faq

— GetThatBread
  `;

  return { subject, body };
}

/**
 * Placeholder for sending actual emails via Resend or similar
 * TODO: Implement sendEmail function that integrates with email service
 */
export async function sendMilestoneEmail(
  backer_email: string,
  template: 'milestone_approved' | 'post_pledge_education',
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrate with Resend API
    // const { success } = await resend.emails.send({
    //   from: 'notifications@getthatbread.sg',
    //   to: backer_email,
    //   subject: email.subject,
    //   html: email.body,
    // });

    console.log(`[Email] ${template} to ${backer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
