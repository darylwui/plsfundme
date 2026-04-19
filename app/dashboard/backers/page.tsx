import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSgd } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { PledgeWithBacker } from "@/types/pledge";

export const metadata = { title: "Backers" };

export default async function DashboardBackersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get all projects by this creator
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, slug, status")
    .eq("creator_id", user!.id)
    .order("created_at", { ascending: false });

  // Get all pledges across all creator projects
  const projectIds = (projects ?? []).map((p) => p.id);

  let pledges: PledgeWithBacker[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("pledges")
      .select("*, backer:profiles!backer_id(id, display_name, avatar_url)")
      .in("project_id", projectIds)
      .in("status", ["authorized", "paynow_captured", "captured"])
      .order("created_at", { ascending: false })
      .limit(100);
    pledges = (data as unknown as PledgeWithBacker[]) ?? [];
  }

  // Total raised across all projects
  const totalRaised = pledges.reduce((sum, p) => sum + p.amount_sgd, 0);

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-black text-[var(--color-ink)]">Backers</h1>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-16 flex flex-col items-center text-center gap-4">
          <div className="text-5xl">🫂</div>
          <div>
            <h2 className="text-xl font-black text-[var(--color-ink)]">
              No backers yet
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-sm">
              Launch a campaign first to start attracting backers who believe in
              your idea.
            </p>
          </div>
          <Link href="/projects/create">
            <Button size="lg">
              <PlusCircle className="w-4 h-4" />
              Start a campaign
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--color-ink)]">Backers</h1>
        {pledges.length > 0 && (
          <div className="text-sm text-[var(--color-ink-muted)]">
            <span className="font-bold text-[var(--color-ink)]">{pledges.length}</span> total pledges ·{" "}
            <span className="font-bold text-[var(--color-brand-crust)]">{formatSgd(totalRaised)}</span> raised
          </div>
        )}
      </div>

      {pledges.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-16 flex flex-col items-center text-center gap-4">
          <div className="text-5xl">🫂</div>
          <div>
            <h2 className="text-xl font-black text-[var(--color-ink)]">
              No backers yet
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-sm">
              Share your campaign to attract your first backers!
            </p>
          </div>
          <div className="flex gap-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.slug}`}>
                <Button variant="secondary" size="sm">
                  View {p.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-overlay)] border-b border-[var(--color-border)]">
              <tr>
                {["Backer", "Campaign", "Amount", "Method", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {pledges.map((pledge) => {
                const project = projects.find((p) => p.id === pledge.project_id);
                return (
                  <tr key={pledge.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] transition-colors">
                    <td className="px-4 py-3">
                      {pledge.is_anonymous || !pledge.backer ? (
                        <span className="text-[var(--color-ink-subtle)] italic">Anonymous</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[var(--color-brand-crust)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-brand-crust)] shrink-0">
                            {pledge.backer.display_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[var(--color-ink)]">
                            {pledge.backer.display_name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {project && (
                        <Link href={`/projects/${project.slug}`} className="text-[var(--color-brand-crust)] hover:underline font-medium">
                          {project.title}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--color-ink)]">
                      {formatSgd(pledge.amount_sgd)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        pledge.payment_method === "paynow"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-violet-100 text-violet-700"
                      }`}>
                        {pledge.payment_method === "paynow" ? "PayNow" : "Card"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={pledge.status === "captured" || pledge.status === "paynow_captured" ? "lime" : "violet"}>
                        {pledge.status === "captured" || pledge.status === "paynow_captured" ? "Charged" : "Authorised"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                      {formatDate(pledge.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
