import * as React from 'react';
import { EmailLayout } from './_components/Layout';
import {
  Heading,
  Body,
  PrimaryButton,
  Inset,
  StatRow,
} from './_components/primitives';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getthatbread.sg';

export interface PledgeConfirmedEmailProps {
  backerName: string;
  projectTitle: string;
  projectSlug: string;
  amountSgd: string; // pre-formatted, e.g. "$45"
  deadlineDisplay: string; // pre-formatted, e.g. "15 May 2026"
}

/**
 * "You're in" — sent immediately after a pledge is captured (card or PayNow).
 *
 * Tone: friendly + reassuring. The backer just spent money; they want
 * confirmation, the deadline, and a way back to the campaign.
 */
export function PledgeConfirmedEmail(props: PledgeConfirmedEmailProps) {
  const previewProps =
    Object.keys(props).length > 0
      ? props
      : ({
          backerName: 'Sam',
          projectTitle: 'Sourdough Starter Kit',
          projectSlug: 'sourdough-starter-kit',
          amountSgd: '$45',
          deadlineDisplay: '15 May 2026',
        } as PledgeConfirmedEmailProps);

  return (
    <EmailLayout
      preview={`You backed ${previewProps.projectTitle} for ${previewProps.amountSgd}.`}
    >
      <Heading>You&apos;re in, {previewProps.backerName} 🎉</Heading>

      <Body>
        Thanks for backing <strong>{previewProps.projectTitle}</strong>. Your
        pledge is locked in — and your card won&apos;t be charged unless the
        campaign hits its goal by{' '}
        <strong>{previewProps.deadlineDisplay}</strong>.
      </Body>

      <Inset>
        <StatRow label="Pledged" value={previewProps.amountSgd} />
        <StatRow label="Charged if funded" value={previewProps.deadlineDisplay} />
        <StatRow label="Status" value="No charge yet" />
      </Inset>

      <Body>
        Want to share it with friends? Every share helps the creator hit their
        goal faster.
      </Body>

      <PrimaryButton href={`${APP_URL}/projects/${previewProps.projectSlug}`}>
        View campaign
      </PrimaryButton>
    </EmailLayout>
  );
}

export default PledgeConfirmedEmail;
