import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraftContinuationCard } from '@/components/dashboard/DraftContinuationCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('DraftContinuationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseProject = {
    id: 'proj-1',
    title: 'Sourdough Starter Kit',
    slug: 'sourdough-starter-kit',
    updated_at: '2026-04-25T10:00:00Z', // 2 hours ago
  };

  it('renders the project title', () => {
    render(<DraftContinuationCard project={baseProject} />);
    expect(screen.getByText('Sourdough Starter Kit')).toBeTruthy();
  });

  it('renders the "Pick up where you left off" header strip', () => {
    render(<DraftContinuationCard project={baseProject} />);
    expect(screen.getByText(/pick up where you left off/i)).toBeTruthy();
  });

  it('renders "Last saved 2 hours ago"', () => {
    render(<DraftContinuationCard project={baseProject} />);
    expect(screen.getByText(/last saved 2 hours ago/i)).toBeTruthy();
  });

  it('falls back to "Untitled draft" for empty title', () => {
    render(<DraftContinuationCard project={{ ...baseProject, title: '' }} />);
    expect(screen.getByText('Untitled draft')).toBeTruthy();
  });

  it('"Continue editing" button links to /projects/[slug]/edit', () => {
    render(<DraftContinuationCard project={baseProject} />);
    const link = screen.getByRole('link', { name: /continue editing/i });
    expect(link.getAttribute('href')).toBe('/projects/sourdough-starter-kit/edit');
  });

  it('renders a Delete draft button', () => {
    render(<DraftContinuationCard project={baseProject} />);
    expect(screen.getByRole('button', { name: /delete draft/i })).toBeTruthy();
  });
});
