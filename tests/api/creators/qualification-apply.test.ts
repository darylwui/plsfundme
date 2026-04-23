import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/creators/qualification/apply/route';
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
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
  };
}

describe('POST /api/creators/qualification/apply', () => {
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

      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should allow authenticated creator to apply', async () => {
      const creatorId = 'creator-1';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: creatorId } },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('Proof Type Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
    });

    it('should accept valid portfolio URL', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept valid kickstarter URL', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://kickstarter.com/projects/creator/campaign',
          external_proof_type: 'kickstarter',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept manufacturing_letter proof type', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/factory-letter.pdf',
          external_proof_type: 'manufacturing_letter',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept endorsement proof type', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/endorsement',
          external_proof_type: 'endorsement',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should reject invalid proof type', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/proof',
          external_proof_type: 'invalid_type',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid proof type');
    });
  });

  describe('URL Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
    });

    it('should accept valid HTTPS URL', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept valid HTTP URL', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'http://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should reject invalid URL format', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'not-a-valid-url',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid URL');
    });

    it('should reject URL without protocol', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid URL');
    });

    it('should reject empty URL', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: '',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });
    });

    it('should reject missing external_proof_url', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Missing required fields');
    });

    it('should reject missing external_proof_type', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Missing required fields');
    });

    it('should reject empty request body', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Missing required fields');
    });
  });

  describe('Database Operations', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });
    });

    it('should create new qualification record when none exists', async () => {
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'creator_qualifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            insert: insertMock,
          };
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(insertMock).toHaveBeenCalled();
    });

    it('should update existing qualification record', async () => {
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'creator_qualifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((criteria) => {
              if (criteria === 'creator_id') {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'qual-1', creator_id: 'creator-1' },
                    error: null,
                  }),
                };
              }
              return eqMock;
            }),
            update: updateMock,
          };
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/new-portfolio',
          external_proof_type: 'kickstarter',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updateMock).toHaveBeenCalled();
    });

    it('should return 500 when insert fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'creator_qualifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Unique constraint violation' },
            }),
          };
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('should return 500 when update fails', async () => {
      let callPhase = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'creator_qualifications') {
          callPhase++;
          if (callPhase === 1) {
            // First call: select to check existence
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'qual-1' },
                error: null,
              }),
            };
          } else {
            // Second call: update fails
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            };
          }
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-1' } },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
    });

    it('should handle URL with query parameters', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio?ref=getthatbread&source=landing',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should handle URL with fragments', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio#section-1',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should handle creator applying multiple times (update)', async () => {
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'creator_qualifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((criteria) => {
              if (criteria === 'creator_id') {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'qual-1',
                      creator_id: 'creator-1',
                      external_proof_url: 'https://old-url.com',
                    },
                    error: null,
                  }),
                };
              }
              return eqMock;
            }),
            update: updateMock,
          };
        }
      });

      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://new-url.com',
          external_proof_type: 'kickstarter',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should return 200 with success true on successful application', async () => {
      const request = new NextRequest('http://localhost/api/creators/qualification/apply', {
        method: 'POST',
        body: JSON.stringify({
          external_proof_url: 'https://example.com/portfolio',
          external_proof_type: 'portfolio',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });
});
