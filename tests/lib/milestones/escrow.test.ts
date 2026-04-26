import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { releaseMilestonePayment, holdPaymentInEscrow, refundPledgeFromEscrow } from '@/lib/milestones/escrow';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
vi.mock('@/lib/supabase/server');

const mockCreateClient = vi.mocked(createClient);

describe('escrow.ts - Core Escrow Logic', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
    };
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // releaseMilestonePayment() Tests
  // ============================================================================

  describe('releaseMilestonePayment()', () => {
    describe('Milestone 1 - 40% payout', () => {
      it('should release 40% of campaign total for milestone 1', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-1', amount_sgd: 400 }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 1,
          campaign_total_sgd: 1000,
        });

        expect(result.success).toBe(true);
        expect(result.amount_released).toBe(400);
        expect(result.reason).toBe('milestone_approved');
      });

      it('should verify correct amount is inserted into database', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-1', amount_sgd: 5000 }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 1,
          campaign_total_sgd: 12500,
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        expect(insertCall.amount_sgd).toBe(5000);
        expect(insertCall.milestone_number).toBe(1);
        expect(insertCall.reason).toBe('milestone_approved');
      });
    });

    describe('Milestone 2 - 40% payout', () => {
      it('should release 40% of campaign total for milestone 2', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-2', amount_sgd: 2000 }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-2',
          milestone_number: 2,
          campaign_total_sgd: 5000,
        });

        expect(result.success).toBe(true);
        expect(result.amount_released).toBe(2000);
        expect(result.reason).toBe('milestone_approved');
      });

      it('should include correct milestone_number in insert call', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-2' }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-2',
          milestone_number: 2,
          campaign_total_sgd: 10000,
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        expect(insertCall.milestone_number).toBe(2);
      });
    });

    describe('Milestone 3 - 20% payout', () => {
      it('should release 20% of campaign total for milestone 3', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-3', amount_sgd: 200 }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-3',
          milestone_number: 3,
          campaign_total_sgd: 1000,
        });

        expect(result.success).toBe(true);
        expect(result.amount_released).toBe(200);
        expect(result.reason).toBe('milestone_approved');
      });

      it('should correctly calculate 20% for various amounts', async () => {
        const testCases = [
          { total: 5000, expected: 1000 },
          { total: 7500, expected: 1500 },
          { total: 9999, expected: 1999.8 },
        ];

        for (const testCase of testCases) {
          vi.clearAllMocks();
          mockSupabase = { from: vi.fn() };
          mockCreateClient.mockResolvedValue(mockSupabase);

          const mockQuery = {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: 'release-3' }],
                error: null,
              }),
            }),
          };
          mockSupabase.from.mockReturnValue(mockQuery);

          const result = await releaseMilestonePayment({
            supabase: mockSupabase,
            campaign_id: 'campaign-3',
            milestone_number: 3,
            campaign_total_sgd: testCase.total,
          });

          expect(result.amount_released).toBe(testCase.expected);
        }
      });
    });

    describe('Rounding edge cases', () => {
      it('should handle $99.99 with 40% correctly without fractional cents', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-1', amount_sgd: 40.0 }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 1,
          campaign_total_sgd: 99.99,
        });

        expect(result.success).toBe(true);
        // 40% of 99.99 = 39.996, rounds to 40.00
        expect(result.amount_released).toBe(40.0);
        // Verify no fractional cents beyond 2 decimal places
        const decimalPlaces = String(result.amount_released).split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });

      it('should handle $333.33 with 20% correctly', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-3' }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 3,
          campaign_total_sgd: 333.33,
        });

        expect(result.success).toBe(true);
        // 20% of 333.33 = 66.666, rounds to 66.67
        expect(result.amount_released).toBe(66.67);
      });

      it('should maintain precision across all percentages with odd amounts', async () => {
        const amounts = [1234.56, 9876.54, 5555.55];

        for (const amount of amounts) {
          vi.clearAllMocks();
          mockSupabase = { from: vi.fn() };
          mockCreateClient.mockResolvedValue(mockSupabase);

          const mockQuery = {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: 'release-1' }],
                error: null,
              }),
            }),
          };
          mockSupabase.from.mockReturnValue(mockQuery);

          const result = await releaseMilestonePayment({
            supabase: mockSupabase,
            campaign_id: 'campaign-1',
            milestone_number: 1,
            campaign_total_sgd: amount,
          });

          // Verify no fractional cents beyond 2 decimal places
          const decimalStr = String(result.amount_released).split('.')[1] || '';
          expect(decimalStr.length).toBeLessThanOrEqual(2);
        }
      });
    });

    describe('Invalid milestone validation', () => {
      it('should reject milestone_number 0', async () => {
        await expect(
          releaseMilestonePayment({
            supabase: mockSupabase,
            campaign_id: 'campaign-1',
            milestone_number: 0 as any,
            campaign_total_sgd: 1000,
          })
        ).rejects.toThrow('Invalid milestone number: 0');
      });

      it('should reject milestone_number 4', async () => {
        await expect(
          releaseMilestonePayment({
            supabase: mockSupabase,
            campaign_id: 'campaign-1',
            milestone_number: 4 as any,
            campaign_total_sgd: 1000,
          })
        ).rejects.toThrow('Invalid milestone number: 4');
      });

      it('should reject negative milestone_number', async () => {
        await expect(
          releaseMilestonePayment({
            supabase: mockSupabase,
            campaign_id: 'campaign-1',
            milestone_number: -1 as any,
            campaign_total_sgd: 1000,
          })
        ).rejects.toThrow('Invalid milestone number: -1');
      });

      it('should reject milestone_number > 3', async () => {
        await expect(
          releaseMilestonePayment({
            supabase: mockSupabase,
            campaign_id: 'campaign-1',
            milestone_number: 999 as any,
            campaign_total_sgd: 1000,
          })
        ).rejects.toThrow('Invalid milestone number: 999');
      });
    });

    describe('Database error handling', () => {
      it('should handle database insert error gracefully', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Unique constraint violation' },
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 1,
          campaign_total_sgd: 1000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unique constraint violation');
        expect(result.amount_released).toBeUndefined();
      });

      it('should handle connection timeout errors', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection timeout' },
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 2,
          campaign_total_sgd: 5000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Connection timeout');
      });

      it('should return error object with message when insert fails', async () => {
        const errorMsg = 'Foreign key constraint violation';
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: errorMsg },
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 3,
          campaign_total_sgd: 1000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe(errorMsg);
      });
    });

    describe('Null safety - select returns no data', () => {
      it('should handle empty data array from select()', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 1,
          campaign_total_sgd: 1000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to insert escrow release');
      });

      it('should handle null data from select()', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 3,
          campaign_total_sgd: 2000,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to insert escrow release');
      });

      it('should prevent silent failures from select() returning nothing', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 1,
          campaign_total_sgd: 100,
        });

        // Should not silently succeed
        expect(result.success).toBe(false);
        // Should provide clear error message
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      });
    });

    describe('Correct amounts in escrow_releases row', () => {
      it('should verify exact insert parameters for milestone 1 (40%)', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-1' }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-abc',
          milestone_number: 1,
          campaign_total_sgd: 12345.67,
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        expect(insertCall).toMatchObject({
          campaign_id: 'campaign-abc',
          milestone_number: 1,
          amount_sgd: 4938.27,
          reason: 'milestone_approved',
          released_at: expect.any(String),
        });
      });

      it('should verify exact insert parameters for milestone 2 (40%)', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-2' }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-xyz',
          milestone_number: 2,
          campaign_total_sgd: 25000,
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        expect(insertCall).toMatchObject({
          campaign_id: 'campaign-xyz',
          milestone_number: 2,
          amount_sgd: 10000,
          reason: 'milestone_approved',
        });
      });

      it('should verify exact insert parameters for milestone 3 (20%)', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-3' }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-final',
          milestone_number: 3,
          campaign_total_sgd: 50000,
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        expect(insertCall).toMatchObject({
          campaign_id: 'campaign-final',
          milestone_number: 3,
          amount_sgd: 10000,
          reason: 'milestone_approved',
        });
      });

      it('should verify released_at timestamp is ISO string', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'release-1' }],
              error: null,
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await releaseMilestonePayment({
          supabase: mockSupabase,
          campaign_id: 'campaign-1',
          milestone_number: 1,
          campaign_total_sgd: 1000,
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        // Verify it's a valid ISO string
        expect(() => new Date(insertCall.released_at)).not.toThrow();
        expect(insertCall.released_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });
  });

  // ============================================================================
  // holdPaymentInEscrow() Tests
  // ============================================================================

  describe('holdPaymentInEscrow()', () => {
    describe('Successful hold', () => {
      it('should update pledge with escrow_held=true and timestamp', async () => {
        const pledgeId = 'pledge-1';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: pledgeId, escrow_held: true }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await holdPaymentInEscrow(pledgeId);

        expect(result.success).toBe(true);
        expect(result.held).toBe(true);
      });

      it('should verify escrow_held_at timestamp is set to current time', async () => {
        const pledgeId = 'pledge-2';
        const beforeCall = new Date();

        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: pledgeId, escrow_held: true }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await holdPaymentInEscrow(pledgeId);
        const afterCall = new Date();

        const updateCall = mockQuery.update.mock.calls[0][0];
        const heldAtTime = new Date(updateCall.escrow_held_at);

        // Timestamp should be between before and after call
        expect(heldAtTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
        expect(heldAtTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
      });

      it('should call update with correct structure', async () => {
        const pledgeId = 'pledge-3';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: pledgeId }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await holdPaymentInEscrow(pledgeId);

        const updateCall = mockQuery.update.mock.calls[0][0];
        expect(updateCall).toHaveProperty('escrow_held', true);
        expect(updateCall).toHaveProperty('escrow_held_at');
        expect(typeof updateCall.escrow_held_at).toBe('string');
      });
    });

    describe('Database error handling', () => {
      it('should handle database update error', async () => {
        const pledgeId = 'pledge-1';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await holdPaymentInEscrow(pledgeId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database connection failed');
      });

      it('should handle constraint violations', async () => {
        const pledgeId = 'pledge-1';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Constraint violation on pledges_id' },
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await holdPaymentInEscrow(pledgeId);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Constraint');
      });
    });

    describe('Null safety - select returns no data', () => {
      it('should handle pledge not found (empty result)', async () => {
        const pledgeId = 'nonexistent-pledge';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await holdPaymentInEscrow(pledgeId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to update pledge');
      });

      it('should handle null data from select()', async () => {
        const pledgeId = 'nonexistent-pledge';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await holdPaymentInEscrow(pledgeId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to update pledge');
      });

      it('should prevent silent failures when pledge not found', async () => {
        const pledgeId = 'nonexistent';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await holdPaymentInEscrow(pledgeId);

        // Should not silently succeed
        expect(result.success).toBe(false);
        // Should provide clear error
        expect(result.error).toBeDefined();
      });
    });

    describe('Integration - correct table and filtering', () => {
      it('should call update on pledges table with correct pledge_id', async () => {
        const pledgeId = 'pledge-123';
        const eqMock = vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: pledgeId }],
            error: null,
          }),
        });
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: eqMock,
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await holdPaymentInEscrow(pledgeId);

        expect(mockSupabase.from).toHaveBeenCalledWith('pledges');
        expect(eqMock).toHaveBeenCalledWith('id', pledgeId);
      });
    });
  });

  // ============================================================================
  // refundPledgeFromEscrow() Tests
  // ============================================================================

  describe('refundPledgeFromEscrow()', () => {
    describe('Successful refund', () => {
      it('should update pledge with refunded=true and timestamp', async () => {
        const pledgeId = 'pledge-1';
        const reason = 'milestone_missed';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: pledgeId, refunded: true }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await refundPledgeFromEscrow(pledgeId, reason);

        expect(result.success).toBe(true);
        expect(result.held).toBe(false);
      });

      it('should store refund reason correctly', async () => {
        const pledgeId = 'pledge-2';
        const reason = 'dispute_resolved_in_favor_of_backer';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: pledgeId, refunded: true }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await refundPledgeFromEscrow(pledgeId, reason);

        const updateCall = mockQuery.update.mock.calls[0][0];
        expect(updateCall.refund_reason).toBe(reason);
      });

      it('should handle different refund reasons', async () => {
        const reasons = ['milestone_missed', 'dispute_resolved', 'creator_request', 'platform_decision'];

        for (const reason of reasons) {
          vi.clearAllMocks();
          mockSupabase = { from: vi.fn() };
          mockCreateClient.mockResolvedValue(mockSupabase);

          const mockQuery = {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: 'pledge-1', refunded: true }],
                  error: null,
                }),
              }),
            }),
          };
          mockSupabase.from.mockReturnValue(mockQuery);

          const result = await refundPledgeFromEscrow('pledge-1', reason);

          expect(result.success).toBe(true);
          const updateCall = mockQuery.update.mock.calls[0][0];
          expect(updateCall.refund_reason).toBe(reason);
        }
      });

      it('should set escrow_held to false when refunding', async () => {
        const pledgeId = 'pledge-1';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: pledgeId, refunded: true, escrow_held: false }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await refundPledgeFromEscrow(pledgeId, 'test_reason');

        const updateCall = mockQuery.update.mock.calls[0][0];
        expect(updateCall.escrow_held).toBe(false);
        expect(updateCall.refunded).toBe(true);
      });
    });

    describe('Timestamp correctness', () => {
      it('should set refunded_at to current time', async () => {
        const pledgeId = 'pledge-1';
        const reason = 'test_reason';
        const beforeCall = new Date();

        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: pledgeId, refunded: true }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await refundPledgeFromEscrow(pledgeId, reason);
        const afterCall = new Date();

        const updateCall = mockQuery.update.mock.calls[0][0];
        const refundedAtTime = new Date(updateCall.refunded_at);

        expect(refundedAtTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
        expect(refundedAtTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
      });

      it('should verify refunded_at timestamp is ISO string', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: 'pledge-1' }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await refundPledgeFromEscrow('pledge-1', 'reason');

        const updateCall = mockQuery.update.mock.calls[0][0];
        expect(() => new Date(updateCall.refunded_at)).not.toThrow();
        expect(updateCall.refunded_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });

    describe('Database error handling', () => {
      it('should handle database update error', async () => {
        const pledgeId = 'pledge-1';
        const reason = 'test_reason';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error occurred' },
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await refundPledgeFromEscrow(pledgeId, reason);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database error occurred');
      });

      it('should handle constraint violations during refund', async () => {
        const pledgeId = 'pledge-1';
        const reason = 'test_reason';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Foreign key constraint violation' },
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await refundPledgeFromEscrow(pledgeId, reason);

        expect(result.success).toBe(false);
        expect(result.error).toContain('constraint');
      });
    });

    describe('Null safety - select returns no data', () => {
      it('should handle pledge not found (empty result)', async () => {
        const pledgeId = 'nonexistent-pledge';
        const reason = 'test_reason';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await refundPledgeFromEscrow(pledgeId, reason);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to refund pledge');
      });

      it('should handle null data from select()', async () => {
        const pledgeId = 'nonexistent-pledge';
        const reason = 'test_reason';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await refundPledgeFromEscrow(pledgeId, reason);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to refund pledge');
      });

      it('should prevent silent failures when pledge not found', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await refundPledgeFromEscrow('nonexistent', 'reason');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('Integration - correct table and filtering', () => {
      it('should call update on pledges table with correct pledge_id', async () => {
        const pledgeId = 'pledge-456';
        const reason = 'test_reason';
        const eqMock = vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: pledgeId }],
            error: null,
          }),
        });
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: eqMock,
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await refundPledgeFromEscrow(pledgeId, reason);

        expect(mockSupabase.from).toHaveBeenCalledWith('pledges');
        expect(eqMock).toHaveBeenCalledWith('id', pledgeId);
      });

      it('should verify all required fields are updated on refund', async () => {
        const pledgeId = 'pledge-1';
        const reason = 'milestone_missed';
        const mockQuery = {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: pledgeId }],
                error: null,
              }),
            }),
          }),
        };
        mockSupabase.from.mockReturnValue(mockQuery);

        await refundPledgeFromEscrow(pledgeId, reason);

        const updateCall = mockQuery.update.mock.calls[0][0];
        expect(updateCall).toHaveProperty('escrow_held', false);
        expect(updateCall).toHaveProperty('refunded', true);
        expect(updateCall).toHaveProperty('refund_reason', reason);
        expect(updateCall).toHaveProperty('refunded_at');
      });
    });
  });
});
