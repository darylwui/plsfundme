import { render } from '@react-email/render';
import { BackerInterestEmail } from '@/emails/BackerInterestEmail';

export async function renderBackerInterestEmail(args: { email: string }) {
  return render(BackerInterestEmail(args));
}
