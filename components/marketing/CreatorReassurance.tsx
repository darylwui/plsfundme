import { CheckCircle2 } from "lucide-react";

const POINTS = [
  "Your backers don't get charged — their card holds are released automatically.",
  "You don't owe anyone anything. No fees, no clawbacks, no obligations.",
  "Your campaign page stays up so you can gather feedback and iterate on your pitch.",
  "Re-launch whenever you're ready — or walk away clean.",
];

export function CreatorReassurance() {
  return (
    <div className="rounded-[var(--radius-card)] ring-1 ring-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
      <p className="text-[var(--color-ink-muted)] leading-relaxed mb-6">
        Every first-time creator asks this. The honest answer: nothing breaks.
      </p>
      <ul className="flex flex-col gap-3">
        {POINTS.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)]" />
            <span className="text-[var(--color-ink)] leading-relaxed">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
