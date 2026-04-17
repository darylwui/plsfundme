/** Return days remaining until a deadline (0 if past) */
export function daysRemaining(deadline: string | Date): number {
  const now = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/** Return true if a campaign deadline has passed */
export function isExpired(deadline: string | Date): boolean {
  return new Date(deadline) <= new Date()
}

/** Format a date for display e.g. "15 May 2025". Returns empty string for invalid input. */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** Format a date as short e.g. "15 May". Returns empty string for invalid input. */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
  }).format(d)
}
