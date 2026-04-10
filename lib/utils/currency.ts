/** Format a number as SGD currency string e.g. S$1,234.56 */
export function formatSgd(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format SGD with cents */
export function formatSgdCents(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Get funding percentage (capped at 100 for display) */
export function fundingPercent(pledged: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(Math.round((pledged / goal) * 100), 100)
}

/** Get raw funding percentage (can exceed 100) */
export function fundingPercentRaw(pledged: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.round((pledged / goal) * 100)
}
