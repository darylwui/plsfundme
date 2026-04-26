import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { ConfirmSignupEmail } from "@/emails/ConfirmSignup";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not available in production", { status: 404 });
  }

  const html = await render(
    ConfirmSignupEmail({
      confirmUrl: "https://getthatbread.sg/auth/confirm?token_hash=abc123&type=signup&next=%2Fdashboard",
    }),
  );

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
