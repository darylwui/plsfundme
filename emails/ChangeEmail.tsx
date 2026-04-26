import { EmailLayout } from './_components/Layout';
import { Heading, Body, PrimaryButton, Subtle } from './_components/primitives';

export function ChangeEmailEmail({ confirmUrl, newEmail }: { confirmUrl: string; newEmail: string }) {
  return (
    <EmailLayout preview="Confirm your new email">
      <Heading>Confirm your new email</Heading>
      <Body>
        You requested to change your <strong>get that bread</strong> account email to <strong>{newEmail}</strong>. Tap the button below to confirm.
      </Body>
      <Subtle>Your old email will stay active until the new one is confirmed.</Subtle>
      <PrimaryButton href={confirmUrl}>Confirm new email →</PrimaryButton>
      <Subtle>
        <strong>Button not working?</strong> Paste this link into your browser:
        <br />
        <a href={confirmUrl} style={{ color: '#AC5811', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {confirmUrl}
        </a>
      </Subtle>
      <Subtle>Didn&apos;t request this change? Secure your account immediately by resetting your password.</Subtle>
    </EmailLayout>
  );
}
