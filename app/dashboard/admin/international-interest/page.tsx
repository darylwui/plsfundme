import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/dates";

export const metadata = { title: "International interest — Admin" };

interface Row {
  id: string;
  email: string;
  display_name: string;
  country: string;
  project_description: string | null;
  referrer: string | null;
  created_at: string;
  contacted_at: string | null;
}

export default async function InternationalInterestAdminPage() {
  // Auth gate — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/dashboard");

  // Read via service-role client — the table has no public RLS policies
  // by design (waitlist is admin-only).
  //
  // Cast to any: this table is added in migration 026; the generated
  // database.types.ts will include it on the next regen. Pattern matches
  // other dashboard pages that touch newly-added tables.
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (service as any)
    .from("international_creator_interest")
    .select("id, email, display_name, country, project_description, referrer, created_at, contacted_at")
    .order("created_at", { ascending: false }) as { data: Row[] | null };

  const list = rows ?? [];
  const uncontactedCount = list.filter((r) => !r.contacted_at).length;

  // Group by country for the summary strip
  const byCountry = list.reduce<Record<string, number>>((acc, r) => {
    acc[r.country] = (acc[r.country] ?? 0) + 1;
    return acc;
  }, {});
  const topCountries = Object.entries(byCountry)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--color-ink)]">
          International creator interest
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Waitlist for non-Singapore creators who landed on{" "}
          <code className="text-xs">/for-creators/international</code> and
          submitted interest. Use this when planning which market to open
          next.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total signups" value={String(list.length)} />
        <Stat label="Not yet contacted" value={String(uncontactedCount)} />
        <Stat label="Countries" value={String(Object.keys(byCountry).length)} />
        <Stat
          label="Top market"
          value={topCountries[0]?.[0] ?? "—"}
          sub={topCountries[0]?.[1] ? `${topCountries[0][1]} signups` : undefined}
        />
      </div>

      {/* By-country breakdown */}
      {topCountries.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)] mb-3">
            Top countries
          </p>
          <div className="flex flex-wrap gap-2">
            {topCountries.map(([country, count]) => (
              <div
                key={country}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-sm"
              >
                <span className="font-medium text-[var(--color-ink)]">{country}</span>
                <span className="font-mono text-xs text-[var(--color-ink-subtle)]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {list.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-ink-muted)]">
          No signups yet. Once people start submitting at{" "}
          <code className="text-xs">/for-creators/international</code> they&apos;ll
          appear here.
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Referrer</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--color-surface-raised)]">
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-subtle)] whitespace-nowrap">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                    {r.display_name}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">{r.country}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${r.email}`}
                      className="text-[var(--color-brand-crust)] hover:underline break-all"
                    >
                      {r.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-muted)] max-w-xs">
                    {r.project_description ? (
                      <span className="line-clamp-2">{r.project_description}</span>
                    ) : (
                      <span className="text-[var(--color-ink-subtle)] italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-subtle)] max-w-[180px] truncate">
                    {r.referrer ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.contacted_at ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-brand-success)]/15 text-[var(--color-brand-success)]">
                        Contacted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                        New
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <p className="text-2xl font-black text-[var(--color-ink)] mt-1">{value}</p>
      {sub && <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">{sub}</p>}
    </div>
  );
}
