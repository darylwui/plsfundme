import { SingpassIcon } from "@/components/icons/SingpassIcon";

export function SingpassVerifiedBadge() {
  return (
    <span
      title="This creator's identity has been verified through Singpass"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-success)]/10 border border-[var(--color-brand-success)]/30 text-xs font-bold text-[var(--color-brand-success)]"
    >
      <SingpassIcon className="w-3.5 h-3.5" />
      Singpass verified
    </span>
  );
}
