import { EmailLayout } from './_components/Layout';
import { Heading, Body, Subtle, Inset } from './_components/primitives';
import { Text, Link, Section } from '@react-email/components';
import { brand } from './_components/brand';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getthatbread.sg';

const CATEGORY_LABEL: Record<string, string> = {
  fraud: 'Fraud or scam',
  ip_infringement: 'IP infringement or counterfeit',
  illegal_regulated: 'Illegal or unlicensed regulated product',
  inappropriate: 'Inappropriate or hateful content',
  other: 'Other',
};

function categoryLabelFor(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}

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

export function CampaignReportAdminEmail(args: CampaignReportEmailArgs) {
  const projectUrl = `${APP_URL}/projects/${args.projectSlug}`;
  const categoryDisplay = categoryLabelFor(args.category);

  return (
    <EmailLayout preview={`Campaign report: ${categoryDisplay}`}>
      <Text style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: '#B91C1C', textTransform: 'uppercase' }}>
        Campaign report
      </Text>
      <Heading style={{ margin: '8px 0 16px 0', fontSize: 22 }}>
        {categoryDisplay} — {args.projectTitle}
      </Heading>

      <Inset>
        <Text style={{ margin: '0 0 6px 0', fontSize: 13 }}>
          <strong>Reporter:</strong> {args.reporterDisplayName} &lt;{args.reporterEmail}&gt;
        </Text>
        <Text style={{ margin: '0 0 6px 0', fontSize: 13 }}>
          <strong>Category:</strong> {categoryDisplay}
        </Text>
        <Text style={{ margin: 0, fontSize: 13 }}>
          <strong>Report ID:</strong> <code style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 12 }}>{args.reportId}</code>
        </Text>
      </Inset>

      <Text style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700 }}>Details</Text>
      <div style={{ backgroundColor: '#FFFFFF', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '16px 18px', fontSize: 14, lineHeight: 1.6, color: brand.ink, whiteSpace: 'pre-wrap' }}>
        {args.message}
      </div>

      <Section style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Link
          href={projectUrl}
          style={{
            display: 'inline-block',
            backgroundColor: brand.crust,
            color: '#FFF7E8',
            fontSize: 14,
            fontWeight: 700,
            padding: '11px 22px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Open campaign →
        </Link>
      </Section>

      <Subtle style={{ fontSize: 12, marginTop: 16 }}>
        Filed at {args.createdAt}. Triage by updating the row's status (open → reviewing → dismissed / action_taken) in the campaign_reports table. Do not contact the creator until you've assessed; reports are confidential by design.
      </Subtle>
    </EmailLayout>
  );
}
