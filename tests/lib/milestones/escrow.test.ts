import { describe, it, expect, beforeEach, vi } from 'vitest';
import { releaseMilestonePayment, holdPaymentInEscrow, refundPledgeFromEscrow } from '@/lib/milestones/escrow';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
vi.mock('@/lib/supabase/server');

describe('Escrow Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('releaseMilestonePayment', () => {
    it('should release 40% for milestone 1 when approved', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'release-1' }], error: null }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 1,
        campaign_total_sgd: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.amount_released).toBe(20000); // 40% of 50k
      expect(result.reason).toBe('milestone_approved');
    });

    it('should release 40% for milestone 2', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'release-2' }], error: null }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 2,
        campaign_total_sgd: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.amount_released).toBe(20000); // 40% of 50k
    });

    it('should release 20% for milestone 3', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'release-3' }], error: null }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 3,
        campaign_total_sgd: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.amount_released).toBe(10000); // 20% of 50k
    });

    it('should return error if insert fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 1,
        campaign_total_sgd: 50000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error for invalid milestone number', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'release-1' }], error: null }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      await expect(
        releaseMilestonePayment({
          campaign_id: 'campaign-1',
          milestone_number: 999 as any,
          campaign_total_sgd: 50000,
        })
      ).rejects.toThrow('Invalid milestone number');
    });

    it('should handle rounding correctly (SGD 33333 → 40% = SGD 13333.20)', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'release-1' }], error: null }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 1,
        campaign_total_sgd: 33333,
      });

      expect(result.success).toBe(true);
      expect(result.amount_released).toBe(13333.2); // 40% of 33333
    });
  });

  describe('holdPaymentInEscrow', () => {
    it('should mark a pledge as held in escrow', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [{ id: 'pledge-1', escrow_held: true }], error: null }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await holdPaymentInEscrow('pledge-1');

      expect(result.success).toBe(true);
      expect(result.held).toBe(true);
    });

    it('should return error if update fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await holdPaymentInEscrow('pledge-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('refundPledgeFromEscrow', () => {
    it('should mark a pledge as refunded', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: 'pledge-1', refunded: true, escrow_held: false }],
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await refundPledgeFromEscrow('pledge-1', 'milestone_missed');

      expect(result.success).toBe(true);
      expect(result.held).toBe(false);
    });

    it('should return error if refund fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Refund failed' },
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await refundPledgeFromEscrow('pledge-1', 'milestone_missed');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
