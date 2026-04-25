import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from '../dates';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string for null input', () => {
    expect(formatRelativeTime(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('returns empty string for invalid input', () => {
    expect(formatRelativeTime('not-a-date')).toBe('');
  });

  it('returns "just now" for under 60 seconds', () => {
    expect(formatRelativeTime('2026-04-25T11:59:30Z')).toBe('just now');
  });

  it('returns "just now" for future dates (clock skew)', () => {
    expect(formatRelativeTime('2026-04-25T12:05:00Z')).toBe('just now');
  });

  it('returns "1 minute ago" for exactly 1 minute', () => {
    expect(formatRelativeTime('2026-04-25T11:59:00Z')).toBe('1 minute ago');
  });

  it('returns "5 minutes ago" for 5 minutes', () => {
    expect(formatRelativeTime('2026-04-25T11:55:00Z')).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" for exactly 1 hour', () => {
    expect(formatRelativeTime('2026-04-25T11:00:00Z')).toBe('1 hour ago');
  });

  it('returns "3 hours ago" for 3 hours', () => {
    expect(formatRelativeTime('2026-04-25T09:00:00Z')).toBe('3 hours ago');
  });

  it('returns "1 day ago" for exactly 1 day', () => {
    expect(formatRelativeTime('2026-04-24T12:00:00Z')).toBe('1 day ago');
  });

  it('returns "3 days ago" for 3 days', () => {
    expect(formatRelativeTime('2026-04-22T12:00:00Z')).toBe('3 days ago');
  });

  it('falls back to absolute date format for 7+ days ago', () => {
    // Existing formatDate uses en-SG locale: "18 April 2026"
    expect(formatRelativeTime('2026-04-18T12:00:00Z')).toBe('18 April 2026');
  });
});
