import { EmailLayout } from './_components/Layout';
import { Heading, Body, Subtle, Inset } from './_components/primitives';
import { Text } from '@react-email/components';

export function ReauthenticationEmail({ token }: { token: string }) {
  return (
    <EmailLayout preview="Your verification code">
      <Heading>Verify it&apos;s you</Heading>
      <Body>
        Before we can finish this action on your <strong>get that bread</strong> account, enter the 6-digit code below. It expires in 10 minutes.
      </Body>
      <Inset>
        <Text
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '0.3em',
            fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
          }}
        >
          {token}
        </Text>
      </Inset>
      <Subtle>Didn&apos;t request this code? Someone may be trying to access your account — secure it by resetting your password.</Subtle>
    </EmailLayout>
  );
}
