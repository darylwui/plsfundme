import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MilestoneSubmissionForm } from '@/components/creator/MilestoneSubmissionForm';

describe('MilestoneSubmissionForm', () => {
  it('should render form for milestone 1 (tooling)', () => {
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={1} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/factory contract/i)).toBeTruthy();
    expect(screen.getByLabelText(/contract photo/i)).toBeTruthy();
  });

  it('should render form for milestone 2 (production)', () => {
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={2} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/production timeline letter/i)).toBeTruthy();
    expect(screen.getByLabelText(/factory floor photo/i)).toBeTruthy();
  });

  it('should render form for milestone 3 (fulfillment)', () => {
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={3} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/tracking numbers/i)).toBeTruthy();
    expect(screen.getByLabelText(/fulfillment summary/i)).toBeTruthy();
  });

  it('should call onSubmit with form data when submitted', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={1} onSubmit={mockOnSubmit} />);

    // Fill form fields
    const letterField = screen.getByLabelText(/factory contract/i);
    const photoField = screen.getByLabelText(/contract photo/i);

    fireEvent.change(letterField, {
      target: { value: 'Factory contract text...' },
    });
    fireEvent.change(photoField, {
      target: { value: 'https://example.com/photo.jpg' },
    });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        letter_text: 'Factory contract text...',
        photos_url: 'https://example.com/photo.jpg',
      });
    });
  });

  it('should convert tracking numbers textarea to array for milestone 3', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={3} onSubmit={mockOnSubmit} />);

    // Fill tracking numbers
    const trackingField = screen.getByLabelText(/tracking numbers/i);
    fireEvent.change(trackingField, {
      target: { value: 'DHL123456\nFDX987654\nUPS555555' },
    });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tracking_numbers: ['DHL123456', 'FDX987654', 'UPS555555'],
        })
      );
    });
  });

  it('should display success message after successful submission', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={1} onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/proof submitted/i)).toBeTruthy();
    });
  });

  it('should display error message if submission fails', async () => {
    const mockError = new Error('Submission failed');
    const mockOnSubmit = vi.fn().mockRejectedValue(mockError);
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={1} onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeTruthy();
    });
  });
});
