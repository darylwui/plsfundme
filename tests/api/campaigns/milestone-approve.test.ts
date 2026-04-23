import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/campaigns/[campaignId]/milestone-approve/route';
import { NextRequest } from 'next/server';

// Mock the Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

import { createClient, createServiceClient } from '@/lib/supabase/server';

const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceClient = vi.mocked(createServiceClient);

// Helper to create a chainable mock
function createChainableMock(resolveValue: any) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
  };
}

describe('POST /api/campaigns/[campaignId]/milestone-approve', () => {
  let mockSupabaseClient: any;
  let mockServiceClient: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock behavior for regular client
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    // Setup default mock behavior for service client with smarter from() handling
    mockServiceClient = {
      from: vi.fn(),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
    mockCreateServiceClient.mockReturnValue(mockServiceClient);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'sub-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Admin Authorization', () => {
    it('should approve milestone when user is admin', async () => {
      const userId = 'user-1';
      const submissionId = 'sub-1';
      const campaignId = 'campaign-1';

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      // Mock admin profile
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: { is_admin: true },
          error: null,
        })
      );

      // Setup service client mocks for multiple calls
      let fromCallCount = 0;
      mockServiceClient.from.mockImplementation((table: string) => {
        fromCallCount++;
        if (table === 'milestone_submissions') {
          if (fromCallCount === 1) {
            // First call: select() for checking submission
            return createChainableMock({
              data: {
                id: submissionId,
                campaign_id: campaignId,
                milestone_number: 1,
                status: 'pending',
              },
              error: null,
            });
          } else {
            // Second call: update() for updating submission status
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }
        } else if (table === 'milestone_approvals') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'approval-1',
                submission_id: submissionId,
                approved_by: userId,
                decision: 'approved',
                feedback_text: null,
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: submissionId,
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.approval).toBeDefined();
    });

    it('should return 403 when user is not admin', async () => {
      const userId = 'user-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      // Mock non-admin profile
      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { is_admin: false },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(profileQuery);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'sub-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Only admins can approve milestones');
    });

    it('should return 403 when profile does not exist', async () => {
      const userId = 'user-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      // Mock missing profile
      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(profileQuery);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'sub-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Only admins can approve milestones');
    });

    it('should return 500 when admin check query fails', async () => {
      const userId = 'user-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      // Mock profile query error
      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(profileQuery);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'sub-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to verify admin status');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      // Setup admin user by default
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(profileQuery);
    });

    it('should return 400 when submission_id is missing', async () => {
      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('submission_id is required');
    });

    it('should return 400 when decision is invalid', async () => {
      mockServiceClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'sub-1',
            campaign_id: 'campaign-1',
            milestone_number: 1,
            status: 'pending',
          },
          error: null,
        }),
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'sub-1',
          decision: 'invalid_decision',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('decision must be one of');
    });

    it('should accept valid decisions: approved, rejected, needs_info', async () => {
      const decisions = ['approved', 'rejected', 'needs_info'];

      for (const decision of decisions) {
        vi.clearAllMocks();

        // Re-setup auth for each iteration
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-1' } },
        });

        mockSupabaseClient.from.mockReturnValue(
          createChainableMock({
            data: { is_admin: true },
            error: null,
          })
        );

        let fromCallCount = 0;
        mockServiceClient.from.mockImplementation((table: string) => {
          fromCallCount++;
          if (table === 'milestone_submissions') {
            if (fromCallCount === 1) {
              // First call: select() for checking submission
              return createChainableMock({
                data: {
                  id: 'sub-1',
                  campaign_id: 'campaign-1',
                  milestone_number: 1,
                  status: 'pending',
                },
                error: null,
              });
            } else {
              // Second call: update() for updating submission status
              return {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }
          } else if (table === 'milestone_approvals') {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'approval-1',
                  submission_id: 'sub-1',
                  approved_by: 'user-1',
                  decision,
                  feedback_text: null,
                },
                error: null,
              }),
            };
          }
        });

        const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
          method: 'POST',
          body: JSON.stringify({
            submission_id: 'sub-1',
            decision,
          }),
        });

        const response = await POST(request, {
          params: Promise.resolve({ campaignId: 'campaign-1' }),
        });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('Submission Handling', () => {
    beforeEach(() => {
      // Setup admin user by default
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(profileQuery);
    });

    it('should return 404 when submission not found', async () => {
      const submissionQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockServiceClient.from.mockReturnValue(submissionQuery);

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'non-existent',
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Submission not found');
    });

    it('should include feedback_text in approval when provided', async () => {
      const userId = 'user-1';
      const submissionId = 'sub-1';
      const campaignId = 'campaign-1';
      const feedbackText = 'Great submission, approved!';

      let fromCallCount = 0;
      mockServiceClient.from.mockImplementation((table: string) => {
        fromCallCount++;
        if (table === 'milestone_submissions') {
          if (fromCallCount === 1) {
            // First call: select() for checking submission
            return createChainableMock({
              data: {
                id: submissionId,
                campaign_id: campaignId,
                milestone_number: 1,
                status: 'pending',
              },
              error: null,
            });
          } else {
            // Second call: update() for updating submission status
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }
        } else if (table === 'milestone_approvals') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'approval-1',
                submission_id: submissionId,
                approved_by: userId,
                decision: 'approved',
                feedback_text: feedbackText,
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: submissionId,
          decision: 'approved',
          feedback_text: feedbackText,
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.approval.feedback_text).toBe(feedbackText);
    });

    it('should return 500 when approval creation fails', async () => {
      // Mock submission query
      const submissionQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'sub-1',
            campaign_id: 'campaign-1',
            milestone_number: 1,
            status: 'pending',
          },
          error: null,
        }),
      };

      // Mock approval creation error
      const approvalQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database constraint violation' },
        }),
      };

      mockServiceClient.from.mockImplementation((table: string) => {
        if (table === 'milestone_submissions') {
          return submissionQuery;
        } else if (table === 'milestone_approvals') {
          return approvalQuery;
        }
        return submissionQuery;
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'sub-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Database constraint violation');
    });

    it('should return 500 when submission update fails', async () => {
      let fromCallCount = 0;
      mockServiceClient.from.mockImplementation((table: string) => {
        fromCallCount++;
        if (table === 'milestone_submissions') {
          if (fromCallCount === 1) {
            // First call: select() for checking submission
            return createChainableMock({
              data: {
                id: 'sub-1',
                campaign_id: 'campaign-1',
                milestone_number: 1,
                status: 'pending',
              },
              error: null,
            });
          } else {
            // Second call: update() for updating submission status - this one fails
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed to update submission' },
              }),
            };
          }
        } else if (table === 'milestone_approvals') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'approval-1',
                submission_id: 'sub-1',
                approved_by: 'user-1',
                decision: 'approved',
                feedback_text: null,
              },
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/campaigns/campaign-1/milestone-approve', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'sub-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request, {
        params: Promise.resolve({ campaignId: 'campaign-1' }),
      });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to update submission');
    });
  });
});
