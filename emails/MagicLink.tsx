import { EmailLayout } from './_components/Layout';
import { Heading, Body, PrimaryButton, Subtle } from './_components/primitives';

export function MagicLinkEmail({ confirmUrl }: { confirmUrl: string }) {
  return (
    <EmailLayout preview="Your sign-in link is ready">
      <Heading>Your sign-in link</Heading>
      <Body>
        Tap the button below to sign in to <strong>get that bread</strong>. No password needed — this link expires in 1 hour and can only be used once.
      </Body>
      <PrimaryButton href={confirmUrl}>Sign in →</PrimaryButton>
      <Subtle>
        <strong>Button not working?</strong> Paste this link into your browser:
        <br />
        <a href={confirmUrl} style={{ color: '#AC5811', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {confirmUrl}
        </a>
      </Subtle>
      <Subtle>Didn&apos;t request this? Someone may have typed your email by mistake — you can safely ignore this email.</Subtle>
    </EmailLayout>
  );
}
