import { Resend } from "resend";

export const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@getthatbread.sg";
export const REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL ?? "hello@getthatbread.sg";
export const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "hello@getthatbread.sg";

let resendClient: Resend | null = null;

export function getResend() {
	const apiKey = process.env.RESEND_API_KEY;

	if (!apiKey) {
		throw new Error("Missing RESEND_API_KEY.");
	}

	if (!resendClient) {
		resendClient = new Resend(apiKey);
	}

	return resendClient;
}
