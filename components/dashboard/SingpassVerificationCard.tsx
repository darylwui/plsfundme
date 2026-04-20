import { ShieldCheck } from "lucide-react";

export function SingpassVerificationCard() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-lg">🇸🇬</span>
        <span className="font-bold text-[var(--color-ink)]">Verify your identity with Singpass</span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Coming soon
        </span>
      </div>
      <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
        We&apos;ll soon ask all creators to verify their NRIC through Singpass — it takes under a minute and builds extra trust with your backers. We&apos;ll email you as soon as it&apos;s live, then this card will let you verify in one click.
      </p>
      <button
        type="button"
        disabled
        className="self-start inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-muted)] cursor-not-allowed opacity-60"
      >
        <span>🇸🇬</span>
        Verify with Singpass (Coming soon)
      </button>
    </div>
  );
}

export function SingpassVerifiedBadge() {
  return (
    <span
      title="This creator's identity has been verified through Singpass"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-success)]/10 border border-[var(--color-brand-success)]/30 text-xs font-bold text-[var(--color-brand-success)]"
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      Singpass verified
    </span>
  );
}
