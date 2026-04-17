export const REJECTION_REASONS = {
  UNCLEAR_GOAL: {
    code: "unclear_goal",
    label: "Unclear project goal",
    tip: "Help the creator clarify what they're building and why it matters. Ask: What problem does this solve? Who benefits from this?"
  },
  WEAK_DESCRIPTION: {
    code: "weak_description",
    label: "Description needs work",
    tip: "The short description doesn't hook readers. Help them make it compelling. Suggest being more specific about what backers get."
  },
  MISSING_REWARDS: {
    code: "missing_rewards",
    label: "Rewards unclear or missing",
    tip: "Reward descriptions should explain what backers get and when. Ask for delivery dates and clear reward descriptions."
  },
  UNREALISTIC_TIMELINE: {
    code: "unrealistic_timeline",
    label: "Timeline or goal unrealistic",
    tip: "Help them set achievable deadlines and reasonable funding goals. Suggest 30-90 day campaigns and realistic stretch goals."
  },
  LOW_QUALITY_ASSETS: {
    code: "low_quality_assets",
    label: "Cover image or video quality",
    tip: "Professional-looking images build trust. Ask for a better cover image or suggest they use Canva/similar tools to improve visuals."
  },
  CATEGORY_MISMATCH: {
    code: "category_mismatch",
    label: "Wrong category selected",
    tip: "This project belongs in a different category. Guide them to select the correct one that best matches their product."
  },
  POLICY_VIOLATION: {
    code: "policy_violation",
    label: "Policy violation",
    tip: "Project violates our terms. Be specific about which policy is violated. Link them to the Terms of Service."
  },
  OTHER: {
    code: "other",
    label: "Other feedback",
    tip: "Write a specific, actionable message. Be constructive and help them understand what to improve."
  }
} as const;

export type RejectionReasonCode = typeof REJECTION_REASONS[keyof typeof REJECTION_REASONS]["code"];
