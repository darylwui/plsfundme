interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className = "" }: DividerProps) {
  if (!label) {
    return (
      <hr className={`border-[var(--color-border)] ${className}`} />
    );
  }
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <hr className="flex-1 border-[var(--color-border)]" />
      <span className="text-xs text-[var(--color-ink-subtle)] font-medium">
        {label}
      </span>
      <hr className="flex-1 border-[var(--color-border)]" />
    </div>
  );
}
