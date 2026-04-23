import { describe, it, expect } from 'vitest';
import {
  getMilestoneApprovedEmail,
  getPostPledgeEducationEmail,
} from '@/lib/email/milestone-notifications';

describe('Milestone Email Templates', () => {
  describe('getMilestoneApprovedEmail', () => {
    it('should return email with milestone status', () => {
      const email = getMilestoneApprovedEmail({
        backer_name: 'John Doe',
        creator_name: 'Jane Smith',
        milestone_number: 2,
        product_name: 'Amazing Widget',
      });

      expect(email.subject).toContain('Production Verified');
      expect(email.body).toContain('John Doe');
      expect(email.body).toContain('Jane Smith');
    });
  });

  describe('getPostPledgeEducationEmail', () => {
    it('should explain escrow and next steps', () => {
      const email = getPostPledgeEducationEmail({
        backer_name: 'Alice',
        product_name: 'Cool Gadget',
        amount_sgd: 100,
      });

      expect(email.subject).toContain('Your pledge is safe');
      expect(email.body).toContain('escrow');
      expect(email.body).toContain('milestone');
    });
  });
});
