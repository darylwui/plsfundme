import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestoneSummary } from '@/components/milestones/MilestoneSummary';
import type { ResolvedMilestone } from '@/lib/milestones/backer-view';

const oneApproved: ResolvedMilestone[] = [
  { number: 1, title: 'M1', description: '', target_date: '2026-05-15', state: 'approved', approved_at: '2026-05-15', escrow_released_sgd: 4000 },
  { number: 2, title: 'M2', description: '', target_date: '2026-06-30', state: 'upcoming' },
  { number: 3, title: 'M3', description: '', target_date: '2026-08-15', state: 'upcoming' },
];

const noneApproved: ResolvedMilestone[] = [
  { number: 1, title: 'M1', description: '', target_date: '2026-05-15', state: 'upcoming' },
  { number: 2, title: 'M2', description: '', target_date: '2026-06-30', state: 'upcoming' },
  { number: 3, title: 'M3', description: '', target_date: '2026-08-15', state: 'upcoming' },
];

const m2Late: ResolvedMilestone[] = [
  { number: 1, title: 'M1', description: '', target_date: '2026-05-15', state: 'approved', approved_at: '2026-05-15', escrow_released_sgd: 4000 },
  { number: 2, title: 'M2', description: '', target_date: '2026-06-30', state: 'late', late_by_days: 5 },
  { number: 3, title: 'M3', description: '', target_date: '2026-08-15', state: 'upcoming' },
];

describe('MilestoneSummary', () => {
  it('shows "1 of 3 approved · S$4,000 released" when one milestone is approved', () => {
    render(<MilestoneSummary milestones={oneApproved} />);
    expect(screen.getByText(/1 of 3 milestones approved/i)).toBeTruthy();
    // Match both jsdom's "$4,000" and real-browser "S$4,000" (Node ICU vs browser ICU)
    expect(screen.getByText(/\$4,?000 released/)).toBeTruthy();
  });

  it('shows "0 of 3 approved" with no dollar suffix when none are approved', () => {
    render(<MilestoneSummary milestones={noneApproved} />);
    expect(screen.getByText(/0 of 3 milestones approved/i)).toBeTruthy();
    expect(screen.queryByText(/released/)).toBeNull();
  });

  it('shows "Milestone 2 late by 5 days" when M2 is late (overrides the default summary)', () => {
    render(<MilestoneSummary milestones={m2Late} />);
    expect(screen.getByText(/Milestone 2 late by 5 days/i)).toBeTruthy();
    expect(screen.queryByText(/of 3 milestones approved/i)).toBeNull();
  });

  it('shows "Open dispute — under investigation" when hasOpenDispute is true (overrides everything)', () => {
    render(<MilestoneSummary milestones={oneApproved} hasOpenDispute={true} />);
    expect(screen.getByText(/open dispute — under investigation/i)).toBeTruthy();
    expect(screen.queryByText(/of 3 milestones approved/i)).toBeNull();
  });

  it('renders nothing when milestones is empty', () => {
    const { container } = render(<MilestoneSummary milestones={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 3 segment elements (one per milestone)', () => {
    const { container } = render(<MilestoneSummary milestones={oneApproved} />);
    const segments = container.querySelectorAll('[data-milestone-segment]');
    expect(segments.length).toBe(3);
  });
});
