import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/milestones/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server');

describe('GET /api/admin/milestones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones?status=pending'
    );

    const response = await GET(req);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 if user is not admin', async () => {
    const { createClient } = await import('@/lib/supabase/server');

    const mockSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { is_admin: false },
        }),
      }),
      single: vi.fn().mockResolvedValue({
        data: { is_admin: false },
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-id' } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectChain),
      }),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones?status=pending'
    );

    const response = await GET(req);
    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should return 400 if status parameter is invalid', async () => {
    const { createClient } = await import('@/lib/supabase/server');

    const mockSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
        }),
      }),
      single: vi.fn().mockResolvedValue({
        data: { is_admin: true },
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectChain),
      }),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones?status=invalid'
    );

    const response = await GET(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Invalid status');
  });

  it('should return pending milestones for admin', async () => {
    const { createClient } = await import('@/lib/supabase/server');

    const mockSubmissions = [
      {
        id: 'sub-1',
        campaign_id: 'campaign-1',
        creator_id: 'creator-1',
        milestone_number: 1,
        status: 'pending',
        proof_data: { letter_text: 'Proof' },
        submitted_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        projects: { title: 'Cool Campaign' },
        profiles: { display_name: 'John Doe' },
      },
    ];

    const profileSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
        }),
      }),
    };

    const milestonesSelectChain = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: mockSubmissions,
            count: 1,
          }),
        }),
      }),
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: mockSubmissions,
          count: 1,
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue(profileSelectChain),
          };
        }
        return {
          select: vi.fn().mockReturnValue(milestonesSelectChain),
        };
      }),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones?status=pending'
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.submissions).toHaveLength(1);
    expect(data.submissions[0]).toEqual({
      id: 'sub-1',
      campaign_id: 'campaign-1',
      campaign_name: 'Cool Campaign',
      creator_id: 'creator-1',
      creator_name: 'John Doe',
      milestone_number: 1,
      status: 'pending',
      proof_data: { letter_text: 'Proof' },
      submitted_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    });
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
    expect(data.pages).toBe(1);
  });

  it('should filter by different status values', async () => {
    const { createClient } = await import('@/lib/supabase/server');

    const mockSubmissions = [
      {
        id: 'sub-2',
        campaign_id: 'campaign-2',
        creator_id: 'creator-2',
        milestone_number: 2,
        status: 'approved',
        proof_data: {},
        submitted_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-02T00:00:00Z',
        projects: { title: 'Another Campaign' },
        profiles: { display_name: 'Jane Smith' },
      },
    ];

    const profileSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
        }),
      }),
    };

    const milestonesSelectChain = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: mockSubmissions,
            count: 1,
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue(profileSelectChain),
          };
        }
        return {
          select: vi.fn().mockReturnValue(milestonesSelectChain),
        };
      }),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones?status=approved'
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.submissions).toHaveLength(1);
    expect(data.submissions[0].status).toBe('approved');
  });

  it('should support pagination', async () => {
    const { createClient } = await import('@/lib/supabase/server');

    const mockSubmissions = Array.from({ length: 20 }, (_, i) => ({
      id: `sub-${i}`,
      campaign_id: `campaign-${i}`,
      creator_id: `creator-${i}`,
      milestone_number: 1,
      status: 'pending',
      proof_data: {},
      submitted_at: new Date(2024, 0, i + 1).toISOString(),
      created_at: new Date(2024, 0, i + 1).toISOString(),
      projects: { title: `Campaign ${i}` },
      profiles: { display_name: `Creator ${i}` },
    }));

    const profileSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
        }),
      }),
    };

    const milestonesSelectChain = {
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: mockSubmissions.slice(20, 40),
          count: 50,
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue(profileSelectChain),
          };
        }
        return {
          select: vi.fn().mockReturnValue(milestonesSelectChain),
        };
      }),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones?page=2&limit=20'
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.page).toBe(2);
    expect(data.limit).toBe(20);
    expect(data.total).toBe(50);
    expect(data.pages).toBe(3);
  });

  it('should return empty submissions array for no results', async () => {
    const { createClient } = await import('@/lib/supabase/server');

    const profileSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
        }),
      }),
    };

    const milestonesSelectChain = {
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [],
            count: 0,
          }),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue(profileSelectChain),
          };
        }
        return {
          select: vi.fn().mockReturnValue(milestonesSelectChain),
        };
      }),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones?status=rejected'
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.submissions).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('should return 500 on database error', async () => {
    const { createClient } = await import('@/lib/supabase/server');

    const profileSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
        }),
      }),
    };

    const milestonesSelectChain = {
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          error: new Error('Database connection failed'),
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue(profileSelectChain),
          };
        }
        return {
          select: vi.fn().mockReturnValue(milestonesSelectChain),
        };
      }),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones'
    );

    const response = await GET(req);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Failed to fetch submissions');
  });

  it('should handle missing campaign or creator names gracefully', async () => {
    const { createClient } = await import('@/lib/supabase/server');

    const mockSubmissions = [
      {
        id: 'sub-3',
        campaign_id: 'campaign-3',
        creator_id: 'creator-3',
        milestone_number: 3,
        status: 'needs_info',
        proof_data: { tracking_numbers: ['ABC123'] },
        submitted_at: '2024-01-03T00:00:00Z',
        created_at: '2024-01-03T00:00:00Z',
        projects: null,
        profiles: null,
      },
    ];

    const profileSelectChain = {
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { is_admin: true },
        }),
      }),
    };

    const milestonesSelectChain = {
      order: vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({
          data: mockSubmissions,
          count: 1,
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue(profileSelectChain),
          };
        }
        return {
          select: vi.fn().mockReturnValue(milestonesSelectChain),
        };
      }),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/milestones'
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.submissions[0].campaign_name).toBe('Unknown Campaign');
    expect(data.submissions[0].creator_name).toBe('Unknown Creator');
  });
});
