import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "get that bread — Singapore's reward-based crowdfunding platform for entrepreneurs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #FFF7EC 0%, #FFE9C7 50%, #FFD59A 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            color: "#7A3409",
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <span style={{ fontSize: "48px" }}>🍞</span>
          <span>get that bread</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "84px",
              fontWeight: 900,
              color: "#1F1208",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            <span>Singapore&rsquo;s</span>
            <span style={{ color: "#B45309" }}>crowdfunding platform</span>
            <span>for entrepreneurs.</span>
          </div>
          <div
            style={{
              fontSize: "30px",
              color: "#5B4636",
              maxWidth: "900px",
              lineHeight: 1.3,
            }}
          >
            All-or-nothing funding. PayNow &amp; credit card. Backers only pay
            if the campaign hits its goal.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#7A3409",
            fontSize: "24px",
            fontWeight: 600,
          }}
        >
          <span>getthatbread.sg</span>
          <span style={{ display: "flex", gap: "16px" }}>
            <span>🇸🇬 Built for Singapore</span>
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
