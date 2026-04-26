import { render } from '@react-email/render';
import { DisputeConcernAdminEmail } from '@/emails/DisputeConcernAdminEmail';

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

export async function renderDisputeConcernAdminEmail(args: DisputeConcernEmailArgs) {
  return render(DisputeConcernAdminEmail(args));
}
