import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WizardDraftBanner } from '@/components/dashboard/WizardDraftBanner';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('WizardDraftBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseDraft = {
    title: 'Hawker Cookbook',
    step: 3,
    updated_at: '2026-04-25T11:55:00Z', // 5 minutes ago
  };

  it('renders the draft title', () => {
    render(<WizardDraftBanner draft={baseDraft} />);
    expect(screen.getByText(/hawker cookbook/i)).toBeTruthy();
  });

  it('renders "Last saved" + step indicator', () => {
    render(<WizardDraftBanner draft={baseDraft} />);
    expect(screen.getByText(/last saved 5 minutes ago/i)).toBeTruthy();
    expect(screen.getByText(/step 3 of 5/i)).toBeTruthy();
  });

  it('falls back to "Untitled draft" for empty title', () => {
    render(<WizardDraftBanner draft={{ ...baseDraft, title: '' }} />);
    expect(screen.getByText(/continue your draft: untitled draft/i)).toBeTruthy();
  });

  it('"Continue editing" link points to /projects/create', () => {
    render(<WizardDraftBanner draft={baseDraft} />);
    const link = screen.getByRole('link', { name: /continue editing/i });
    expect(link.getAttribute('href')).toBe('/projects/create');
  });

  it('renders a Delete draft button', () => {
    render(<WizardDraftBanner draft={baseDraft} />);
    expect(screen.getByRole('button', { name: /delete draft/i })).toBeTruthy();
  });

  it('omits "Last saved" prefix when relative time is empty (e.g., invalid date)', () => {
    render(<WizardDraftBanner draft={{ ...baseDraft, updated_at: 'not-a-date' }} />);
    expect(screen.queryByText(/last saved/i)).toBeNull();
    expect(screen.getByText(/step 3 of 5/i)).toBeTruthy();
  });
});
