import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteDraftButton } from '@/components/dashboard/DeleteDraftButton';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe('DeleteDraftButton', () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    vi.restoreAllMocks();
  });

  it('renders a "Delete draft" button', () => {
    render(<DeleteDraftButton source="project" projectId="proj-1" />);
    expect(screen.getByRole('button', { name: /delete draft/i })).toBeTruthy();
  });

  it('shows confirm dialog with the right copy on click', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DeleteDraftButton source="project" projectId="proj-1" />);

    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    expect(confirmSpy).toHaveBeenCalledWith('Delete this draft? This cannot be undone.');
  });

  it('does nothing when user dismisses the confirm dialog', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fetchSpy = vi.spyOn(global, 'fetch');

    render(<DeleteDraftButton source="project" projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('calls POST /api/projects/[id]/delete when source is project', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    render(<DeleteDraftButton source="project" projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/projects/proj-1/delete', { method: 'POST' });
    });
  });

  it('calls POST /api/campaign-drafts/delete when source is campaign-draft', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    render(<DeleteDraftButton source="campaign-draft" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/campaign-drafts/delete', { method: 'POST' });
    });
  });

  it('calls router.refresh() on success', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

    render(<DeleteDraftButton source="project" projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows "Deleting…" while pending', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((r) => {
      resolveFetch = r;
    });
    vi.spyOn(global, 'fetch').mockReturnValue(fetchPromise);

    render(<DeleteDraftButton source="project" projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deleting/i })).toBeTruthy();
    });

    resolveFetch!(new Response(null, { status: 200 }));
  });

  it('shows error message on non-ok response', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    render(<DeleteDraftButton source="project" projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't delete draft/i)).toBeTruthy();
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('shows error message on fetch throw', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

    render(<DeleteDraftButton source="project" projectId="proj-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't delete draft/i)).toBeTruthy();
    });
  });
});
