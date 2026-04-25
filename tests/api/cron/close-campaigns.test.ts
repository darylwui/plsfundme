import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSendCampaignFailedEmail,
  mockSendCampaignFailedToBackerEmail,
  mockStripeCancel,
  mockCaptureProjectPledges,
} = vi.hoisted(() => ({
  mockSendCampaignFailedEmail: vi.fn().mockResolvedValue({}),
  mockSendCampaignFailedToBackerEmail: vi.fn().mockResolvedValue({}),
  mockStripeCancel: vi.fn().mockResolvedValue({}),
  mockCaptureProjectPledges: vi.fn().mockResolvedValue({ captured: 0, failed: 0 }),
}));

vi.mock('@/lib/email/templates', () => ({
  sendCampaignFailedEmail: mockSendCampaignFailedEmail,
  sendCampaignFailedToBackerEmail: mockSendCampaignFailedToBackerEmail,
}));

vi.mock('@/lib/stripe/server', () => ({
  getStripe: () => ({ paymentIntents: { cancel: mockStripeCancel } }),
}));

vi.mock('@/app/api/payments/capture/route', () => ({
  captureProjectPledges: mockCaptureProjectPledges,
}));

// Build a chainable Supabase mock. Each query returns a thenable that
// resolves to canned data — Supabase's PostgrestFilterBuilder is PromiseLike,
// so any combination of .eq()/.in()/.is()/.lt() chained before await works.
function thenable(data: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const m of ['eq', 'in', 'is', 'lt', 'gt', 'not', 'order', 'limit', 'range']) {
    chain[m] = () => chain;
  }
  chain.single = async () => ({ data, error: null });
  chain.then = (resolve: (v: unknown) => void) => resolve({ data, error: null });
  return chain;
}

function buildSupabaseMock(scenario: 'failed' | 'funded' | 'no-card-backers') {
  const expiredProjects =
    scenario === 'funded'
      ? [{ id: 'proj-1', amount_pledged_sgd: 10000, funding_goal_sgd: 10000 }]
      : [{ id: 'proj-1', amount_pledged_sgd: 500, funding_goal_sgd: 10000 }];

  const projectFull = {
    id: 'proj-1',
    title: 'Failed Campaign',
    deadline: '2026-05-01T00:00:00Z',
    amount_pledged_sgd: 500,
    funding_goal_sgd: 10000,
    creator: { id: 'creator-1', display_name: 'Jamie', email: 'creator@example.com' },
  };

  const authorizedPledges = [
    { id: 'pledge-1', stripe_payment_intent_id: 'pi_1' },
    { id: 'pledge-2', stripe_payment_intent_id: 'pi_2' },
  ];
  const cardBackers =
    scenario === 'no-card-backers'
      ? []
      : [
          { backer: { display_name: 'Sam', email: 'sam@example.com' } },
          { backer: { display_name: 'Pat', email: 'pat@example.com' } },
        ];

  return {
    from: (table: string) => {
      if (table === 'projects') {
        return {
          select: (cols: string) => {
            const isFullRecordSelect = cols.includes('creator:profiles');
            // The expired-projects query terminates without .single(); the post-fail
            // re-fetch terminates with .single() returning the full record.
            const data = isFullRecordSelect ? projectFull : expiredProjects;
            return thenable(data);
          },
          update: () => thenable(null),
        };
      }
      if (table === 'pledges') {
        return {
          select: (cols: string) => {
            const isCardBackerSelect = cols.includes('backer:profiles');
            return thenable(isCardBackerSelect ? cardBackers : authorizedPledges);
          },
          update: () => thenable(null),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}));

import { GET } from '@/app/api/cron/close-campaigns/route';
import { createServiceClient } from '@/lib/supabase/server';

describe('close-campaigns cron', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    mockSendCampaignFailedEmail.mockClear();
    mockSendCampaignFailedToBackerEmail.mockClear();
    mockStripeCancel.mockClear();
  });

  it('emails creator + card-pledge backers when a project fails', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(buildSupabaseMock('failed'));

    const req = new Request('http://localhost/api/cron/close-campaigns', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockSendCampaignFailedEmail).toHaveBeenCalledTimes(1);
    expect(mockSendCampaignFailedEmail.mock.calls[0][0]).toMatchObject({
      creatorEmail: 'creator@example.com',
      creatorName: 'Jamie',
      projectTitle: 'Failed Campaign',
    });

    expect(mockSendCampaignFailedToBackerEmail).toHaveBeenCalledTimes(2);
    const recipients = mockSendCampaignFailedToBackerEmail.mock.calls.map((c) => c[0].backerEmail);
    expect(recipients).toContain('sam@example.com');
    expect(recipients).toContain('pat@example.com');
  });

  it('does not email failed templates when project funds', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(buildSupabaseMock('funded'));

    const req = new Request('http://localhost/api/cron/close-campaigns', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    await GET(req);

    expect(mockSendCampaignFailedEmail).not.toHaveBeenCalled();
    expect(mockSendCampaignFailedToBackerEmail).not.toHaveBeenCalled();
  });

  it('emails creator only when no card-pledge backers exist', async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(buildSupabaseMock('no-card-backers'));

    const req = new Request('http://localhost/api/cron/close-campaigns', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    await GET(req);

    expect(mockSendCampaignFailedEmail).toHaveBeenCalledTimes(1);
    expect(mockSendCampaignFailedToBackerEmail).not.toHaveBeenCalled();
  });
});
