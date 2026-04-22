import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateMilestoneProof, normalizeMilestoneProof } from '@/lib/milestones/proofs';
import type { MilestoneNumber, MilestoneProofData } from '@/lib/milestones/types';

export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  const { campaignId } = params;

  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const { milestone_number, proof_data } = await req.json();

    // Validate milestone number
    if (![1, 2, 3].includes(milestone_number)) {
      return NextResponse.json({ error: 'Invalid milestone number' }, { status: 400 });
    }

    // Validate proof
    const validation = validateMilestoneProof(milestone_number as MilestoneNumber, proof_data);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify campaign ownership (creator can only submit for their own campaign)
    const { data: campaign, error: campaignError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || campaign?.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Normalize proof data
    const normalizedProof = normalizeMilestoneProof(proof_data);

    // Insert submission
    const { data: submission, error: submitError } = await supabase
      .from('milestone_submissions')
      .insert({
        campaign_id: campaignId,
        creator_id: user.id,
        milestone_number,
        proof_data: normalizedProof,
        status: 'pending',
      })
      .select()
      .single();

    if (submitError) {
      return NextResponse.json({ error: submitError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    console.error('Milestone submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
