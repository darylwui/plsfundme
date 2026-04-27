import { EmailLayout } from './_components/Layout';
import { Heading, Body, Subtle } from './_components/primitives';

interface InternationalInterestEmailProps {
  displayName: string;
  country: string;
}

/**
 * Confirmation sent immediately when someone submits the
 * /for-creators/international waitlist form.
 *
 * Tone: warm + honest. We're not opening their country yet, and we
 * want to set that expectation up front rather than ghost them and
 * have them assume we're an SG-only platform that won't reply.
 */
export function InternationalInterestEmail({
  displayName,
  country,
}: InternationalInterestEmailProps) {
  return (
    <EmailLayout preview="Thanks for your interest — we'll be in touch">
      <Heading>You&apos;re on the list 🍞</Heading>
      <Body>
        Hey {displayName} — thanks for letting us know you&apos;re interested in
        launching a campaign on <strong>get that bread</strong> from{' '}
        <strong>{country}</strong>.
      </Body>
      <Body>
        We&apos;re Singapore-only for now while we get the platform settled —
        reward-based crowdfunding regulations, payment rails, and creator
        verification differ by country, and we want to do each one properly
        rather than half-launch everywhere.
      </Body>
      <Body>
        We&apos;ll email you the moment we open in {country}. In the meantime,
        feel free to look around the platform to see how things work — same
        mechanics will apply when you launch with us later.
      </Body>
      <Subtle>
        Questions? Reply to this email — it lands in our inbox.
      </Subtle>
    </EmailLayout>
  );
}
