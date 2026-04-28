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

  describe('source: project', () => {
    const baseProject = {
      id: 'proj-1',
      title: 'Sourdough Starter Kit',
      slug: 'sourdough-starter-kit',
      updated_at: '2026-04-25T10:00:00Z', // 2 hours ago
    };

    it('renders the project title', () => {
      render(<DraftContinuationCard source="project" project={baseProject} />);
      expect(screen.getByText('Sourdough Starter Kit')).toBeTruthy();
    });

    it('renders the "Pick up where you left off" header strip', () => {
      render(<DraftContinuationCard source="project" project={baseProject} />);
      expect(screen.getByText(/pick up where you left off/i)).toBeTruthy();
    });

    it('renders "Last saved 2 hours ago"', () => {
      render(<DraftContinuationCard source="project" project={baseProject} />);
      expect(screen.getByText(/last saved 2 hours ago/i)).toBeTruthy();
    });

    it('falls back to "Untitled draft" for empty title', () => {
      render(<DraftContinuationCard source="project" project={{ ...baseProject, title: '' }} />);
      expect(screen.getByText('Untitled draft')).toBeTruthy();
    });

    it('"Continue editing" button links to /projects/[slug]/edit', () => {
      render(<DraftContinuationCard source="project" project={baseProject} />);
      const link = screen.getByRole('link', { name: /continue editing/i });
      expect(link.getAttribute('href')).toBe('/projects/sourdough-starter-kit/edit');
    });

    it('renders a Delete draft button', () => {
      render(<DraftContinuationCard source="project" project={baseProject} />);
      expect(screen.getByRole('button', { name: /delete draft/i })).toBeTruthy();
    });

    it('does not render a step hint', () => {
      render(<DraftContinuationCard source="project" project={baseProject} />);
      expect(screen.queryByText(/step \d of 5/i)).toBeNull();
    });
  });

  describe('source: campaign-draft', () => {
    const baseDraft = {
      title: 'Hawker Cookbook',
      updated_at: '2026-04-25T11:55:00Z', // 5 minutes ago
      step: 3,
    };

    it('renders the wizard draft title', () => {
      render(<DraftContinuationCard source="campaign-draft" draft={baseDraft} />);
      expect(screen.getByText('Hawker Cookbook')).toBeTruthy();
    });

    it('renders "Last saved 5 minutes ago"', () => {
      render(<DraftContinuationCard source="campaign-draft" draft={baseDraft} />);
      expect(screen.getByText(/last saved 5 minutes ago/i)).toBeTruthy();
    });

    it('renders the step hint', () => {
      render(<DraftContinuationCard source="campaign-draft" draft={baseDraft} />);
      expect(screen.getByText('Step 3 of 5')).toBeTruthy();
    });

    it('falls back to "Untitled draft" for empty title', () => {
      render(<DraftContinuationCard source="campaign-draft" draft={{ ...baseDraft, title: '' }} />);
      expect(screen.getByText('Untitled draft')).toBeTruthy();
    });

    it('"Continue editing" button links to /projects/create', () => {
      render(<DraftContinuationCard source="campaign-draft" draft={baseDraft} />);
      const link = screen.getByRole('link', { name: /continue editing/i });
      expect(link.getAttribute('href')).toBe('/projects/create');
    });

    it('renders a Delete draft button', () => {
      render(<DraftContinuationCard source="campaign-draft" draft={baseDraft} />);
      expect(screen.getByRole('button', { name: /delete draft/i })).toBeTruthy();
    });
  });
});
