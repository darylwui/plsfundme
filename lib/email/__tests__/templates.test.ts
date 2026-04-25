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
