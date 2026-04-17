import { Resend } from "resend";

export const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@getthatbread.sg";

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
