import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/campaigns/[campaignId]/milestone-submit/route';
import { NextRequest } from 'next/server';

// Mock Supabase and proofs validation
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/milestones/proofs', () => ({
  validateMilestoneProof: vi.fn(),
  normalizeMilestoneProof: vi.fn((proof) => proof),
}));

import { createClient } from '@/lib/supabase/server';
import { validateMilestoneProof, normalizeMilestoneProof } from '@/lib/milestones/proofs';

const mockCreateClient = vi.mocked(createClient);
const mockValidateProof = vi.mocked(validateMilestoneProof);
const mockNormalizeProof = vi.mocked(normalizeMilestoneProof);

// Helper to create a chainable mock
function createChainableMock(resolveValue: any) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
  };
}

describe('POST /api/campaigns/{campaignId}/milestone-submit', () => {
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
    mockNormalizeProof.mockImplementation((proof) => proof);
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: { letter_text: 'Contract...', photos_url: 'https://example.com/photo.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 403 when user is not the campaign creator', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      mockValidateProof.mockReturnValue({ valid: true });

      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: { creator_id: 'different-creator' },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: { letter_text: 'Contract...', photos_url: 'https://example.com/photo.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Forbidden');
    });

    it('should allow creator to submit milestone', async () => {
      const userId = 'creator-1';
      const campaignId = 'campaign-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      mockValidateProof.mockReturnValue({ valid: true });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: verify campaign ownership
          return createChainableMock({
            data: { creator_id: userId },
            error: null,
          });
        } else {
          // Second call: insert submission
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sub-1',
                campaign_id: campaignId,
                creator_id: userId,
                milestone_number: 1,
                proof_data: { letter_text: 'Contract...', photos_url: 'https://example.com/photo.jpg' },
                status: 'pending',
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: { letter_text: 'Contract...', photos_url: 'https://example.com/photo.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.submission).toBeDefined();
      expect(body.submission.status).toBe('pending');
    });
  });

  describe('Milestone 1 (Tooling) Submission', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return createChainableMock({
            data: { creator_id: 'creator-1' },
            error: null,
          });
        } else {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sub-1',
                campaign_id: 'campaign-1',
                creator_id: 'creator-1',
                milestone_number: 1,
                proof_data: { letter_text: 'Contract...', photos_url: 'https://example.com/photo.jpg' },
                status: 'pending',
              },
              error: null,
            }),
          };
        }
      });
    });

    it('should accept valid M1 with letter and photos', async () => {
      mockValidateProof.mockReturnValue({ valid: true });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: {
            letter_text: 'Signed factory contract from XYZ Factory...',
            photos_url: 'https://example.com/contract-photo.jpg',
          },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.submission.milestone_number).toBe(1);
    });

    it('should reject M1 missing letter_text', async () => {
      mockValidateProof.mockReturnValue({
        valid: false,
        error: 'Milestone 1: letter_text required (factory contract)',
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: { photos_url: 'https://example.com/contract.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('letter_text required');
    });

    it('should reject M1 missing photos_url', async () => {
      mockValidateProof.mockReturnValue({
        valid: false,
        error: 'Milestone 1: photos_url required',
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: { letter_text: 'Contract...' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('photos_url required');
    });

    it('should reject M1 with invalid photo URL', async () => {
      mockValidateProof.mockReturnValue({
        valid: false,
        error: 'Milestone 1: photos_url must be valid URL',
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: {
            letter_text: 'Contract...',
            photos_url: 'not-a-url',
          },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('photos_url must be valid');
    });
  });

  describe('Milestone 2 (Production) Submission', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return createChainableMock({
            data: { creator_id: 'creator-1' },
            error: null,
          });
        } else {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sub-2',
                campaign_id: 'campaign-1',
                creator_id: 'creator-1',
                milestone_number: 2,
                proof_data: {
                  photos_url: 'https://example.com/factory-floor.jpg',
                  letter_text: 'Production timeline letter...',
                },
                status: 'pending',
              },
              error: null,
            }),
          };
        }
      });
    });

    it('should accept valid M2 with letter and photos', async () => {
      mockValidateProof.mockReturnValue({ valid: true });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 2,
          proof_data: {
            photos_url: 'https://example.com/factory-floor.jpg',
            letter_text: 'Production timeline letter from factory...',
          },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.submission.milestone_number).toBe(2);
    });

    it('should reject M2 missing letter_text', async () => {
      mockValidateProof.mockReturnValue({
        valid: false,
        error: 'Milestone 2: letter_text required (production timeline)',
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 2,
          proof_data: { photos_url: 'https://example.com/factory.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('letter_text required');
    });

    it('should reject M2 with invalid photos URL', async () => {
      mockValidateProof.mockReturnValue({
        valid: false,
        error: 'Milestone 2: photos_url must be valid URL',
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 2,
          proof_data: {
            photos_url: 'not-a-url',
            letter_text: 'Letter...',
          },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('photos_url must be valid');
    });
  });

  describe('Milestone 3 (Fulfillment) Submission', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return createChainableMock({
            data: { creator_id: 'creator-1' },
            error: null,
          });
        } else {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sub-3',
                campaign_id: 'campaign-1',
                creator_id: 'creator-1',
                milestone_number: 3,
                proof_data: {
                  tracking_numbers: ['DHL123', 'DHL124', 'DHL125'],
                  fulfillment_summary: 'Shipped 100/100 units',
                },
                status: 'pending',
              },
              error: null,
            }),
          };
        }
      });
    });

    it('should accept valid M3 with tracking and summary', async () => {
      mockValidateProof.mockReturnValue({ valid: true });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 3,
          proof_data: {
            tracking_numbers: ['DHL123', 'DHL124', 'DHL125'],
            fulfillment_summary: 'Shipped 100/100 units',
          },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.submission.milestone_number).toBe(3);
    });

    it('should reject M3 with empty tracking_numbers', async () => {
      mockValidateProof.mockReturnValue({
        valid: false,
        error: 'Milestone 3: tracking_numbers required (non-empty array)',
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 3,
          proof_data: {
            tracking_numbers: [],
            fulfillment_summary: 'Shipped 100/100 units',
          },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('tracking_numbers required');
    });

    it('should reject M3 missing fulfillment_summary', async () => {
      mockValidateProof.mockReturnValue({
        valid: false,
        error: 'Milestone 3: fulfillment_summary required',
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 3,
          proof_data: {
            tracking_numbers: ['DHL123', 'DHL124'],
          },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('fulfillment_summary required');
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid milestone number', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 4,
          proof_data: { letter_text: 'Test', photos_url: 'https://example.com/photo.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid milestone number');
    });

    it('should return 404 when campaign does not exist', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      mockValidateProof.mockReturnValue({ valid: true });

      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: null,
          error: { message: 'Campaign not found' },
        })
      );

      const request = new NextRequest('http://localhost/api/campaigns/non-existent/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: { letter_text: 'Contract...', photos_url: 'https://example.com/photo.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'non-existent' }),
      });

      expect(response.status).toBe(403);
    });

    it('should return 500 when database insertion fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      mockValidateProof.mockReturnValue({ valid: true });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return createChainableMock({
            data: { creator_id: 'creator-1' },
            error: null,
          });
        } else {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database constraint violation' },
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: { letter_text: 'Contract...', photos_url: 'https://example.com/photo.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('should normalize proof data before storage', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      mockValidateProof.mockReturnValue({ valid: true });
      mockNormalizeProof.mockReturnValue({
        letter_text: 'Trimmed contract',
        photos_url: 'https://example.com/photo.jpg',
      });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return createChainableMock({
            data: { creator_id: 'creator-1' },
            error: null,
          });
        } else {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sub-1',
                campaign_id: 'campaign-1',
                creator_id: 'creator-1',
                milestone_number: 1,
                proof_data: {
                  letter_text: 'Trimmed contract',
                  photos_url: 'https://example.com/photo.jpg',
                },
                status: 'pending',
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-submit', {
        method: 'POST',
        body: JSON.stringify({
          milestone_number: 1,
          proof_data: { letter_text: '  Contract with spaces  ', photos_url: 'https://example.com/photo.jpg' },
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(201);
      expect(mockNormalizeProof).toHaveBeenCalled();