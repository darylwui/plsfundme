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

/**
 * Format a date as a relative time string for "Last saved X ago" copy.
 *
 * Returns:
 * - empty string for invalid input
 * - "just now" for < 60s (or future dates from clock skew)
 * - "N minute(s) ago" for < 1h
 * - "N hour(s) ago" for < 24h
 * - "N day(s) ago" for < 7d
 * - falls back to formatDate(date) for >= 7d (e.g., "18 April 2026")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const then = new Date(date)
  if (Number.isNaN(then.getTime())) return ''

  const diffMs = Math.max(0, Date.now() - then.getTime())
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`
  }

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`
  }

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`
  }

  return formatDate(then)
}
