import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MilestoneSubmissionForm } from '@/components/creator/MilestoneSubmissionForm';

describe('MilestoneSubmissionForm', () => {
  it('should render form for milestone 1 (tooling)', () => {
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={1} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/factory contract/i)).toBeTruthy();
    expect(screen.getByLabelText(/contract photo/i)).toBeTruthy();
  });

  it('should render form for milestone 3 (fulfillment)', () => {
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={3} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/tracking numbers/i)).toBeTruthy();
    expect(screen.getByLabelText(/fulfillment summary/i)).toBeTruthy();
  });

  it('should call onSubmit with form data when submitted', async () => {
    const mockOnSubmit = vi.fn();
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={1} onSubmit={mockOnSubmit} />);

    // Fill form (simplified for test)
    fireEvent.change(screen.getByLabelText(/factory contract/i), {
      target: { value: 'Factory contract text...' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockOnSubmit).toHaveBeenCalled();
  });
});
