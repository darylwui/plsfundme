import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/creators/qualification/approve/route';
import { NextRequest } from 'next/server';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = vi.mocked(createClient);

// Helper to create a chainable mock
function createChainableMock(resolveValue: any) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
  };
}

describe('POST /api/creators/qualification/approve', () => {
  let mockSupabaseClient: any;

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

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: 'creator-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('Admin Authorization', () => {
    it('should approve creator qualification when user is admin', async () => {
      const userId = 'user-1';
      const creatorId = 'creator-1';

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      // Mock admin profile
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createChainableMock({
            data: { is_admin: true },
            error: null,
          });
        } else if (table === 'creator_qualifications') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: creatorId,
          decision: 'approved',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should return 403 when user is not admin', async () => {
      const userId = 'user-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      // Mock non-admin profile
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: { is_admin: false },
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: 'creator-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Only admins can approve creator qualifications');
    });

    it('should return 403 when profile does not exist', async () => {
      const userId = 'user-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      // Mock missing profile
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: null,
          error: null,
        })
      );

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: 'creator-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Only admins can approve creator qualifications');
    });

    it('should return 500 when admin check query fails', async () => {
      const userId = 'user-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      // Mock profile query error
      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: null,
          error: { message: 'Database error' },
        })
      );

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: 'creator-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request);

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

      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: { is_admin: true },
          error: null,
        })
      );
    });

    it('should return 400 when decision is invalid', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createChainableMock({
            data: { is_admin: true },
            error: null,
          });
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: 'creator-1',
          decision: 'invalid_decision',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid decision');
    });

    it('should accept valid decisions: approved, rejected', async () => {
      const decisions = ['approved', 'rejected'];

      for (const decision of decisions) {
        vi.clearAllMocks();

        // Re-setup auth for each iteration
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-1' } },
        });

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'profiles') {
            return createChainableMock({
              data: { is_admin: true },
              error: null,
            });
          } else if (table === 'creator_qualifications') {
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }
        });

        const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
          method: 'POST',
          body: JSON.stringify({
            creator_id: 'creator-1',
            decision,
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      }
    });
  });

  describe('Qualification Update', () => {
    beforeEach(() => {
      // Setup admin user by default
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      mockSupabaseClient.from.mockReturnValue(
        createChainableMock({
          data: { is_admin: true },
          error: null,
        })
      );
    });

    it('should set tier to creator_plus when decision is approved', async () => {
      const userId = 'user-1';
      const creatorId = 'creator-1';
      let updateCallData: any = null;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createChainableMock({
            data: { is_admin: true },
            error: null,
          });
        } else if (table === 'creator_qualifications') {
          return {
            update: vi.fn().mockImplementation((data: any) => {
              updateCallData = data;
              return {
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: creatorId,
          decision: 'approved',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updateCallData?.tier).toBe('creator_plus');
      expect(updateCallData?.approved_by).toBe(userId);
      expect(updateCallData?.approved_at).toBeDefined();
    });

    it('should set tier to standard when decision is rejected', async () => {
      const userId = 'user-1';
      const creatorId = 'creator-1';
      let updateCallData: any = null;

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createChainableMock({
            data: { is_admin: true },
            error: null,
          });
        } else if (table === 'creator_qualifications') {
          return {
            update: vi.fn().mockImplementation((data: any) => {
              updateCallData = data;
              return {
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: creatorId,
          decision: 'rejected',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updateCallData?.tier).toBe('standard');
      expect(updateCallData?.approved_by).toBe(userId);
      expect(updateCallData?.approved_at).toBeDefined();
    });

    it('should return 500 when creator qualification update fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createChainableMock({
            data: { is_admin: true },
            error: null,
          });
        } else if (table === 'creator_qualifications') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database constraint violation' },
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/approve', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: 'creator-1',
          decision: 'approved',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Database constraint violation');
    });
  });
});
