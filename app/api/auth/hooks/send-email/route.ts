import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "standardwebhooks";
import { FROM, getResend } from "@/lib/email/resend";
import {
  renderChangeEmail,
  renderConfirmSignup,
  renderInvite,
  renderMagicLink,
  renderReauthentication,
  renderResetPassword,
} from "@/lib/email/auth-emails";

type EmailActionType =
  | "signup"
  | "login"
  | "magiclink"
  | "invite"
  | "recovery"
  | "email_change"
  | "email_change_new"
  | "reauthentication";

interface HookPayload {
  user: { id: string; email: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: EmailActionType;
    site_url: string;
    new_email?: string;
  };
}

// verifyOtp type to use on our /auth/confirm endpoint, per action
const VERIFY_TYPE: Record<EmailActionType, string> = {
  signup: "signup",
  login: "magiclink",
  magiclink: "magiclink",
  invite: "invite",
  recovery: "recovery",
  email_change: "email_change",
  email_change_new: "email_change",
  reauthentication: "email", // not used — reauth has no link
};

export async function POST(request: NextRequest) {
  const rawSecret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!rawSecret) {
    console.error("[send-email hook] SEND_EMAIL_HOOK_SECRET missing");
    return NextResponse.json({ error: "Hook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  let payload: HookPayload;
  try {
    const wh = new Webhook(rawSecret.replace(/^v1,whsec_/, ""));
    payload = wh.verify(body, headers) as HookPayload;
  } catch (err) {
    console.error("[send-email hook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? payload.email_data.site_url;
  const { user, email_data } = payload;

  const buildConfirmUrl = (nextPath: string) => {
    const type = VERIFY_TYPE[email_data.email_action_type];
    const params = new URLSearchParams({
      token_hash: email_data.token_hash,
      type,
      next: nextPath,
    });
    return `${siteUrl}/auth/confirm?${params.toString()}`;
  };

  let subject: string;
  let html: string;

  switch (email_data.email_action_type) {
    case "signup":
      subject = "Confirm your email — get that bread";
      html = renderConfirmSignup({ confirmUrl: buildConfirmUrl("/dashboard") });
      break;
    case "login":
    case "magiclink":
      subject = "Your sign-in link — get that bread";
      html = renderMagicLink({ confirmUrl: buildConfirmUrl("/dashboard") });
      break;
    case "invite":
      subject = "You're invited to get that bread";
      html = renderInvite({ confirmUrl: buildConfirmUrl("/dashboard") });
      break;
    case "recovery":
      subject = "Reset your password — get that bread";
      html = renderResetPassword({ confirmUrl: buildConfirmUrl("/reset-password") });
      break;
    case "email_change":
    case "email_change_new":
      subject = "Confirm your new email — get that bread";
      html = renderChangeEmail({
        confirmUrl: buildConfirmUrl("/dashboard"),
        newEmail: email_data.new_email ?? user.new_email ?? user.email,
      });
      break;
    case "reauthentication":
      subject = "Your verification code — get that bread";
      html = renderReauthentication({ token: email_data.token });
      break;
    default: {
      const unknown: string = email_data.email_action_type;
      console.error("[send-email hook] unknown action type:", unknown);
      return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }
  }

  const to = email_data.email_action_type === "email_change_new"
    ? (email_data.new_email ?? user.new_email ?? user.email)
    : user.email;

  const { error } = await getResend().emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[send-email hook] Resend error:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
