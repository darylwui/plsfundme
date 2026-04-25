import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg_test' }, error: null });

vi.mock('@/lib/email/resend', () => ({
  FROM: 'noreply@getthatbread.sg',
  REPLY_TO: 'hello@getthatbread.sg',
  ADMIN_EMAIL: 'hello@getthatbread.sg',
  getResend: () => ({ emails: { send: mockSend } }),
}));

import { sendCampaignFailedToBackerEmail } from '@/lib/email/templates';

describe('sendCampaignFailedToBackerEmail', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  it('sends an email with project title and "no charge" copy', async () => {
    await sendCampaignFailedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      projectTitle: 'Sourdough Starter Kit',
      deadline: '2026-05-01T00:00:00Z',
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe('backer@example.com');
    expect(payload.subject).toContain('Sourdough Starter Kit');
    expect(payload.html).toContain('Sam');
    expect(payload.html).toContain('Sourdough Starter Kit');
    expect(payload.html).toMatch(/no.*charge|never.*charged|card.*not.*charged/i);
    expect(payload.html).toContain('/explore');
  });

  it('includes Reply-To via the centralized helper', async () => {
    await sendCampaignFailedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      projectTitle: 'Test',
      deadline: '2026-05-01T00:00:00Z',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.replyTo).toBe('hello@getthatbread.sg');
  });

  it('escapes HTML in projectTitle', async () => {
    await sendCampaignFailedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      projectTitle: '<script>alert(1)</script>',
      deadline: '2026-05-01T00:00:00Z',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).not.toContain('<script>');
    expect(payload.html).toMatch(/&lt;script&gt;/);
  });
});

import { sendMilestoneApprovedToBackerEmail } from '@/lib/email/templates';

describe('sendMilestoneApprovedToBackerEmail', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  it('sends an email with all milestone context', async () => {
    await sendMilestoneApprovedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      creatorName: 'Jamie',
      projectTitle: 'Sourdough Starter Kit',
      projectSlug: 'sourdough-starter-kit',
      milestoneNumber: 1,
      escrowReleasedSgd: 4000,
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe('backer@example.com');
    expect(payload.subject).toContain('Milestone 1');
    expect(payload.subject).toContain('Sourdough Starter Kit');
    expect(payload.html).toContain('Sam');
    expect(payload.html).toContain('Jamie');
    expect(payload.html).toContain('milestone 1');
    expect(payload.html).toMatch(/\$4,?000/); // matches both Node ICU "$4,000" and browser "S$4,000"
    expect(payload.html).toContain('/projects/sourdough-starter-kit');
  });

  it('includes Reply-To via the centralized helper', async () => {
    await sendMilestoneApprovedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 2,
      escrowReleasedSgd: 4000,
    });
    expect(mockSend.mock.calls[0][0].replyTo).toBe('hello@getthatbread.sg');
  });

  it('escapes HTML in user-supplied fields', async () => {
    await sendMilestoneApprovedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: '<img src=x>',
      creatorName: 'Jamie',
      projectTitle: '<b>x</b>',
      projectSlug: 'test',
      milestoneNumber: 3,
      escrowReleasedSgd: 2000,
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).not.toContain('<img');
    expect(payload.html).not.toContain('<b>x</b>');
  });

  it('renders "release is processing" copy when escrowReleasedSgd is 0', async () => {
    await sendMilestoneApprovedToBackerEmail({
      backerEmail: 'backer@example.com',
      backerName: 'Sam',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 1,
      escrowReleasedSgd: 0,
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).toMatch(/processing|reflected shortly/i);
    expect(payload.html).not.toMatch(/\$0/);
  });
});

import { sendMilestoneApprovedToCreatorEmail } from '@/lib/email/templates';

describe('sendMilestoneApprovedToCreatorEmail', () => {
  beforeEach(() => { mockSend.mockClear(); });

  it('sends short confirmation with milestone number + amount', async () => {
    await sendMilestoneApprovedToCreatorEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Sourdough Starter Kit',
      projectSlug: 'sourdough-starter-kit',
      milestoneNumber: 2,
      escrowReleasedSgd: 4000,
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe('creator@example.com');
    expect(payload.subject).toContain('Milestone 2');
    expect(payload.html).toContain('Jamie');
    expect(payload.html).toMatch(/\$4,?000/);
    expect(payload.html).toContain('/dashboard');
  });

  it('includes Reply-To', async () => {
    await sendMilestoneApprovedToCreatorEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 1,
      escrowReleasedSgd: 4000,
    });
    expect(mockSend.mock.calls[0][0].replyTo).toBe('hello@getthatbread.sg');
  });

  it('renders "release is processing" copy when escrowReleasedSgd is 0', async () => {
    await sendMilestoneApprovedToCreatorEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 1,
      escrowReleasedSgd: 0,
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).toMatch(/processing|shortly/i);
    expect(payload.html).not.toMatch(/\$0/);
  });
});

import { sendMilestoneNeedsActionEmail } from '@/lib/email/templates';

describe('sendMilestoneNeedsActionEmail', () => {
  beforeEach(() => { mockSend.mockClear(); });

  it('sends rejection copy when decision is "rejected"', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Sourdough Starter Kit',
      projectSlug: 'sourdough-starter-kit',
      milestoneNumber: 1,
      decision: 'rejected',
      feedbackText: 'Photo is too blurry, please retake.',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toContain('Action needed');
    expect(payload.html).toMatch(/needs revision|please review/i);
    expect(payload.html).toContain('Photo is too blurry, please retake.');
  });

  it('sends needs_info copy when decision is "needs_info"', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 2,
      decision: 'needs_info',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).toMatch(/questions about|more info/i);
  });

  it('renders without feedbackText (undefined)', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 3,
      decision: 'rejected',
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).not.toContain('undefined');
  });

  it('escapes HTML in feedbackText', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 1,
      decision: 'rejected',
      feedbackText: '<script>alert(1)</script>',
    });
    const payload = mockSend.mock.calls[0][0];
    expect(payload.html).not.toContain('<script>');
  });

  it('includes Reply-To', async () => {
    await sendMilestoneNeedsActionEmail({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Test',
      projectSlug: 'test',
      milestoneNumber: 1,
      decision: 'rejected',
    });
    expect(mockSend.mock.calls[0][0].replyTo).toBe('hello@getthatbread.sg');
  });
});
