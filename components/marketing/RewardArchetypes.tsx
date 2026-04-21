import { Zap, Package, Ticket } from "lucide-react";

const ARCHETYPES = [
  {
    icon: Zap,
    label: "Early-bird pricing",
    body: "The first 50 backers lock in the lowest price — cheaper than retail ever will be.",
  },
  {
    icon: Package,
    label: "Limited-edition goods",
    body: "One-off runs of physical rewards you won't see on any online store — backer-numbered, signed, or made just for this campaign.",
  },
  {
    icon: Ticket,
    label: "Exclusive experiences",
    body: "Factory tours, founder's dinners, producer credits on the final product, first-look previews. Things you can't buy.",
  },
];

export function RewardArchetypes() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ARCHETYPES.map(({ icon: Icon, label, body }) => (
        <div
          key={label}
          className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-gradient-to-br from-[var(--color-brand-crumb)] to-[var(--color-surface-overlay)] dark:from-[var(--color-brand-crust-dark)]/30 dark:to-[var(--color-surface-overlay)]"
        >
          <div className="h-full p-6 rounded-[var(--radius-card)] bg-[var(--color-surface)] flex flex-col gap-3">
            <Icon className="w-6 h-6 text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)]" />
            <h3 className="text-base font-black text-[var(--color-ink)] tracking-tight">
              {label}
            </h3>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              {body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
