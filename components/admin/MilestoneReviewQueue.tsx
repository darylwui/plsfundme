'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MilestoneDecision, MilestoneNumber, MilestoneProofData, MilestoneSubmissionStatus } from '@/lib/milestones/types';

interface SubmissionRow {
  id: string;
  campaign_id: string;
  campaign_name: string;
  campaign_slug: string | null;
  creator_id: string;
  creator_name: string;
  milestone_number: MilestoneNumber;
  status: MilestoneSubmissionStatus;
  proof_data: MilestoneProofData;
  submitted_at: string;
  created_at: string;
}

const STATUS_PILL: Record<MilestoneSubmissionStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  needs_info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const STATUS_LABEL: Record<MilestoneSubmissionStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  needs_info: 'Needs info',
};

const MILESTONE_LABEL: Record<MilestoneNumber, string> = {
  1: 'M1 — Tooling',
  2: 'M2 — Production',
  3: 'M3 — Fulfillment',
};

export function MilestoneReviewQueue() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/milestones?status=pending')
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  function removeSubmission(id: string) {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-ink-muted)]" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)] py-8 text-center">
        No pending milestone submissions.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => (
        <SubmissionCard key={s.id} submission={s} onDecision={removeSubmission} />
      ))}
    </div>
  );
}

function SubmissionCard({
  submission,
  onDecision,
}: {
  submission: SubmissionRow;
  onDecision: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [deciding, setDeciding] = useState<MilestoneDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDecision(decision: MilestoneDecision) {
    setDeciding(decision);
    setError(null);
    try {
      const res = await fetch(
        `/api/campaigns/${submission.campaign_id}/milestone-approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: submission.id,
            decision,
            feedback_text: feedback.trim() || undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Request failed');
      onDecision(submission.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeciding(null);
    }
  }

  const submitted = new Date(submission.submitted_at).toLocaleString('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const projectHref = submission.campaign_slug
    ? `/projects/${submission.campaign_slug}`
    : null;

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
      <header className="flex items-start justify-between gap-4 px-5 py-3 border-b border-[var(--color-border)]">
        <div className="min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {projectHref ? (
              <Link
                href={projectHref}
                target="_blank"
                className="font-bold text-[var(--color-ink)] hover:text-[var(--color-brand-crust)] inline-flex items-center gap-1 truncate"
              >
                {submission.campaign_name}
                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
              </Link>
            ) : (
              <span className="font-bold text-[var(--color-ink)]">
                {submission.campaign_name}
              </span>
            )}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_PILL[submission.status]}`}
            >
              {STATUS_LABEL[submission.status]}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]">
              {MILESTONE_LABEL[submission.milestone_number]}
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            {submission.creator_name} · submitted {submitted}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Close' : 'Review'}
        </Button>
      </header>

      {expanded && (
        <div className="px-5 py-4 flex flex-col gap-4">
          <ProofDisplay
            milestoneNumber={submission.milestone_number}
            proof={submission.proof_data}
          />

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
              Feedback to creator
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional for approval — recommended when requesting info or rejecting."
              rows={3}
              className="w-full px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
            />
          </div>

          {error && (
            <p className="text-xs text-[var(--color-brand-danger)]">{error}</p>
          )}

          <div className="flex gap-2 justify-end flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              disabled={deciding !== null}
              onClick={() => handleDecision('rejected')}
              loading={deciding === 'rejected'}
            >
              Reject
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={deciding !== null}
              onClick={() => handleDecision('needs_info')}
              loading={deciding === 'needs_info'}
            >
              Request info
            </Button>
            <Button
              size="sm"
              disabled={deciding !== null}
              onClick={() => handleDecision('approved')}
              loading={deciding === 'approved'}
            >
              Approve &amp; release escrow
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function ProofDisplay({
  milestoneNumber,
  proof,
}: {
  milestoneNumber: MilestoneNumber;
  proof: MilestoneProofData;
}) {
  if (milestoneNumber === 1 || milestoneNumber === 2) {
    return (
      <div className="flex flex-col gap-3">
        {proof.letter_text && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
              {milestoneNumber === 1 ? 'Factory contract' : 'Production timeline letter'}
            </p>
            <blockquote className="bg-[var(--color-surface-raised)] border-l-2 border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap rounded-r-[var(--radius-btn)]">
              {proof.letter_text}
            </blockquote>
          </div>
        )}
        {proof.photos_url && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
              {milestoneNumber === 1 ? 'Contract photo' : 'Factory floor photo'}
            </p>
            <a
              href={proof.photos_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-brand-crust)] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View photo
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {proof.fulfillment_summary && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
            Fulfillment summary
          </p>
          <p className="text-sm text-[var(--color-ink)]">{proof.fulfillment_summary}</p>
        </div>
      )}
      {proof.tracking_numbers && proof.tracking_numbers.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
            Tracking numbers ({proof.tracking_numbers.length})
          </p>
          <ul className="flex flex-col gap-0.5">
            {proof.tracking_numbers.map((t) => (
              <li key={t} className="font-mono text-sm text-[var(--color-ink)]">
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
