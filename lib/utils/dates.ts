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

/** Format a date for display e.g. "15 May 2025" */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

/** Format a date as short e.g. "15 May" */
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
}
