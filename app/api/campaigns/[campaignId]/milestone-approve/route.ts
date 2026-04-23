import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ campaignId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { campaignId } = await params;

  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has admin privileges
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to verify admin status' },
        { status: 500 }
      );
    }

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Only admins can approve milestones' },
        { status: 403 }
      );
    }

    // Parse request
    const { submission_id, decision, feedback_text } = await req.json();

    // Validate input
    if (!submission_id) {
      return NextResponse.json(
        { error: 'submission_id is required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'needs_info'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be one of: approved, rejected, needs_info' },
        { status: 400 }
      );
    }

    // Use service client for administrative operations
    const service = createServiceClient();

    // Verify submission exists and belongs to the campaign
    const { data: submission, error: submissionError } = await service
      .from('milestone_submissions')
      .select('id, campaign_id, milestone_number, status')
      .eq('id', submission_id)
      .eq('campaign_id', campaignId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Create approval record
    const { data: approval, error: approvalError } = await service
      .from('milestone_approvals')
      .insert({
        submission_id,
        approved_by: user.id,
        decision,
        feedback_text: feedback_text || null,
      })
      .select()
      .single();

    if (approvalError) {
      return NextResponse.json(
        { error: approvalError.message },
        { status: 500 }
      );
    }

    // Update submission status
    const { error: updateError } = await service
      .from('milestone_submissions')
      .update({ status: decision })
      .eq('id', submission_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, approval }, { status: 200 });
  } catch (error) {
    console.error('Milestone approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
