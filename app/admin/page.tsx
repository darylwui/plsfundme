import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: pendingKyc }, { count: activeProjects }, { count: totalPledges }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("kyc_status", "pending"),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("pledges").select("*", { count: "exact", head: true }).in("status", ["authorized", "paynow_captured", "captured"]),
    ]);

  const stats = [
    { label: "Pending KYC", value: pendingKyc ?? 0, emoji: "⏳", href: "/admin/kyc" },
    { label: "Active campaigns", value: activeProjects ?? 0, emoji: "🚀", href: "/explore" },
    { label: "Total pledges", value: totalPledges ?? 0, emoji: "💳", href: "/admin" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black text-[var(--color-ink)]">Admin overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, emoji }) => (
          <div
            key={label}
            className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6"
          >
            <div className="text-3xl mb-2">{emoji}</div>
            <p className="text-3xl font-black text-[var(--color-ink)]">{value}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
