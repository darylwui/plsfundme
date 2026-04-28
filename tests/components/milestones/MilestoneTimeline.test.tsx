import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestoneTimeline } from '@/components/milestones/MilestoneTimeline';
import type { ResolvedMilestone } from '@/lib/milestones/backer-view';

const baseMilestones: ResolvedMilestone[] = [
  {
    number: 1,
    title: 'Production tooling',
    description: 'Secure factory and tooling',
    target_date: '2026-05-15',
    state: 'approved',
    submitted_at: '2026-05-10',
    approved_at: '2026-05-15',
    escrow_released_sgd: 4000,
  },
  {
    number: 2,
    title: 'Production run',
    description: 'Manufacture units',
    target_date: '2026-06-30',
    state: 'under_review',
    submitted_at: '2026-06-28',
  },
  {
    number: 3,
    title: 'Fulfillment',
    description: 'Ship rewards',
    target_date: '2026-08-15',
    state: 'upcoming',
  },
];

describe('MilestoneTimeline', () => {
  it('renders the section heading', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Milestones')).toBeTruthy();
  });

  it('renders all 3 milestone titles', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Production tooling')).toBeTruthy();
    expect(screen.getByText('Production run')).toBeTruthy();
    expect(screen.getByText('Fulfillment')).toBeTruthy();
  });

  it('shows "Approved" pill and escrow amount for approved milestones', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Approved')).toBeTruthy();
    // Match both jsdom's "$4,000" and real-browser "S$4,000" (Node ICU vs browser ICU)
    expect(screen.getByText(/\$4,?000 released/)).toBeTruthy();
  });

  it('shows "Under review" pill and submitted date for under_review milestones', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Under review')).toBeTruthy();
    expect(screen.getByText(/Submitted/)).toBeTruthy();
  });

  it('shows "Upcoming" pill and "Due" date for upcoming milestones', () => {
    render(<MilestoneTimeline milestones={baseMilestones} />);
    expect(screen.getByText('Upcoming')).toBeTruthy();
    expect(screen.getByText(/Due/)).toBeTruthy();
  });

  it('shows "Late" pill and "Late by N days" copy for late milestones', () => {
    const late: ResolvedMilestone[] = [
      { ...baseMilestones[0], state: 'late', late_by_days: 7, approved_at: undefined, submitted_at: undefined, escrow_released_sgd: undefined },
      baseMilestones[1],
      baseMilestones[2],
    ];
    render(<MilestoneTimeline milestones={late} />);
    expect(screen.getByText('Late')).toBeTruthy();
    expect(screen.getByText(/Late by 7 days/)).toBeTruthy();
    expect(screen.getByText(/Disputes auto-open at 45 days/)).toBeTruthy();
  });

  it('renders the dispute banner when hasOpenDispute is true', () => {
    render(<MilestoneTimeline milestones={baseMilestones} hasOpenDispute={true} />);
    expect(screen.getByText(/open dispute/i)).toBeTruthy();
  });

  it('does not render the dispute banner when hasOpenDispute is false', () => {
    render(<MilestoneTimeline milestones={baseMilestones} hasOpenDispute={false} />);
    expect(screen.queryByText(/open dispute/i)).toBeNull();
  });

  it('renders nothing visible when milestones is empty', () => {
    const { container } = render(<MilestoneTimeline milestones={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
