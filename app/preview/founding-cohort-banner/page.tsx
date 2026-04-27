import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";

// Local-only preview of the FoundingCohortBanner with mock data, so you
// can see the visual treatment before having 5+ real creators on the
// platform. Matches the pattern used by /preview/email/*.
//
// The real component lives at components/marketing/FoundingCohortBanner.tsx
// and self-hides when there are fewer than 5 distinct creators with
// active/funded campaigns — so on production it currently renders nothing.

export const metadata = { title: "Preview — Founding Cohort Banner" };

const MOCK_CREATORS = [
  { id: "1", display_name: "Daryl", avatar_url: "https://i.pravatar.cc/120?img=12", project_slug: "demo-1" },
  { id: "2", display_name: "Jane Tan", avatar_url: "https://i.pravatar.cc/120?img=47", project_slug: "demo-2" },
  { id: "3", display_name: "Aisha", avatar_url: "https://i.pravatar.cc/120?img=23", project_slug: "demo-3" },
  { id: "4", display_name: "Marcus L.", avatar_url: "https://i.pravatar.cc/120?img=68", project_slug: "demo-4" },
  { id: "5", display_name: "Priya", avatar_url: null, project_slug: "demo-5" },
  { id: "6", display_name: "Wei Ming", avatar_url: "https://i.pravatar.cc/120?img=14", project_slug: "demo-6" },
];

export default function FoundingCohortBannerPreview() {
  // Visible on dev + Vercel PR previews, hidden on production. VERCEL_ENV
  // is set by Vercel to 'preview' for PR previews and 'production' for
  // the live deployment; in local dev it's undefined.
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest font-bold text-[var(--color-ink-subtle)] mb-2">
            Local preview
          </p>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">
            FoundingCohortBanner — mock state (6 creators)
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Rendered with hardcoded creator data. The real component on /
            and /explore self-hides until ≥5 distinct creators have active
            or funded campaigns.
          </p>
        </div>
      </div>

      {/* Banner — JSX copied from FoundingCohortBanner.tsx with mock data */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-full bg-[var(--color-brand-crumb)] dark:bg-[var(--color-brand-crust-dark)]/25 border border-[var(--color-brand-crust)]/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand-crust-dark)] dark:text-[var(--color-brand-golden)]">
                  Our founding cohort
                </p>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {MOCK_CREATORS.length} creators raising right now
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0">
              {MOCK_CREATORS.map((c) => (
                <Link
                  key={c.id}
                  href={`/projects/${c.project_slug}`}
                  className="group flex flex-col items-center gap-1.5 shrink-0"
                  title={`See ${c.display_name}'s campaign`}
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[var(--color-border)] bg-[var(--color-surface)] group-hover:border-[var(--color-brand-crust)] transition-colors">
                    {c.avatar_url ? (
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-[var(--color-ink-muted)] italic">
          ↑ This is what visitors will see on the homepage and /explore once you
          have 5+ creators with active or funded campaigns.
        </p>
      </div>
    </div>
  );
}
