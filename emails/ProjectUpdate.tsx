import * as React from 'react';
import { EmailLayout } from './_components/Layout';
import { Heading, Body, PrimaryButton, Subtle } from './_components/primitives';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getthatbread.sg';

export interface ProjectUpdateEmailProps {
  backerName: string;
  projectTitle: string;
  projectSlug: string;
  updateTitle: string;
  updateBody: string;
  isBackersOnly: boolean;
}

export function ProjectUpdateEmail(props: ProjectUpdateEmailProps) {
  const p =
    Object.keys(props).length > 0
      ? props
      : ({
          backerName: 'Sam',
          projectTitle: 'Sourdough Starter Kit',
          projectSlug: 'sourdough-starter-kit',
          updateTitle: 'We hit 50% funded — thank you!',
          updateBody:
            'We are absolutely blown away by the support so far. Just wanted to take a moment to thank everyone who has backed us.',
          isBackersOnly: false,
        } as ProjectUpdateEmailProps);

  return (
    <EmailLayout preview={`${p.projectTitle}: ${p.updateTitle}`}>
      <Heading>{p.updateTitle}</Heading>

      {p.isBackersOnly && <Subtle>🔒 This update is for backers only.</Subtle>}

      <Body>
        Hi {p.backerName}, here&apos;s the latest from the team behind{' '}
        <strong>{p.projectTitle}</strong>:
      </Body>

      <Body style={{ whiteSpace: 'pre-wrap' }}>{p.updateBody}</Body>

      <PrimaryButton href={`${APP_URL}/projects/${p.projectSlug}`}>
        View campaign
      </PrimaryButton>
    </EmailLayout>
  );
}

export default ProjectUpdateEmail;
