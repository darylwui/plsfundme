import { EmailLayout } from './_components/Layout';
import { Heading, Body, PrimaryButton, Subtle } from './_components/primitives';

export function ConfirmSignupEmail({ confirmUrl }: { confirmUrl: string }) {
  return (
    <EmailLayout preview="Confirm your email and start baking">
      <Heading>Confirm your email</Heading>
      <Body>
        Welcome to <strong>get that bread</strong> — Singapore&apos;s home for creators raising capital from backers. Tap the button below to confirm your email and start baking.
      </Body>
      <PrimaryButton href={confirmUrl}>Confirm my email →</PrimaryButton>
      <Subtle>
        <strong>Button not working?</strong> Paste this link into your browser:
        <br />
        <a href={confirmUrl} style={{ color: '#AC5811', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {confirmUrl}
        </a>
      </Subtle>
      <Subtle>Didn&apos;t sign up? You can safely ignore this email.</Subtle>
    </EmailLayout>
  );
}
