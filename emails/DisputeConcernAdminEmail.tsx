import { EmailLayout } from './_components/Layout';
import { Heading, Body, Subtle, Inset } from './_components/primitives';
import { Text, Link, Section } from '@react-email/components';
import { brand } from './_components/brand';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getthatbread.sg';

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

export function DisputeConcernAdminEmail(args: DisputeConcernEmailArgs) {
  const milestoneLine = args.milestoneNumber ? `Milestone ${args.milestoneNumber}` : 'Whole campaign';
  const projectUrl = `${APP_URL}/projects/${args.projectSlug}`;

  return (
    <EmailLayout preview="New backer concern">
      <Text style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: brand.crustDeep, textTransform: 'uppercase' }}>
        Stage 1 dispute concern
      </Text>
      <Heading style={{ margin: '8px 0 16px 0', fontSize: 22 }}>
        New backer concern — {args.projectTitle}
      </Heading>

      <Inset>
        <Text style={{ margin: '0 0 6px 0', fontSize: 13 }}>
          <strong>Backer:</strong> {args.backerDisplayName} &lt;{args.backerEmail}&gt;
        </Text>
        <Text style={{ margin: '0 0 6px 0', fontSize: 13 }}>
          <strong>Scope:</strong> {milestoneLine}
        </Text>
        <Text style={{ margin: '0 0 6px 0', fontSize: 13 }}>
          <strong>Pledge ID:</strong> <code style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 12 }}>{args.pledgeId}</code>
        </Text>
        <Text style={{ margin: 0, fontSize: 13 }}>
          <strong>Concern ID:</strong> <code style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 12 }}>{args.concernId}</code>
        </Text>
      </Inset>

      <Text style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700 }}>Message</Text>
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
        Filed at {args.createdAt}. Per the Refund &amp; Dispute Policy, the creator has 14 calendar days to respond. Reply to the backer directly or update the concern status in the dispute_concerns table.
      </Subtle>
    </EmailLayout>
  );
}
