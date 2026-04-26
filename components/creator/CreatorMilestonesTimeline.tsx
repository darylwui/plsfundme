'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { formatDate } from '@/lib/utils/dates';
import { formatSgd } from '@/lib/utils/currency';
import type { MilestoneNumber, MilestoneProofData } from '@/lib/milestones/types';

export type CreatorMilestoneState =
  | 'upcoming'
  | 'late'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_info';

export interface PastAttempt {
  submitted_at: string;
  decision: string | null;
  feedback_text: string | null;
}

export interface CreatorMilestoneItem {
  number: MilestoneNumber;
  title: string;
  description: string;
  target_date: string;
  state: CreatorMilestoneState;
  latest_feedback: string | null;
  latest_submitted_at: string | null;
  latest_reviewed_at: string | null;
  escrow_released_sgd: number | null;
  past_attempts: PastAttempt[];
}

const STATE_PILL: Record<CreatorMilestoneState, string> = {
  upcoming: 'bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]',
  late: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  needs_info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const STATE_LABEL: Record<CreatorMilestoneState, string> = {
  upcoming: 'Upcoming',
  late: 'Past due',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected — please resubmit',
  needs_info: 'Needs more info',
};

const M_LABEL: Record<MilestoneNumber, string> = {
  1: 'Tooling',
  2: 'Production',
  3: 'Fulfillment',
};

export function CreatorMilestonesTimeline({
  campaignId,
  milestones,
}: {
  campaignId: string;
  milestones: CreatorMilestoneItem[];
}) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)] py-8 text-center">
        This campaign has no milestones defined yet.
      </p>
    );
  }

  // Order gate: M2 unlocks once M1 approved; M3 unlocks once M2 approved.
  // Creators can still submit out of order if the platform admin overrides
  // by manually approving an earlier milestone — this is a soft block, not a
  // hard one in the API.
  const approvedByNumber = new Set(
    milestones.filter((m) => m.state === 'approved').map((m) => m.number),
  );

  return (
    <div className="flex flex-col gap-4">
      {milestones.map((m) => {
        const blocked =
          (m.number === 2 && !approvedByNumber.has(1)) ||
          (m.number === 3 && !approvedByNumber.has(2));
        return (
          <MilestoneCard
            key={m.number}
            campaignId={campaignId}
            milestone={m}
            blockedByOrder={blocked}
          />
        );
      })}
    </div>
  );
}

