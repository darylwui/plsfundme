const COMPARISON_ROWS: ReadonlyArray<readonly [string, string, string]> = [
  ["Funding model", "All-or-nothing", "All-or-nothing or flexible"],
  ["Milestone escrow", "Yes — funds release as you ship", "Lump sum on close"],
  ["Platform fee", "5% (processing included)", "5% + ~3% processing"],
  ["Local payment (PayNow)", "Yes", "No"],
  ["Singapore creator support", "Singapore-based humans, business hours", "Email queue, US/EU hours"],
  ["Refund on missed milestones", "Auto at 45 days overdue", "Backer files dispute manually"],
];

export function PlatformComparisonTable() {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[var(--color-ink)]">
            <th className="text-left py-3.5 px-3 sm:px-4 font-bold w-2/5 text-[var(--color-ink-muted)]" />
            <th className="text-left py-3.5 px-3 sm:px-4 font-bold text-[var(--color-brand-crust)]">
              get that bread
            </th>
            <th className="text-left py-3.5 px-3 sm:px-4 font-bold text-[var(--color-ink)]">
              Other platforms
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map(([label, ours, theirs]) => (
            <tr key={label} className="border-b border-[var(--color-border)]">
              <td className="py-3.5 px-3 sm:px-4 font-semibold text-[var(--color-ink)] align-top leading-[1.5]">
                {label}
              </td>
              <td className="py-3.5 px-3 sm:px-4 font-semibold text-[var(--color-ink)] bg-[var(--color-brand-crust)]/8 dark:bg-[var(--color-brand-crust)]/15 align-top leading-[1.5]">
                {ours}
              </td>
              <td className="py-3.5 px-3 sm:px-4 text-[var(--color-ink-muted)] align-top leading-[1.5]">
                {theirs}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
