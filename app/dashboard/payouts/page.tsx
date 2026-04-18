import { createClient } from "@/lib/supabase/server";
import { StripeConnectButton } from "@/components/dashboard/StripeConnectButton";
import { formatSgd } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";

interface PayoutsPageProps {
  searchParams: Promise<{ connected?: string; refresh?: string }>;
}

export default async function PayoutsPage({ searchParams }: PayoutsPageProps) {
  const { connected } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user!.id)
    .single();

  const { data: payouts } = await supabase
    .from("payouts")
    .select("*, project:projects!project_id(title, slug)")
    .eq("creator_id", user!.id)
    .order("created_at", { ascending: false });

  const isConnected = !!profile?.stripe_account_id;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black text-[var(--color-ink)]">Payouts</h1>

      {connected === "1" && (
        <div className="rounded-[var(--radius-card)] bg-lime-50 dark:bg-lime-900/20 border border-lime-200 p-4 text-sm text-lime-800 dark:text-lime-200 font-semibold">
          ✅ Stripe account connected successfully!
        </div>
      )}

      {/* Connect Stripe */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6">
        <h2 className="font-bold text-[var(--color-ink)] mb-1">Stripe Connect</h2>
        <p className="text-sm text-[var(--color-ink-muted)] mb-4">
          {isConnected
            ? "Your Stripe account is connected. Payouts will be sent here when campaigns are funded."
            : "Connect your Stripe account to receive payouts when your campaigns are funded."}
        </p>
        <StripeConnectButton isConnected={isConnected} />
      </div>

      {/* Payout history */}
      <div>
        <h2 className="font-bold text-[var(--color-ink)] mb-4">Payout history</h2>
        {!payouts || payouts.length === 0 ? (
          <div className="text-center py-10 text-[var(--color-ink-muted)] text-sm">
            No payouts yet — they&apos;ll appear here when your campaigns are funded.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-overlay)] border-b border-[var(--color-border)]">
                <tr>
                  {["Campaign", "Amount", "Fee", "Net", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {payouts.map((p: any) => (
                  <tr key={p.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)]">
                    <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{p.project?.title}</td>
                    <td className="px-4 py-3">{formatSgd(p.amount_sgd)}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">-{formatSgd(p.platform_fee_sgd)}</td>
                    <td className="px-4 py-3 font-bold text-[var(--color-brand-success)]">{formatSgd(p.net_amount_sgd)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === "paid" ? "bg-lime-100 text-lime-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
