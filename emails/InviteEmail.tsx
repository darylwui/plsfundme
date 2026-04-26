import { EmailLayout } from './_components/Layout';
import { Heading, Body, PrimaryButton, Subtle } from './_components/primitives';

export function InviteEmail({ confirmUrl }: { confirmUrl: string }) {
  return (
    <EmailLayout preview="You're invited to get that bread">
      <Heading>You're invited 🎉</Heading>
      <Body>
        You've been invited to join <strong>get that bread</strong> — Singapore&apos;s home for creators raising capital from backers. Accept the invite to finish setting up your account.
      </Body>
      <PrimaryButton href={confirmUrl}>Accept invite →</PrimaryButton>
      <Subtle>
        <strong>Button not working?</strong> Paste this link into your browser:
        <br />
        <a href={confirmUrl} style={{ color: '#AC5811', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {confirmUrl}
        </a>
      </Subtle>
      <Subtle>Not expecting this invite? You can safely ignore this email.</Subtle>
    </EmailLayout>
  );
}
