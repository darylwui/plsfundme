import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { PledgeConfirmedEmail } from "@/emails/PledgeConfirmed";

// Renders the email exactly as it would be sent — useful for iterating on the
// design without firing actual emails. Localhost-only by default.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not available in production", { status: 404 });
  }

  const html = await render(
    PledgeConfirmedEmail({
      backerName: "Sam",
      projectTitle: "Sourdough Starter Kit",
      projectSlug: "sourdough-starter-kit",
      amountSgd: "$45",
      deadlineDisplay: "15 May 2026",
    }),
  );

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
