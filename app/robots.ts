import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/auth/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/preview/",
        "/backing/",
        "/apply/",
        "/projects/create",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
