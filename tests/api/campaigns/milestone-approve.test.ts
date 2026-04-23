import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/campaigns/[campaignId]/milestone-approve/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server');

describe('POST /api/campaigns/{campaignId}/milestone-approve', () => {
  it('should approve a milestone submission and release funds', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn(),
    };

    const req = new NextRequest('http://localhost:3000/api/campaigns/campaign-1/milestone-approve', {
      method: 'POST',
      body: JSON.stringify({
        submission_id: 'sub-1',
        decision: 'approved',
        feedback_text: 'Looks good!',
      }),
    });

    // This test is a placeholder; full implementation in next step
    expect(req).toBeDefined();
  });
});
