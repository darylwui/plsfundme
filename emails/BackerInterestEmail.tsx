import { EmailLayout } from './_components/Layout';
import { Heading, Body, Subtle } from './_components/primitives';

interface BackerInterestEmailProps {
  email: string;
}

export function BackerInterestEmail({ email: _email }: BackerInterestEmailProps) {
  return (
    <EmailLayout preview="You're on the list — we'll let you know when campaigns go live">
      <Heading>You&apos;re on the list 🍞</Heading>
      <Body>
        Thanks for signing up — we&apos;ll email you the moment the first
        campaigns go live on <strong>get that bread</strong>.
      </Body>
      <Body>
        We&apos;re onboarding Singapore&apos;s first founders right now. When
        they launch, you&apos;ll be among the first to back them and claim
        early-backer rewards before they sell out.
      </Body>
      <Subtle>
        Questions? Reply to this email — it lands in our inbox.
      </Subtle>
    </EmailLayout>
  );
}
