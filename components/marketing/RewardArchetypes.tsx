import { Zap, Sparkles, Eye, Boxes } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Archetype = {
  icon: LucideIcon;
  label: string;
  body: string;
};

const ARCHETYPES: ReadonlyArray<Archetype> = [
  {
    icon: Zap,
    label: "Early access",
    body: "The first 50 backers ship six weeks before retail — same product, just earlier, and at the launch price (which always beats the post-funded one).",
  },
  {
    icon: Sparkles,
    label: "Limited-edition variant",
    body: "A black-and-gold colourway only 200 backers will ever own. Numbered, signed, or made just for this campaign. Often the most-pledged tier on the page.",
  },
  {
    icon: Eye,
    label: "Behind-the-scenes",
    body: "Studio visits, founder dinners, signed prototypes, your name on the credits page. Ten spots, twenty spots — things you genuinely can't buy at any price.",
  },
  {
    icon: Boxes,
    label: "Better-than-retail bundle",
    body: "Three-pack pricing for the price of two. Or the family-sized box a creator only makes for backers. Cheaper here than anywhere it'll ever sell.",
  },
];

export function RewardArchetypes() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ARCHETYPES.map(({ icon: Icon, label, body }) => (
        <div
          key={label}
          className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-gradient-to-br from-[var(--color-brand-crumb)] to-[var(--color-surface-overlay)] dark:from-[var(--color-brand-crust-dark)]/30 dark:to-[var(--color-surface-overlay)]"
        >
          <div className="h-full p-5 sm:p-6 rounded-[var(--radius-card)] bg-[var(--color-surface)] flex flex-col gap-3">
            <Icon className="w-6 h-6 text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)]" />
            <h3 className="text-base font-black text-[var(--color-ink)] tracking-tight m-0">
              {label}
            </h3>
            <p className="text-sm leading-[1.55] text-[var(--color-ink-muted)] m-0">
              {body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
