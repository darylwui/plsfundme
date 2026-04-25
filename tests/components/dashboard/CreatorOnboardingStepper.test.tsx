import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreatorOnboardingStepper } from '@/components/dashboard/CreatorOnboardingStepper';

describe('CreatorOnboardingStepper', () => {
  it('renders the card heading and subtitle', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    expect(screen.getByText('Get your first campaign live')).toBeTruthy();
    expect(screen.getByText('Four quick steps from approved to launched.')).toBeTruthy();
  });

  it('renders all 4 step titles', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    expect(screen.getByText('Application approved')).toBeTruthy();
    expect(screen.getByText('Verify identity with Singpass')).toBeTruthy();
    expect(screen.getByText('Run through the launch checklist')).toBeTruthy();
    expect(screen.getByText('Launch your first campaign')).toBeTruthy();
  });

  it('shows "Coming soon" pill on step 2 when singpassVerified is false', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    expect(screen.getByText('Coming soon')).toBeTruthy();
  });

  it('hides "Coming soon" pill on step 2 when singpassVerified is true', () => {
    render(<CreatorOnboardingStepper singpassVerified={true} />);
    expect(screen.queryByText('Coming soon')).toBeNull();
  });

  it('step 3 link points to /for-creators/launch-guide', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    const link = screen.getByRole('link', { name: /open guide/i });
    expect(link.getAttribute('href')).toBe('/for-creators/launch-guide');
  });

  it('step 4 CTA points to /projects/create', () => {
    render(<CreatorOnboardingStepper singpassVerified={false} />);
    const link = screen.getByRole('link', { name: /start a project/i });
    expect(link.getAttribute('href')).toBe('/projects/create');
  });
});
