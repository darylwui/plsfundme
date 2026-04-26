'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="flex flex-col gap-4">
      {milestones.map((m) => (
        <MilestoneCard key={m.number} campaignId={campaignId} milestone={m} />
      ))}
    </div>
  );
}

function MilestoneCard({
  campaignId,
  milestone: m,
}: {
  campaignId: string;
  milestone: CreatorMilestoneItem;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [proof, setProof] = useState<MilestoneProofData>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    m.state === 'upcoming' ||
    m.state === 'late' ||
    m.state === 'rejected' ||
    m.state === 'needs_info';

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
    const letterPlaceholder =
      milestoneNumber === 1
        ? 'Paste the factory contract or letter confirming your tooling order…'
        : 'Paste the factory letter confirming production is underway…';
    const photoLabel =
      milestoneNumber === 1 ? 'Contract photo URL' : 'Factory floor photo URL';

    return (
      <>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
            {letterLabel}
          </label>
          <textarea
            value={value.letter_text ?? ''}
            onChange={(e) => onChange({ ...value, letter_text: e.target.value })}
            placeholder={letterPlaceholder}
            rows={5}
            className="w-full px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
            {photoLabel}
          </label>
          <input
            type="url"
            value={value.photos_url ?? ''}
            onChange={(e) => onChange({ ...value, photos_url: e.target.value })}
            placeholder="https://…"
            className="w-full px-3 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
          />
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Paste a public link (Google Drive, Dropbox, image host) so admin can view it.
          </p>
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
          One per line. Carriers like DHL / FedEx / SingPost work — anything verifiable.
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
      </div>
    </>
  );
}
