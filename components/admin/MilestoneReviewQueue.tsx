'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MilestoneSubmission } from '@/lib/milestones/types';

export function MilestoneReviewQueue() {
  const [submissions, setSubmissions] = useState<MilestoneSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        // TODO: Create GET /api/admin/milestones endpoint
        const res = await fetch('/api/admin/milestones?status=pending');
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const handleApprove = async (submissionId: string) => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/campaigns/[campaignId]/milestone-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          decision: 'approved',
          feedback_text: feedbackText,
        }),
      });

      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
        setFeedbackText('');
        setSelectedId(null);
      }
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (submissions.length === 0) {
    return <div className="p-4 text-center text-gray-500">No pending submissions</div>;
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="border rounded-lg p-4 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">Milestone {submission.milestone_number}</p>
              <p className="text-sm text-gray-500">Campaign: {submission.campaign_id}</p>
              <p className="text-sm text-gray-500">Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</p>
            </div>
            <Button
              onClick={() => setSelectedId(submission.id)}
              className="text-sm"
            >
              Review
            </Button>
          </div>

          {selectedId === submission.id && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Proof Data:</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">{JSON.stringify(submission.proof_data, null, 2)}</pre>
              </div>

              <div>
                <label htmlFor="feedback" className="block text-sm font-medium mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                  placeholder="Notes for creator..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedId(null)}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApprove(submission.id)}
                  disabled={isApproving}
                  className="flex-1"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
