import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/campaigns/[campaignId]/disputes/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = vi.mocked(createClient);

// Helper to create a chainable mock
function createChainableMock(resolveValue: any) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
  };
}

describe('POST /api/campaigns/{campaignId}/disputes', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Creator has not shipped items as promised',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should allow authenticated user to file dispute', async () => {
      const userId = 'backer-1';
      const campaignId = 'campaign-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: campaignId,
            backer_id: userId,
            description: 'Creator has not shipped items',
            status: 'open',
            filed_at: '2026-04-23T12:00:00Z',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Creator has not shipped items',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.dispute).toBeDefined();
      expect(body.dispute.status).toBe('open');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'backer-1' } },
      });
    });

    it('should reject description with less than 10 characters', async () => {
      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Too short',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('at least 10 characters');
    });

    it('should accept description with exactly 10 characters', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: 'campaign-1',
            backer_id: 'backer-1',
            description: '1234567890',
            status: 'open',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: '1234567890',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should reject empty description', async () => {
      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: '',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('at least 10 characters');
    });

    it('should reject description with only whitespace', async () => {
      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: '     ',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('at least 10 characters');
    });

    it('should accept valid description', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: 'campaign-1',
            backer_id: 'backer-1',
            description: 'Creator promised to ship by March but it is now April and no items have been received',
            status: 'open',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Creator promised to ship by March but it is now April and no items have been received',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.dispute).toBeDefined();
    });
  });

  describe('Dispute Status', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'backer-1' } },
      });
    });

    it('should store dispute with open status', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: 'campaign-1',
            backer_id: 'backer-1',
            description: 'Dispute about non-delivery of items',
            status: 'open',
            filed_at: '2026-04-23T12:00:00Z',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Dispute about non-delivery of items',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.dispute.status).toBe('open');
    });

    it('should store dispute with correct campaign_id', async () => {
      const campaignId = 'campaign-xyz';
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: campaignId,
            backer_id: 'backer-1',
            description: 'Quality issue with product',
            status: 'open',
          },
          error: null,
        })
      );

      const request = new NextRequest(`http://localhost/api/campaigns/${campaignId}/disputes`, {
        method: 'POST',
        body: JSON.stringify({
          description: 'Quality issue with product',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.dispute.campaign_id).toBe(campaignId);
    });

    it('should store dispute with correct backer_id', async () => {
      const backerId = 'backer-user-123';
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: backerId } },
      });

      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: 'campaign-1',
            backer_id: backerId,
            description: 'Dispute about order quality',
            status: 'open',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Dispute about order quality',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.dispute.backer_id).toBe(backerId);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'backer-1' } },
      });
    });

    it('should return 500 when database insertion fails', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: null,
          error: { message: 'Database constraint violation' },
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Valid dispute description that is long enough',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Database constraint violation');
    });

    it('should handle description with leading/trailing whitespace', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: 'campaign-1',
            backer_id: 'backer-1',
            description: '  Description with spaces  ',
            status: 'open',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: '  Description with spaces  ',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept long description', async () => {
      const longDescription = 'A'.repeat(500);
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: 'campaign-1',
            backer_id: 'backer-1',
            description: longDescription,
            status: 'open',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: longDescription,
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should handle missing description field', async () => {
      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('at least 10 characters');
    });

    it('should create dispute with dispute_id returned from database', async () => {
      const disputeId = 'dispute-uuid-12345';
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: disputeId,
            campaign_id: 'campaign-1',
            backer_id: 'backer-1',
            description: 'Valid dispute with specific ID',
            status: 'open',
            filed_at: '2026-04-23T12:00:00Z',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Valid dispute with specific ID',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.dispute.id).toBe(disputeId);
    });

    it('should return 201 on successful dispute filing', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: {
            id: 'dispute-1',
            campaign_id: 'campaign-1',
            backer_id: 'backer-1',
            description: 'Valid dispute description here',
            status: 'open',
          },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/disputes', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Valid dispute description here',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
    });
  });
});
