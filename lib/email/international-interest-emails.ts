import { render } from '@react-email/render';
import { InternationalInterestEmail } from '@/emails/InternationalInterestEmail';

export async function renderInternationalInterestEmail(args: {
  displayName: string;
  country: string;
}) {
  return render(InternationalInterestEmail(args));
}
