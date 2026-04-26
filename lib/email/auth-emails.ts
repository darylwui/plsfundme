import { render } from '@react-email/render';
import { ConfirmSignupEmail } from '@/emails/ConfirmSignup';
import { MagicLinkEmail } from '@/emails/MagicLink';
import { InviteEmail } from '@/emails/InviteEmail';
import { ResetPasswordEmail } from '@/emails/ResetPassword';
import { ChangeEmailEmail } from '@/emails/ChangeEmail';
import { ReauthenticationEmail } from '@/emails/Reauthentication';

export async function renderConfirmSignup(args: { confirmUrl: string }) {
  return render(ConfirmSignupEmail(args));
}

export async function renderMagicLink(args: { confirmUrl: string }) {
  return render(MagicLinkEmail(args));
}

export async function renderInvite(args: { confirmUrl: string }) {
  return render(InviteEmail(args));
}

export async function renderResetPassword(args: { confirmUrl: string }) {
  return render(ResetPasswordEmail(args));
}

export async function renderChangeEmail(args: { confirmUrl: string; newEmail: string }) {
  return render(ChangeEmailEmail(args));
}

export async function renderReauthentication(args: { token: string }) {
  return render(ReauthenticationEmail(args));
}
