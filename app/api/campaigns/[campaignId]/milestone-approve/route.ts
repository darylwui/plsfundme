import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { releaseMilestonePayment } from '@/lib/milestones/escrow';
import {
  sendMilestoneApprovedToCreatorEmail,
  sendMilestoneApprovedToBackerEmail,
  sendMilestoneNeedsActionEmail,
} from '@/lib/email/templates';

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

    // Idempotency guard — once a submission has been reviewed, refuse repeat
    // decisions. Prevents duplicate milestone_approvals + escrow_releases rows
    // (no UNIQUE constraint on either table) and prevents re-firing emails.
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission has already been reviewed', status: submission.status },
        { status: 409 }
      );
    }

    // Load the project + creator NOW — we need creator.stripe_account_id
    // for the Stripe Connect pre-flight below, and we need to do that
    // check BEFORE writing any approval records. If the creator hasn't
    // completed payout onboarding, the downstream payout job has
    // nowhere to send the released funds — and the admin gets no
    // signal that anything went wrong (the escrow_release row gets
    // written, the email goes out, but no money actually moves).
    // Refusing here surfaces it while it's still actionable: admin
    // nudges creator, creator finishes onboarding, admin re-clicks
    // Approve and the release goes through cleanly.
    const { data: project, error: projectError } = await service
      .from('projects')
      .select(
        'id, title, slug, amount_pledged_sgd, creator_id, creator:profiles!creator_id(display_name, email, stripe_account_id)',
      )
      .eq('id', campaignId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Failed to load project for approval' },
        { status: 500 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = project as any;
    const creatorEmail = p.creator?.email;
    const creatorName = p.creator?.display_name;
    const creatorStripeAccountId = p.creator?.stripe_account_id as string | null;
    const projectTitle = p.title;
    const projectSlug = p.slug;
    const milestoneNumber = submission.milestone_number as 1 | 2 | 3;

    if (decision === 'approved' && !creatorStripeAccountId) {
      return NextResponse.json(
        {
          error:
            "Creator hasn't completed Stripe Connect onboarding. Ask them to finish their payout setup, then re-approve this milestone.",
          status: 'creator_payouts_not_setup',
        },
        { status: 400 },
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

    if (decision === 'approved') {
      // Insert escrow_releases row
      const releaseResult = await releaseMilestonePayment({
        supabase: service,
        campaign_id: campaignId,
        milestone_number: milestoneNumber,
        campaign_total_sgd: p.amount_pledged_sgd,
      });

      // Race / retry: another approval already inserted the release.
      // Bail out before emailing — the original approval already
      // notified the creator and backers. Returning 409 lets the
      // calling UI show "already approved" instead of pretending
      // we did the work.
      if (releaseResult.already_released) {
        return NextResponse.json(
          {
            error: 'This milestone has already been released',
            status: 'already_released',
          },
          { status: 409 },
        );
      }

      if (!releaseResult.success) {
        console.error('Escrow release insert failed:', releaseResult.error);
      }
      const escrowReleasedSgd = releaseResult.amount_released ?? 0;

      // Email creator
      if (creatorEmail) {
        sendMilestoneApprovedToCreatorEmail({
          creatorEmail,
          creatorName,
          projectId: campaignId,
          projectTitle,
          milestoneNumber,
          escrowReleasedSgd,
        }).catch(console.error);
      }

      // Email backers whose money is in escrow
      const { data: backers } = await service
        .from('pledges')
        .select('backer:profiles!backer_id(display_name, email)')
        .eq('project_id', campaignId)
        .in('status', ['captured', 'paynow_captured']);

      for (const pledge of backers ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = (pledge as any).backer;
        if (!b?.email) continue;
        sendMilestoneApprovedToBackerEmail({
          backerEmail: b.email,
          backerName: b.display_name,
          creatorName,
          projectTitle,
          projectSlug,
          milestoneNumber,
          escrowReleasedSgd,
        }).catch(console.error);
      }
    } else if (decision === 'rejected' || decision === 'needs_info') {
      if (creatorEmail) {
        sendMilestoneNeedsActionEmail({
          creatorEmail,
          creatorName,
          projectId: campaignId,
          projectTitle,
          milestoneNumber,
          decision,
          feedbackText: feedback_text || undefined,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, approval }, { status: 200 });
  } catch (error) {
    console.error('Milestone approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
