import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      100
    );

    // Validate status if provided
    const validStatuses = ['pending', 'approved', 'rejected', 'needs_info'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('milestone_submissions')
      .select(
        `
        id,
        campaign_id,
        creator_id,
        milestone_number,
        proof_data,
        submitted_at,
        status,
        created_at,
        projects (
          title,
          slug,
          creator_id
        ),
        profiles!creator_id (
          display_name
        )
        `,
        { count: 'exact' }
      );

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Sort by created_at descending and apply pagination
    const { data: submissions, count, error: queryError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Fetch latest approvals for non-pending submissions in this page so we can
    // surface the decision + feedback in the queue UI.
    const submissionIds = (submissions ?? []).map((s: { id: string }) => s.id);
    const approvalBySubmissionId = new Map<
      string,
      { decision: string; feedback_text: string | null; reviewed_at: string }
    >();
    if (submissionIds.length > 0) {
      const { data: approvals } = await supabase
        .from('milestone_approvals')
        .select('submission_id, decision, feedback_text, reviewed_at')
        .in('submission_id', submissionIds)
        .order('reviewed_at', { ascending: false });
      for (const a of approvals ?? []) {
        // First write wins because we ordered desc — that's the latest.
        if (!approvalBySubmissionId.has(a.submission_id)) {
          approvalBySubmissionId.set(a.submission_id, {
            decision: a.decision,
            feedback_text: a.feedback_text,
            reviewed_at: a.reviewed_at,
          });
        }
      }
    }

    // Transform response
    const transformedSubmissions = submissions?.map((submission: any) => ({
      id: submission.id,
      campaign_id: submission.campaign_id,
      campaign_name: submission.projects?.title || 'Unknown Campaign',
      campaign_slug: submission.projects?.slug || null,
      creator_id: submission.creator_id,
      creator_name: submission.profiles?.display_name || 'Unknown Creator',
      milestone_number: submission.milestone_number,
      status: submission.status,
      proof_data: submission.proof_data,
      submitted_at: submission.submitted_at,
      created_at: submission.created_at,
      approval: approvalBySubmissionId.get(submission.id) ?? null,
    })) || [];

    // Counts per status for the tab badges. Cheap because the table is small
    // and we're only selecting one column.
    const counts = { pending: 0, approved: 0, rejected: 0, needs_info: 0 };
    const { data: allStatuses } = await supabase
      .from('milestone_submissions')
      .select('status');
    for (const row of allStatuses ?? []) {
      const s = row.status as keyof typeof counts;
      if (s in counts) counts[s] += 1;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json(
      {
        submissions: transformedSubmissions,
        total: count || 0,
        page,
        limit,
        pages: totalPages,
        counts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Milestone list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
