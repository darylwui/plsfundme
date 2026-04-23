import type { MilestoneNumber, MilestoneProofData } from './types';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateMilestoneProof(milestone_number: MilestoneNumber, proof: MilestoneProofData): ValidationResult {
  if (milestone_number === 1) {
    // Milestone 1: must have letter_text (factory contract) and photos_url
    if (!proof.letter_text) {
      return { valid: false, error: 'Milestone 1: letter_text required (factory contract)' };
    }
    if (!proof.photos_url) {
      return { valid: false, error: 'Milestone 1: photos_url required' };
    }
    if (!isValidUrl(proof.photos_url)) {
      return { valid: false, error: 'Milestone 1: photos_url must be valid URL' };
    }
    return { valid: true };
  }

  if (milestone_number === 2) {
    // Milestone 2: must have letter_text (production letter) and photos_url (factory floor)
    if (!proof.letter_text) {
      return { valid: false, error: 'Milestone 2: letter_text required (production timeline)' };
    }
    if (!proof.photos_url) {
      return { valid: false, error: 'Milestone 2: photos_url required (factory floor)' };
    }
    if (!isValidUrl(proof.photos_url)) {
      return { valid: false, error: 'Milestone 2: photos_url must be valid URL' };
    }
    return { valid: true };
  }

  if (milestone_number === 3) {
    // Milestone 3: must have tracking_numbers (array of tracking codes)
    if (!proof.tracking_numbers || proof.tracking_numbers.length === 0) {
      return { valid: false, error: 'Milestone 3: tracking_numbers required (non-empty array)' };
    }
    if (!proof.fulfillment_summary) {
      return { valid: false, error: 'Milestone 3: fulfillment_summary required' };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Invalid milestone number' };
}

/**
 * Sanitize and normalize proof data before storage
 */
export function normalizeMilestoneProof(proof: MilestoneProofData): MilestoneProofData {
  return {
    photos_url: proof.photos_url?.trim(),
    letter_text: proof.letter_text?.trim(),
    tracking_numbers: proof.tracking_numbers?.map(t => t.trim().toUpperCase()),
    fulfillment_summary: proof.fulfillment_summary?.trim(),
  };
}
