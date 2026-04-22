'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MilestoneNumber, MilestoneProofData } from '@/lib/milestones/types';

interface MilestoneSubmissionFormProps {
  campaignId: string;
  milestoneNumber: MilestoneNumber;
  onSubmit: (proofData: MilestoneProofData) => Promise<void>;
  isLoading?: boolean;
}

export function MilestoneSubmissionForm({
  campaignId,
  milestoneNumber,
  onSubmit,
  isLoading = false,
}: MilestoneSubmissionFormProps) {
  const [formData, setFormData] = useState<MilestoneProofData>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await onSubmit(formData);
      setSuccess(true);
      setFormData({}); // Clear form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Milestone 1: Tooling */}
      {milestoneNumber === 1 && (
        <>
          <div>
            <label htmlFor="letter" className="block text-sm font-medium mb-2">
              Factory Contract (paste text or upload letter)
            </label>
            <textarea
              id="letter"
              value={formData.letter_text || ''}
              onChange={(e) => setFormData({ ...formData, letter_text: e.target.value })}
              placeholder="Paste the factory contract or letter confirming your order..."
              className="w-full p-3 border rounded-lg"
              rows={5}
            />
          </div>

          <div>
            <label htmlFor="photos_m1" className="block text-sm font-medium mb-2">
              Contract Photo (URL)
            </label>
            <input
              id="photos_m1"
              type="url"
              value={formData.photos_url || ''}
              onChange={(e) => setFormData({ ...formData, photos_url: e.target.value })}
              placeholder="https://..."
              className="w-full p-3 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Link to a photo of your factory contract</p>
          </div>
        </>
      )}

      {/* Milestone 2: Production */}
      {milestoneNumber === 2 && (
        <>
          <div>
            <label htmlFor="letter_m2" className="block text-sm font-medium mb-2">
              Production Timeline Letter (from factory)
            </label>
            <textarea
              id="letter_m2"
              value={formData.letter_text || ''}
              onChange={(e) => setFormData({ ...formData, letter_text: e.target.value })}
              placeholder="Paste the factory letter confirming production is underway..."
              className="w-full p-3 border rounded-lg"
              rows={5}
            />
          </div>

          <div>
            <label htmlFor="photos_m2" className="block text-sm font-medium mb-2">
              Factory Floor Photo (URL)
            </label>
            <input
              id="photos_m2"
              type="url"
              value={formData.photos_url || ''}
              onChange={(e) => setFormData({ ...formData, photos_url: e.target.value })}
              placeholder="https://..."
              className="w-full p-3 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Link to a date-stamped photo of your product in production</p>
          </div>
        </>
      )}

      {/* Milestone 3: Fulfillment */}
      {milestoneNumber === 3 && (
        <>
          <div>
            <label htmlFor="tracking" className="block text-sm font-medium mb-2">
              Tracking Numbers
            </label>
            <textarea
              id="tracking"
              value={formData.tracking_numbers?.join('\n') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tracking_numbers: e.target.value.split('\n').filter((t) => t.trim()),
                })
              }
              placeholder="DHL123456
FDX987654
..."
              className="w-full p-3 border rounded-lg font-mono text-sm"
              rows={8}
            />
            <p className="text-xs text-gray-500 mt-1">One tracking number per line</p>
          </div>

          <div>
            <label htmlFor="fulfillment" className="block text-sm font-medium mb-2">
              Fulfillment Summary
            </label>
            <input
              id="fulfillment"
              type="text"
              value={formData.fulfillment_summary || ''}
              onChange={(e) => setFormData({ ...formData, fulfillment_summary: e.target.value })}
              placeholder="e.g., Shipped 100/100 units, ETA arrival 2026-05-15"
              className="w-full p-3 border rounded-lg"
            />
          </div>
        </>
      )}

      {/* Error message */}
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      {/* Success message */}
      {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">Proof submitted! Awaiting platform review.</div>}

      {/* Submit button */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Submitting...' : `Submit Milestone ${milestoneNumber} Proof`}
      </Button>
    </form>
  );
}
