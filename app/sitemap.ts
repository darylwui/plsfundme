import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/explore", priority: 0.9, changeFrequency: "daily" },
    { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
    { path: "/for-creators", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/backer-protection", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  let projectEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("projects")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (data) {
      projectEntries = data
        .filter((row) => Boolean(row?.slug))
        .map((row) => ({
          url: `${SITE_URL}/projects/${row.slug}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : now,
          changeFrequency: "daily" as const,
          priority: 0.8,
        }));
    }
  } catch {
    // If the DB is unreachable at build/request time, fall back to static routes.
  }

  return [...staticEntries, ...projectEntries];
}
