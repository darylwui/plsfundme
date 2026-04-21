import {
  Check,
  RefreshCw,
  Shield,
  TrendingUp,
  XCircle,
  Lock,
} from "lucide-react";

export function AllOrNothingSplit() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Success path */}
      <div className="relative p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-gradient-to-br from-[var(--color-brand-golden)]/50 to-[var(--color-brand-crust)]/50">
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 h-full flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-golden)]/10 text-[var(--color-brand-golden)] text-xs font-bold uppercase tracking-wider w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            Goal reached
          </div>
          <h3 className="mt-4 text-xl font-black text-[var(--color-ink)]">
            Campaign hits its goal
          </h3>
          <div className="mt-5 flex flex-col gap-3 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-golden)]/15 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-golden)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">You&apos;re charged</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Card holds capture · PayNow was already collected
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-golden)]/15 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-golden)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Creator gets funded</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Funds released within 7–10 business days, minus 5% fee
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-golden)]/15 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-golden)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Rewards ship</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Creator keeps you posted on delivery timelines
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Miss path */}
      <div className="relative p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]">
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-6 h-full flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-[var(--color-ink-muted)] text-xs font-bold uppercase tracking-wider w-fit">
            <XCircle className="w-3.5 h-3.5" />
            Goal missed
          </div>
          <h3 className="mt-4 text-xl font-black text-[var(--color-ink)]">
            Campaign doesn&apos;t hit its goal
          </h3>
          <div className="mt-5 flex flex-col gap-3 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 text-[var(--color-brand-crust)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">You pay nothing</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Card holds released automatically
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <RefreshCw className="w-3.5 h-3.5 text-[var(--color-brand-crust)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">PayNow refunded</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Full refund within 5–7 business days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-[var(--color-brand-crust)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">Zero risk</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Creator receives nothing — no hidden fees, no fine print
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
