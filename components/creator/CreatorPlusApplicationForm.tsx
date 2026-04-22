'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CreatorPlusApplicationForm() {
  const [proofUrl, setProofUrl] = useState('');
  const [proofType, setProofType] = useState<'portfolio' | 'kickstarter' | 'manufacturing_letter' | 'endorsement'>('portfolio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/creators/qualification/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_proof_url: proofUrl,
          external_proof_type: proofType,
        }),
      });

      if (!res.ok) {
        const { error: apiError } = await res.json();
        throw new Error(apiError);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold mb-4">Apply for Creator+ Status</h2>

      {success ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg">
          <p className="font-medium">Application submitted!</p>
          <p className="text-sm mt-1">We'll review your proof within 5–10 business days.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="proofType" className="block text-sm font-medium mb-2">
              Proof Type <span className="text-red-500">*</span>
            </label>
            <select
              id="proofType"
              value={proofType}
              onChange={(e) => setProofType(e.target.value as typeof proofType)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="portfolio">Portfolio / Case Studies</option>
              <option value="kickstarter">Kickstarter / Indiegogo Campaign</option>
              <option value="manufacturing_letter">Manufacturing Partnership Letter</option>
              <option value="endorsement">Investor / Accelerator Endorsement</option>
            </select>
          </div>

          <div>
            <label htmlFor="proofUrl" className="block text-sm font-medium mb-2">
              Link to Proof <span className="text-red-500">*</span>
            </label>
            <input
              id="proofUrl"
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 border rounded-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Link to your portfolio, campaign, or letter</p>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Submitting...' : 'Apply for Creator+'}
          </Button>
        </form>
      )}
    </div>
  );
}
