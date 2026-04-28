import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MilestoneNumber } from './types';

interface ReleaseMilestonePaymentInput {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>;
  campaign_id: string;
  milestone_number: MilestoneNumber;
  campaign_total_sgd: number;
}

interface ReleaseMilestonePaymentResult {
  success: boolean;
  amount_released?: number;
  reason?: string;
  error?: string;
  /**
   * True when the release row already existed (Postgres unique_violation
   * on `(campaign_id, milestone_number)`) — i.e. a concurrent admin
   * approval or a retried request beat us to the insert. Caller should
   * short-circuit duplicate side-effects (emails, notifications) when
   * this is set, rather than treating it like a generic failure.
   */
  already_released?: boolean;
}

/**
 * Calculate payout percentage based on milestone number
 */
function getPayoutPercentage(milestone_number: MilestoneNumber): number {
  if (milestone_number === 1) return 0.4; // 40%
  if (milestone_number === 2) return 0.4; // 40%
  if (milestone_number === 3) return 0.2; // 20%
  throw new Error(`Invalid milestone number: ${milestone_number}`);
}

/**
 * Release funds from escrow upon milestone approval
 */
export async function releaseMilestonePayment(
  input: ReleaseMilestonePaymentInput
): Promise<ReleaseMilestonePaymentResult> {
  const { supabase, campaign_id, milestone_number, campaign_total_sgd } = input;

  const percentage = getPayoutPercentage(milestone_number);
  const amount_sgd = Math.round(campaign_total_sgd * percentage * 100) / 100;

  const { data, error } = await supabase
    .from('escrow_releases')
    .insert({
      campaign_id,
      milestone_number,
      amount_sgd,
      released_at: new Date().toISOString(),
      reason: 'milestone_approved',
    })
    .select();

  if (error) {
    // Postgres unique_violation on (campaign_id, milestone_number):
    // another insert beat us to it. Surface as a distinct flag so
    // the caller skips duplicate emails/notifications instead of
    // treating it like a generic failure.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === '23505') {
      return {
        success: false,
        error: 'Escrow release already exists for this milestone',
        already_released: true,
      };
    }
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'Failed to insert escrow release',
    };
  }

  return {
    success: true,
    amount_released: amount_sgd,
    reason: 'milestone_approved',
  };
}

interface HoldPaymentResult {
  success: boolean;
  held?: boolean;
  error?: string;
}

/**
 * Mark a pledge as held in escrow (non-refundable until milestone hit)
 */
export async function holdPaymentInEscrow(pledge_id: string): Promise<HoldPaymentResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pledges')
    .update({
      escrow_held: true,
      escrow_held_at: new Date().toISOString(),
    })
    .eq('id', pledge_id)
    .select();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'Failed to update pledge',
    };
  }

  return {
    success: true,
    held: true,
  };
}

/**
 * Refund a pledge (from escrow, when dispute resolved or milestone missed)
 */
export async function refundPledgeFromEscrow(pledge_id: string, reason: string): Promise<HoldPaymentResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pledges')
    .update({
      escrow_held: false,
      refunded: true,
      refund_reason: reason,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', pledge_id)
    .select();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'Failed to refund pledge',
    };
  }

  return {
    success: true,
    held: false,
  };
}
