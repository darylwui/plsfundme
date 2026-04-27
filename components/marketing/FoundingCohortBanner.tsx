import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Sparkles } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";

const THRESHOLD = 5; // Minimum distinct creators with active/funded campaigns
const SHOW_LIMIT = 8; // Avatars rendered in the banner once threshold is met

interface CohortCreator {
  id: string;
  display_name: string;
  avatar_url: string | null;
  // The first active/funded project for this creator — used as the
  // avatar's link target so clicking takes you straight to a campaign.
  project_slug: string;
}

/**
 * Fetch the founding-cohort lineup. Returns an empty array if fewer
 * than THRESHOLD distinct creators have an active/funded campaign —
 * the banner is hidden until the platform has actual social proof to
 * display.
 *
 * Cached against the same `projects-trending` tag the homepage uses,
 * so the existing admin invalidation in #114 also flushes this banner
 * on status changes (no extra plumbing needed).
 */
const getFoundingCohort = unstable_cache(
  async (): Promise<CohortCreator[]> => {
    const supabase = createServiceClient();

    const { data: projects } = await supabase
      .from("projects")
      .select("id, slug, creator_id, launched_at, creator:profiles!creator_id(id, display_name, avatar_url)")
      .in("status", ["active", "funded"])
      .order("launched_at", { ascending: false });

    if (!projects || projects.length === 0) return [];

    // Dedupe by creator_id — first occurrence wins (which is the latest
    // launched campaign per creator, since we ordered desc above).
    const seen = new Set<string>();
    const lineup: CohortCreator[] = [];

    for (const p of projects) {
      const creator = p.creator as unknown as
        | { id: string; display_name: string; avatar_url: string | null }
        | null;
      if (!creator) continue;
      if (seen.has(creator.id)) continue;
      seen.add(creator.id);
      lineup.push({
        id: creator.id,
        display_name: creator.display_name,
        avatar_url: creator.avatar_url,
        project_slug: p.slug,
      });
    }

    // Below threshold = no banner. Returning [] instead of partial
    // data keeps the rendering side simple.
    if (lineup.length < THRESHOLD) return [];

    return lineup.slice(0, SHOW_LIMIT);
  },
  ["founding-cohort-lineup"],
  // Reuse the homepage's projects tag so #114's admin cache
  // invalidation also drops this cache on every status change.
  { revalidate: 60, tags: ["projects-trending"] },
);

/**
 * Server component that renders a horizontal strip showcasing creators
 * with active/funded campaigns. Self-hides when there are fewer than 5
 * — until then this returns null and the parent layout collapses.
 */
export async function FoundingCohortBanner() {
  const lineup = await getFoundingCohort();
  if (lineup.length === 0) return null;

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Eyebrow + heading */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 border border-[var(--color-brand-crust)]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
                Our founding cohort
              </p>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {lineup.length} creators raising right now
              </p>
            </div>
          </div>

          {/* Avatar row */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0">
            {lineup.map((c) => (
              <Link
                key={c.id}
                href={`/projects/${c.project_slug}`}
                className="group flex flex-col items-center gap-1.5 shrink-0"
                title={`See ${c.display_name}'s campaign`}
              >
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[var(--color-border)] bg-[var(--color-surface)] group-hover:border-[var(--color-brand-crust)] transition-colors">
                  {c.avatar_url ? (
                    // Native img is fine here — these are small (44×44) avatars
                    // already optimized at upload, and Next/Image overhead isn't
                    // worth it for an above-the-fold strip with tight LCP.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatar_url}
                      alt={c.display_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--color-ink-subtle)]">
                      {c.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)] truncate max-w-[64px] transition-colors">
                  {c.display_name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
