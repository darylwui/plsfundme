import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  CreatorMilestonesTimeline,
  type CreatorMilestoneItem,
  type CreatorMilestoneState,
} from '@/components/creator/CreatorMilestonesTimeline';
import type { MilestoneNumber } from '@/lib/milestones/types';

export const metadata = { title: 'Milestones' };

interface Props {
  params: Promise<{ projectId: string }>;
}

interface MilestonePromise {
  title: string;
  description: string;
  target_date: string;
}

function isMilestonePromiseArray(v: unknown): v is MilestonePromise[] {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    v.every(
      (m) =>
        m &&
        typeof m === 'object' &&
        typeof (m as { title?: unknown }).title === 'string' &&
        typeof (m as { description?: unknown }).description === 'string' &&
        typeof (m as { target_date?: unknown }).target_date === 'string',
    )
  );
}

export default async function CreatorMilestonesPage({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/projects/${projectId}/milestones`);
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, slug, status, creator_id, milestones')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single();

  if (!project || project.creator_id !== user.id) {
    notFound();
  }

  const { data: submissions } = await supabase
    .from('milestone_submissions')
    .select('id, milestone_number, status, submitted_at')
    .eq('campaign_id', projectId)
    .order('submitted_at', { ascending: false });

  const submissionIds = (submissions ?? []).map((s) => s.id);
  let approvals: Array<{
    submission_id: string;
    decision: string;
    feedback_text: string | null;
    reviewed_at: string;
  }> = [];
  if (submissionIds.length > 0) {
    const { data } = await supabase
      .from('milestone_approvals')
      .select('submission_id, decision, feedback_text, reviewed_at')
      .in('submission_id', submissionIds)
      .order('reviewed_at', { ascending: false });
    approvals = data ?? [];
  }

  const { data: releases } = await supabase
    .from('escrow_releases')
    .select('milestone_number, amount_sgd')
    .eq('campaign_id', projectId);

  // Latest submission per milestone (rows are ordered desc, first wins)
  type SubmissionRow = {
    id: string;
    milestone_number: number;
    status: string;
    submitted_at: string;
  };
  const latestSubmissionByMilestone = new Map<number, SubmissionRow>();
  for (const s of (submissions ?? []) as SubmissionRow[]) {
    if (!latestSubmissionByMilestone.has(s.milestone_number)) {
      latestSubmissionByMilestone.set(s.milestone_number, s);
    }
  }

  // Latest approval per submission_id (rows are ordered desc, first wins)
  const latestApprovalBySubmissionId = new Map<string, (typeof approvals)[number]>();
  for (const a of approvals) {
    if (!latestApprovalBySubmissionId.has(a.submission_id)) {
      latestApprovalBySubmissionId.set(a.submission_id, a);
    }
  }

  const releaseByMilestone = new Map<number, number>();
  for (const r of releases ?? []) {
    releaseByMilestone.set(r.milestone_number, r.amount_sgd);
  }

  const promises = (project as { milestones?: unknown }).milestones;
  const now = Date.now();
  const milestones: CreatorMilestoneItem[] = isMilestonePromiseArray(promises)
    ? promises.map((p, i) => {
        const number = (i + 1) as MilestoneNumber;
        const submission = latestSubmissionByMilestone.get(number);
        const approval = submission ? latestApprovalBySubmissionId.get(submission.id) : undefined;

        let state: CreatorMilestoneState;
        if (approval?.decision === 'approved') state = 'approved';
        else if (approval?.decision === 'rejected') state = 'rejected';
        else if (approval?.decision === 'needs_info') state = 'needs_info';
        else if (submission) state = 'under_review';
        else if (new Date(p.target_date).getTime() < now) state = 'late';
        else state = 'upcoming';

        return {
          number,
          title: p.title,
          description: p.description,
          target_date: p.target_date,
          state,
          latest_feedback: approval?.feedback_text ?? null,
          latest_submitted_at: submission?.submitted_at ?? null,
          latest_reviewed_at: approval?.reviewed_at ?? null,
          escrow_released_sgd: releaseByMilestone.get(number) ?? null,
        };
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] self-start"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to projects
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Milestones</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            {project.title}
          </p>
        </div>
      </div>

      <CreatorMilestonesTimeline campaignId={project.id} milestones={milestones} />
    </div>
  );
}
