'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DisputeModalProps {
  campaignId: string;
  onClose: () => void;
}

export function DisputeModal({ campaignId, onClose }: DisputeModalProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const { error: apiError } = await res.json();
        throw new Error(apiError);
      }

      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Report an Issue</h2>

        {success ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            <p className="font-medium">Dispute filed successfully</p>
            <p className="text-sm mt-1">We'll review your claim within 10 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                What's the issue? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what went wrong with this campaign..."
                className="w-full p-3 border rounded-lg"
                rows={5}
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Submitting...' : 'File Dispute'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
