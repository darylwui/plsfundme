"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSgd } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { PledgeWithBacker } from "@/types/pledge";

interface BackerTableProps {
  projectId: string;
  initialPledges: PledgeWithBacker[];
}

export function BackerTable({ projectId, initialPledges }: BackerTableProps) {
  const [pledges, setPledges] = useState<PledgeWithBacker[]>(initialPledges);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`pledges:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pledges",
          filter: `project_id=eq.${projectId}`,
        },
        async () => {
          // Refetch pledge list on new pledge
          const { data } = await supabase
            .from("pledges")
            .select(
              "*, backer:profiles!backer_id(id, display_name, avatar_url)"
            )
            .eq("project_id", projectId)
            .in("status", ["authorized", "paynow_captured", "captured"])
            .order("created_at", { ascending: false })
            .limit(50);

          if (data) setPledges(data as unknown as PledgeWithBacker[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (pledges.length === 0) {
    return (
      <div className="text-center py-10 text-[var(--color-ink-muted)] text-sm">
        No backers yet — share your campaign to get the first pledge!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-surface-overlay)] border-b border-[var(--color-border)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Backer
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Method
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {pledges.map((pledge) => (
            <tr
              key={pledge.id}
              className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <td className="px-4 py-3">
                {pledge.is_anonymous || !pledge.backer ? (
                  <span className="text-[var(--color-ink-subtle)] italic">
                    Anonymous
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-brand-violet)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-brand-violet)] shrink-0">
                      {pledge.backer.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-[var(--color-ink)]">
                      {pledge.backer.display_name}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-bold text-[var(--color-ink)]">
                {formatSgd(pledge.amount_sgd)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    pledge.payment_method === "paynow"
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                  }`}
                >
                  {pledge.payment_method === "paynow" ? "PayNow" : "Card"}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                {formatDate(pledge.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