function MilestoneCard({
  campaignId,
  milestone: m,
  blockedByOrder,
}: {
  campaignId: string;
  milestone: CreatorMilestoneItem;
  blockedByOrder: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [proof, setProof] = useState<MilestoneProofData>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseCanSubmit =
    m.state === 'upcoming' ||
    m.state === 'late' ||
    m.state === 'rejected' ||
    m.state === 'needs_info';
  const canSubmit = baseCanSubmit && !blockedByOrder;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/milestone-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_number: m.number,
          proof_data: proof,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Submit failed');
      setShowForm(false);
      setProof({});
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
      <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[var(--color-ink)]">
              M{m.number} — {M_LABEL[m.number]}: {m.title}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATE_PILL[m.state]}`}
            >
              {STATE_LABEL[m.state]}
            </span>
          </div>
          {m.description && (
            <p className="text-sm text-[var(--color-ink-muted)]">{m.description}</p>
          )}
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Target: {formatDate(m.target_date)}
            {m.latest_submitted_at && ` · Last submitted ${formatDate(m.latest_submitted_at)}`}
          </p>
        </div>
        {m.escrow_released_sgd !== null && (
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Escrow released
            </p>
            <p className="font-bold text-[var(--color-ink)]">
              {formatSgd(m.escrow_released_sgd)}
            </p>
          </div>
        )}
      </header>

      <div className="px-5 py-4 flex flex-col gap-3">
        {m.latest_feedback && (
          <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
              Admin feedback
            </p>
            <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed">
              {m.latest_feedback}
            </p>
          </div>
        )}

        {m.state === 'under_review' && (
          <p className="text-sm text-[var(--color-ink-muted)] italic">
            Your proof is under review. We&apos;ll email you once it&apos;s been reviewed.
          </p>
        )}

        {m.state === 'approved' && m.latest_reviewed_at && (
          <p className="text-sm text-[var(--color-ink-muted)]">
            Approved on {formatDate(m.latest_reviewed_at)}.
          </p>
        )}

        {/* Order-gate explainer */}
        {baseCanSubmit && blockedByOrder && (
          <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-[var(--color-ink-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
              Submit and get approval for M{m.number - 1} first. Milestones unlock in
              order so backers see a clean delivery timeline.
            </p>
          </div>
        )}

        {canSubmit && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="secondary"
            size="sm"
            className="self-start"
          >
            {m.state === 'rejected' || m.state === 'needs_info'
              ? 'Resubmit proof'
              : 'Submit proof'}
          </Button>
        )}

        {canSubmit && showForm && (
          <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-4">
            <ProofFields milestoneNumber={m.number} value={proof} onChange={setProof} />

            {error && <p className="text-xs text-[var(--color-brand-danger)]">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setProof({});
                  setError(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} loading={submitting}>
                {submitting ? 'Submitting…' : 'Submit for review'}
              </Button>
            </div>
          </div>
        )}

        {/* Past attempts — show only if there are any */}
        {m.past_attempts.length > 0 && (
          <div className="border-t border-[var(--color-border)] pt-3 mt-1">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              {showHistory ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {m.past_attempts.length} earlier{' '}
              {m.past_attempts.length === 1 ? 'attempt' : 'attempts'}
            </button>
            {showHistory && (
              <div className="mt-2 flex flex-col gap-2">
                {m.past_attempts.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2"
                  >
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      Submitted {formatDate(a.submitted_at)}
                      {a.decision &&
                        ` · ${a.decision === 'needs_info' ? 'Needed more info' : a.decision === 'rejected' ? 'Rejected' : 'Approved'}`}
                    </p>
                    {a.feedback_text && (
                      <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed mt-1">
                        {a.feedback_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ProofFields({
  milestoneNumber,
  value,
  onChange,
}: {
  milestoneNumber: MilestoneNumber;
  value: MilestoneProofData;
  onChange: (v: MilestoneProofData) => void;
}) {
  if (milestoneNumber === 1 || milestoneNumber === 2) {
    const letterLabel =
      milestoneNumber === 1 ? 'Factory contract' : 'Production timeline letter';
    const letterHint =
      milestoneNumber === 1
        ? 'Paste the contract or letter from your factory confirming your tooling order. Should mention units, deposit paid, and start date.'
        : 'Paste the letter from your factory confirming production is underway. Should mention units in production, QA results, and ETA to completion.';
    const photoLabel =
      milestoneNumber === 1
        ? 'Photo of the signed contract or deposit receipt'
        : 'Photo of the production line or completed batch';
    const photoHint =
      milestoneNumber === 1
        ? 'A clear photo of the signed agreement or deposit receipt — anything that ties the contract to a real, verifiable factory.'
        : 'Date-stamped if possible. Backers and admin should be able to see the product physically being made.';

    return (
      <>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
            {letterLabel}
          </label>
          <textarea
            value={value.letter_text ?? ''}
            onChange={(e) => onChange({ ...value, letter_text: e.target.value })}
            placeholder={
              milestoneNumber === 1
                ? 'e.g., "This confirms MochiCloud has signed a manufacturing agreement with Eco-Pack Industries for 5,000 units of compostable packaging starting Q3 2026. Deposit of $15,000 received."'
                : 'e.g., "Units 1–2,500 are on the production line. QA passed for the first batch. Final batch ready for QA in 10 days."'
            }
            rows={5}
            className="w-full px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
          />
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">{letterHint}</p>
        </div>
        <div>
          <ImageUpload
            label={photoLabel}
            value={value.photos_url ?? null}
            onChange={(url) => onChange({ ...value, photos_url: url ?? undefined })}
            hint={photoHint}
          />
        </div>
      </>
    );
  }

  // M3 — Fulfillment
  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
          Tracking numbers
        </label>
        <textarea
          value={value.tracking_numbers?.join('\n') ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              tracking_numbers: e.target.value.split('\n').map((t) => t.trim()).filter(Boolean),
            })
          }
          placeholder={'DHL5829471026\nFDX99281736\nSGT00012ABCD'}
          rows={6}
          className="w-full px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
        />
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          One tracking number per line. DHL, FedEx, SingPost, or any traceable carrier
          works. We&apos;ll spot-check a few before approving.
        </p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
          Fulfillment summary
        </label>
        <input
          type="text"
          value={value.fulfillment_summary ?? ''}
          onChange={(e) => onChange({ ...value, fulfillment_summary: e.target.value })}
          placeholder="e.g., Shipped 100/100 units, ETA arrival 2026-05-15"
          className="w-full px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
        />
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          One-line summary: how many units shipped, expected arrival window, any
          delays.
        </p>
      </div>
    </>
  );
}
