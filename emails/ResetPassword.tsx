import { EmailLayout } from './_components/Layout';
import { Heading, Body, PrimaryButton, Subtle } from './_components/primitives';

export function ResetPasswordEmail({ confirmUrl }: { confirmUrl: string }) {
  return (
    <EmailLayout preview="Reset your password">
      <Heading>Reset your password</Heading>
      <Body>
        We got a request to reset the password on your <strong>get that bread</strong> account. Tap the button below to choose a new one. This link expires in 1 hour.
      </Body>
      <PrimaryButton href={confirmUrl}>Reset password →</PrimaryButton>
      <Subtle>
        <strong>Button not working?</strong> Paste this link into your browser:
        <br />
        <a href={confirmUrl} style={{ color: '#AC5811', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {confirmUrl}
        </a>
      </Subtle>
      <Subtle>Didn&apos;t request this? You can safely ignore this email — your password won&apos;t change unless you tap the link above.</Subtle>
    </EmailLayout>
  );
}
