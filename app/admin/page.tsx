import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: pendingProjects }, { count: activeProjects }, { count: totalPledges }, { count: totalUsers }] =
    await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("pledges").select("*", { count: "exact", head: true }).in("status", ["authorized", "paynow_captured", "captured"]),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Pending review", value: pendingProjects ?? 0, emoji: "⏳", href: "/admin/projects" },
    { label: "Active campaigns", value: activeProjects ?? 0, emoji: "🚀", href: "/admin/projects" },
    { label: "Total pledges", value: totalPledges ?? 0, emoji: "💳", href: "/admin/projects" },
    { label: "Total users", value: totalUsers ?? 0, emoji: "👥", href: "/admin/users" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black text-[var(--color-ink)]">Admin overview</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, emoji, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-brand-violet)]/30 transition-all"
          >
            <div className="text-3xl mb-2">{emoji}</div>
            <p className="text-3xl font-black text-[var(--color-ink)]">{value}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
