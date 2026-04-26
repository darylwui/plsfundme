import { render } from '@react-email/render';
import { CampaignReportAdminEmail } from '@/emails/CampaignReportAdminEmail';

const CATEGORY_LABEL: Record<string, string> = {
  fraud: 'Fraud or scam',
  ip_infringement: 'IP infringement or counterfeit',
  illegal_regulated: 'Illegal or unlicensed regulated product',
  inappropriate: 'Inappropriate or hateful content',
  other: 'Other',
};

interface CampaignReportEmailArgs {
  reportId: string;
  projectTitle: string;
  projectSlug: string;
  reporterEmail: string;
  reporterDisplayName: string;
  category: string;
  message: string;
  createdAt: string;
}

export function categoryLabelFor(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}

export async function renderCampaignReportAdminEmail(args: CampaignReportEmailArgs) {
  return render(CampaignReportAdminEmail(args));
}
