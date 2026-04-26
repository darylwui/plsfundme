import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { CampaignReportAdminEmail } from "@/emails/CampaignReportAdminEmail";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not available in production", { status: 404 });
  }

  const html = await render(
    CampaignReportAdminEmail({
      reportId: "rpt_abc123",
      projectTitle: "Sourdough Starter Kit",
      projectSlug: "sourdough-starter-kit",
      reporterEmail: "reporter@example.com",
      reporterDisplayName: "Jane Doe",
      category: "fraud",
      message: "This campaign appears to be fraudulent. The creator has posted the exact same content as another campaign from 6 months ago, but with different rewards.",
      createdAt: "2026-04-26T10:30:00Z",
    }),
  );

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
