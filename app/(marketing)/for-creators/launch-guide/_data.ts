/**
 * Source of truth for the creator launch checklist.
 *
 * Used by both the interactive launch-guide page and the downloadable PDF
 * (rendered by @react-pdf/renderer in /api/launch-guide/pdf). Keep them in
 * sync — if you edit copy here it ships in both surfaces.
 */

export type LaunchItem = {
  id: string;
  label: string;
  spec: string;
  /** True for items the user fills in (e.g. project title) rather than ticks off. */
  editable?: boolean;
  /**
   * True for fields that are required to publish a campaign. The PDF marks
   * these with an asterisk and shows the legend at the bottom of the page.
   */
  required?: boolean;
};

export type LaunchSection = {
  id: string;
  title: string;
  intro: string;
  items: LaunchItem[];
  /**
   * True for sections that describe what happens after submission rather
   * than work the creator does. The PDF renders these without checkboxes
   * (since they're not actionable) and visually de-emphasizes them so the
   * checklist nature of the rest of the doc reads clearly.
   */
  informational?: boolean;
};

export const LAUNCH_SECTIONS: LaunchSection[] = [
  {
    id: "basics",
    title: "Campaign basics",
    intro: "The basics backers see first. Get these right and everything else follows.",
    items: [
      {
        id: "title",
        label: "Project title",
        spec: "5–100 characters. Clear and specific beats clever — backers skim fast.",
        editable: true,
        required: true,
      },
      {
        id: "short_desc",
        label: "Short description",
        spec: "20–200 characters. The hook that appears in search results and Explore cards.",
        required: true,
      },
      {
        id: "cover_image",
        label: "Cover image",
        spec: "1200×675 px, JPG or PNG, under 2 MB. Your campaign's first impression — make it count.",
        required: true,
      },
      {
        id: "full_desc",
        label: "Full description",
        spec: "Tell the story: what you're making, why it matters, why now. Minimum 50 characters.",
        required: true,
      },
      {
        id: "category",
        label: "Category",
        spec: "Pick the one that fits best — it determines where your campaign appears on Explore.",
        required: true,
      },
    ],
  },
  {
    id: "funding",
    title: "Funding goal & deadline",
    intro:
      "Set a goal you can genuinely deliver on. Aim ambitious, but be honest — your backers are counting on you.",
    items: [
      {
        id: "goal",
        label: "Funding goal (SGD)",
        spec: "Minimum SGD 500, maximum SGD 10,000,000. Aim for what you genuinely need to deliver.",
        required: true,
      },
      {
        id: "deadline",
        label: "Campaign deadline",
        spec: "Must be a future date. Most campaigns run 30–60 days — shorter creates urgency.",
        required: true,
      },
    ],
  },
  {
    id: "rewards",
    title: "Reward tiers",
    intro:
      "At least one tier required. Price it by what it costs you to deliver — not just what feels right.",
    items: [
      {
        id: "reward_title",
        label: "Tier title",
        spec: 'What backers call what they\'re getting. E.g. "Early bird", "Supporter", "Founding member".',
        required: true,
      },
      {
        id: "reward_pledge",
        label: "Minimum pledge amount",
        spec: "The lowest amount that unlocks this tier. Factor in delivery costs.",
        required: true,
      },
      {
        id: "reward_desc",
        label: "Tier description",
        spec: "What backers actually receive. Be specific — vague promises erode trust and increase disputes.",
        required: true,
      },
      {
        id: "reward_delivery",
        label: "Estimated delivery date",
        spec: "Optional but strongly recommended. Sets expectations for when rewards arrive.",
      },
      {
        id: "reward_physical",
        label: "Physical item flag",
        spec: "Check this if you're shipping something physical — backers see a 'Ships to you' badge before pledging.",
      },
      {
        id: "reward_cap",
        label: "Max backers cap",
        spec: "Optional. Use for limited-edition runs or capacity-constrained experiences.",
      },
    ],
  },
  {
    id: "milestones",
    title: "Milestones & payouts",
    intro:
      "Your funds unlock in three stages, not all at once. Know what you'll prove at each before you launch.",
    items: [
      {
        id: "m1",
        label: "Milestone 1 — first deliverable (40% of funds)",
        spec: "Your first concrete proof of progress. Photos, prototypes, signed supplier agreements — anything verifiable.",
        required: true,
      },
      {
        id: "m2",
        label: "Milestone 2 — mid-project proof (40% of funds)",
        spec: "Show the project advancing. Matches M1 in size — your proof should show real progress, not just intent.",
        required: true,
      },
      {
        id: "m3",
        label: "Milestone 3 — final delivery (20% of funds)",
        spec: "Completion proof: rewards shipped, build delivered, or service rendered. Closes out the campaign.",
        required: true,
      },
    ],
  },
  {
    id: "submit",
    title: "After you submit",
    intro:
      "Almost there. Submit and we'll review your campaign — usually within 2–3 business days.",
    informational: true,
    items: [
      {
        id: "review",
        label: "Admin review",
        spec: "We review within 2–3 business days. You'll get an email when approved or if changes are needed.",
      },
      {
        id: "live",
        label: "You're live",
        spec: "Once approved, your campaign page is public and backers can start pledging.",
      },
    ],
  },
];

export const LAUNCH_TOTAL_ITEMS = LAUNCH_SECTIONS.reduce(
  (acc, s) => acc + s.items.length,
  0,
);
