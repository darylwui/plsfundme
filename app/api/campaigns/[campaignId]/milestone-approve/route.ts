import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { releaseMilestonePayment } from '@/lib/milestones/escrow';

interface RouteContext {
  params: Promise<{ campaignId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { campaignId } = await params;

  try {
    // Get authenticated user (must be admin)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin (add role-based access control)

    // Parse request
    const { submission_id, decision, feedback_text } = await req.json();

    if (!['approved', 'rejected', 'needs_info'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Get submission details
    const { data: submission, error: subError } = await supabase
      .from('milestone_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('milestone_submissions')
      .update({ status: decision })
      .eq('id', submission_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Record approval
    const { data: approval, error: approvalError } = await supabase
      .from('milestone_approvals')
      .insert({
        submission_id,
        approved_by: user.id,
        decision,
        feedback_text,
      })
      .select()
      .single();

    if (approvalError) {
      return NextResponse.json({ error: approvalError.message }, { status: 500 });
    }

    // If approved, release funds from escrow
    if (decision === 'approved') {
      // Get campaign total to calculate payout
      const { data: campaign } = await supabase
        .from('projects')
        .select('amount_pledged_sgd')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        const releaseResult = await releaseMilestonePayment({
          campaign_id: campaignId,
          milestone_number: submission.milestone_number,
          campaign_total_sgd: campaign.amount_pledged_sgd,
        });

        if (!releaseResult.success) {
          // Log error but still return success (approval recorded; release failed separately)
          console.error('Escrow release failed:', releaseResult.error);
        }
      }
    }

    return NextResponse.json({ success: true, approval }, { status: 200 });
  } catch (error) {
    console.error('Milestone approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
