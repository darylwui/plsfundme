import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DisputeConcernQueue, type ConcernRow } from "@/components/admin/DisputeConcernQueue";
import { CampaignReportQueue, type ReportRow } from "@/components/admin/CampaignReportQueue";

export const metadata = { title: "Queue — Admin" };

// Single-page admin triage for the two filed-by-user tables. Open items first
// (default view), with a query toggle to show closed too. Layout is two
// stacked sections rather than tabs because pre-launch volume is low and an
// empty state for one type would just look like a broken tab.

export default async function DashboardAdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { closed } = await searchParams;
  const showClosed = closed === "1";

  const concernStatuses = showClosed
    ? ["open", "responded", "dismissed", "escalated"]
    : ["open", "responded"];
  const reportStatuses = showClosed
    ? ["open", "reviewing", "dismissed", "action_taken"]
    : ["open", "reviewing"];

  const [{ data: concernsRaw }, { data: reportsRaw }] = await Promise.all([
    supabase
      .from("dispute_concerns")
      .select(
        "id, pledge_id, milestone_number, message, status, admin_notes, created_at, project:projects(id, title, slug), backer:profiles!backer_id(id, display_name)",
      )
      .in("status", concernStatuses)
      .order("created_at", { ascending: true }),
    supabase
      .from("campaign_reports")
      .select(
        "id, category, message, status, admin_notes, created_at, project:projects(id, title, slug), reporter:profiles!reporter_id(id, display_name)",
      )
      .in("status", reportStatuses)
      .order("created_at", { ascending: true }),
  ]);

  const concerns = (concernsRaw ?? []) as unknown as ConcernRow[];
  const reports = (reportsRaw ?? []) as unknown as ReportRow[];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Queue</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Triage backer concerns (Stage 1 dispute filings) and abuse reports on live campaigns.
          </p>
        </div>
        <a
          href={showClosed ? "/dashboard/admin/queue" : "/dashboard/admin/queue?closed=1"}
          className="text-sm font-semibold text-[var(--color-brand-crust)] hover:underline shrink-0"
        >
          {showClosed ? "← Show open only" : "Show closed →"}
        </a>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-black text-[var(--color-ink)]">
            Backer concerns
          </h2>
          <span className="text-sm text-[var(--color-ink-muted)] font-mono">
            {concerns.length}
          </span>
        </div>
        {concerns.length === 0 ? (
          <EmptyState>
            {showClosed
              ? "No backer concerns on file."
              : "No open concerns. Backers haven't flagged anything that needs review."}
          </EmptyState>
        ) : (
          <DisputeConcernQueue items={concerns} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-black text-[var(--color-ink)]">
            Campaign reports
          </h2>
          <span className="text-sm text-[var(--color-ink-muted)] font-mono">
            {reports.length}
          </span>
        </div>
        {reports.length === 0 ? (
          <EmptyState>
            {showClosed
              ? "No campaign reports on file."
              : "No open reports. No one has flagged a campaign for fraud, IP, or abuse."}
          </EmptyState>
        ) : (
          <CampaignReportQueue items={reports} />
        )}
      </section>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)] px-5 py-8 text-center text-sm text-[var(--color-ink-muted)]">
      {children}
    </div>
  );
}
