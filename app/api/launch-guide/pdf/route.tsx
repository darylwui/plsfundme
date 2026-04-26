import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { LaunchGuidePdf } from "@/app/(marketing)/for-creators/launch-guide/_pdf/Document";

// @react-pdf/renderer needs Node APIs — never run on the edge runtime.
export const runtime = "nodejs";

// The checklist data is static (from a TS module). Cache the rendered PDF
// at the edge so we're not re-rendering on every download.
export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const buffer = await renderToBuffer(<LaunchGuidePdf />);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="get-that-bread-launch-checklist.pdf"',
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("[launch-guide pdf] render failed:", err);
    return NextResponse.json(
      { error: "Could not generate PDF." },
      { status: 500 },
    );
  }
}
