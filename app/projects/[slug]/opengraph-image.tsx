import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/server";
import { fundingPercent } from "@/lib/utils/currency";
import { daysRemaining } from "@/lib/utils/dates";

// Intl locale data inside the ImageResponse runtime may fall back to
// "$" instead of the Singapore "S$" symbol — format manually here.
function formatSgdOg(n: number): string {
  const rounded = Math.round(n);
  return `S$${rounded.toLocaleString("en-US")}`;
}

export const alt = "Crowdfunding campaign on get that bread";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "title, short_description, cover_image_url, funding_goal_sgd, amount_pledged_sgd, backer_count, deadline, status, creator:profiles!creator_id(display_name), category:categories(name)"
    )
    .eq("slug", slug)
    .maybeSingle();

  // Fallback to the site-wide OG if the project doesn't exist or isn't
  // public — keeps share previews working for draft/edit links.
  if (!project) {
    return fallback();
  }

  const row = project as unknown as {
    title: string;
    short_description: string;
    cover_image_url: string | null;
    funding_goal_sgd: number;
    amount_pledged_sgd: number;
    backer_count: number;
    deadline: string;
    status: string;
    creator: { display_name: string } | null;
    category: { name: string } | null;
  };

  const pct = fundingPercent(row.amount_pledged_sgd, row.funding_goal_sgd);
  const daysLeft = daysRemaining(row.deadline);
  const isEnded = daysLeft <= 0 || row.status === "funded" || row.status === "failed";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #FFF7EC 0%, #FFE9C7 50%, #FFD59A 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: cover image or brand panel */}
        <div
          style={{
            width: "520px",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(160deg, #E07F14 0%, #AC5811 100%)",
            position: "relative",
          }}
        >
          {row.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.cover_image_url}
              alt=""
              width={520}
              height={630}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "180px",
              }}
            >
              🍞
            </div>
          )}
        </div>

        {/* Right: content */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 60px",
          }}
        >
          {/* Brand mark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              color: "#7A3409",
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ fontSize: "40px" }}>🍞</span>
            <span>get that bread</span>
            {row.category?.name && (
              <span
                style={{
                  display: "flex",
                  marginLeft: "12px",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  background: "#FFEBCA",
                  border: "2px solid #E07F14",
                  color: "#7A3409",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "0",
                  textTransform: "none",
                }}
              >
                {row.category.name}
              </span>
            )}
          </div>

          {/* Title + creator */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                fontSize: row.title.length > 48 ? "48px" : "60px",
                fontWeight: 900,
                color: "#1F1208",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {row.title}
            </div>
            {row.creator?.display_name && (
              <div
                style={{
                  display: "flex",
                  fontSize: "22px",
                  color: "#5B4636",
                  fontWeight: 600,
                }}
              >
                by {row.creator.display_name}
              </div>
            )}
          </div>

          {/* Progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                color: "#1F1208",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "38px", fontWeight: 900 }}>
                  {formatSgdOg(row.amount_pledged_sgd)}
                </span>
                <span style={{ fontSize: "20px", color: "#5B4636", fontWeight: 600 }}>
                  of {formatSgdOg(row.funding_goal_sgd)}
                </span>
              </div>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  color: pct >= 100 ? "#3E8E5B" : "#7A3409",
                }}
              >
                {pct}%
              </span>
            </div>
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "16px",
                background: "#FFEBCA",
                borderRadius: "999px",
                border: "2px solid #E07F14",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: `${pct}%`,
                  height: "100%",
                  background:
                    pct >= 100
                      ? "linear-gradient(90deg, #3E8E5B, #4FA06D)"
                      : "linear-gradient(90deg, #E07F14, #F5B03E)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "20px",
                color: "#5B4636",
                fontWeight: 600,
              }}
            >
              <span>
                {row.backer_count} {row.backer_count === 1 ? "backer" : "backers"}
              </span>
              <span>
                {row.status === "funded"
                  ? "Funded"
                  : row.status === "failed"
                  ? "Ended"
                  : isEnded
                  ? "Ended"
                  : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
              </span>
              <span>getthatbread.sg</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function fallback() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #FFF7EC 0%, #FFE9C7 50%, #FFD59A 100%)",
          fontFamily: "sans-serif",
          color: "#1F1208",
        }}
      >
        <div style={{ fontSize: "120px" }}>🍞</div>
        <div style={{ fontSize: "48px", fontWeight: 900, marginTop: "16px" }}>
          get that bread
        </div>
        <div style={{ fontSize: "24px", color: "#5B4636", marginTop: "8px" }}>
          Singapore&rsquo;s crowdfunding platform for entrepreneurs
        </div>
      </div>
    ),
    { ...size }
  );
}
