import { describe, it, expect } from 'vitest';
import { validateMilestoneProof } from '@/lib/milestones/proofs';
import type { MilestoneNumber, MilestoneProofData } from '@/lib/milestones/types';

describe('Milestone Proof Validation', () => {
  describe('Milestone 1 (Tooling)', () => {
    it('should accept valid M1 proof (contract + receipt)', () => {
      const proof: MilestoneProofData = {
        letter_text: 'Signed factory contract from XYZ Factory...',
        photos_url: 'https://example.com/contract-photo.jpg',
      };

      const result = validateMilestoneProof(1, proof);
      expect(result.valid).toBe(true);
    });

    it('should reject M1 proof missing letter_text', () => {
      const proof: MilestoneProofData = {
        photos_url: 'https://example.com/contract.jpg',
      };

      const result = validateMilestoneProof(1, proof);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letter_text required');
    });
  });

  describe('Milestone 2 (Production)', () => {
    it('should accept valid M2 proof (photos + letter)', () => {
      const proof: MilestoneProofData = {
        photos_url: 'https://example.com/factory-floor.jpg',
        letter_text: 'Production timeline letter from factory...',
      };

      const result = validateMilestoneProof(2, proof);
      expect(result.valid).toBe(true);
    });

    it('should reject M2 proof with malformed URL', () => {
      const proof: MilestoneProofData = {
        photos_url: 'not-a-url',
        letter_text: 'Letter...',
      };

      const result = validateMilestoneProof(2, proof);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('photos_url must be valid');
    });
  });

  describe('Milestone 3 (Fulfillment)', () => {
    it('should accept valid M3 proof (tracking numbers)', () => {
      const proof: MilestoneProofData = {
        tracking_numbers: ['DHL123', 'DHL124', 'DHL125'],
        fulfillment_summary: 'Shipped 100/100 units',
      };

      const result = validateMilestoneProof(3, proof);
      expect(result.valid).toBe(true);
    });

    it('should reject M3 proof missing tracking_numbers', () => {
      const proof: MilestoneProofData = {
        fulfillment_summary: 'Shipped 100/100 units',
      };

      const result = validateMilestoneProof(3, proof);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tracking_numbers required');
    });
  });
});
