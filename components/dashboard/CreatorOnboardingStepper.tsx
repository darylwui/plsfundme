import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SingpassIcon } from "@/components/icons/SingpassIcon";

interface CreatorOnboardingStepperProps {
  singpassVerified: boolean;
}

type StepStatus = "done" | "locked" | "pointer" | "cta";

interface Step {
  number: number;
  status: StepStatus;
  title: string;
  description: string;
  href?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function CreatorOnboardingStepper({ singpassVerified }: CreatorOnboardingStepperProps) {
  const steps: Step[] = [
    {
      number: 1,
      status: "done",
      title: "Application approved",
      description: "You're cleared to create campaigns",
    },
    {
      number: 2,
      status: singpassVerified ? "done" : "locked",
      title: "Verify identity with Singpass",
      description: singpassVerified
        ? "Identity verified — backers can see this on your campaign"
        : "Takes 30 seconds — verify your identity in one click with your Singpass app",
      actionHref: singpassVerified ? undefined : "/api/auth/singpass",
      actionLabel: "Verify now →",
    },
    {
      number: 3,
      status: "pointer",
      title: "Run through the launch checklist",
      description: "15-min prep doc covering every section of your campaign",
      href: "/for-creators/launch-guide",
    },
    {
      number: 4,
      status: "cta",
      title: "Launch your first campaign",
      description: "Walk through the form and submit for review",
      href: "/projects/create",
    },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
      <h2 className="text-lg font-black text-[var(--color-ink)]">Get your first campaign live</h2>
      <p className="text-sm text-[var(--color-ink-muted)] mt-0.5 mb-4">
        Four quick steps from approved to launched.
      </p>

      <div className="flex flex-col">
        {steps.map((step, idx) => (
          <StepRow key={step.number} step={step} isLast={idx === steps.length - 1} />
        ))}
      </div>
    </div>
  );
}

function StepRow({ step, isLast }: { step: Step; isLast: boolean }) {
  const dimmed = step.status === "locked" && !step.actionHref;
  const borderClass = isLast ? "" : "border-b border-[var(--color-border)]";

  return (
    <div className={`flex gap-3 py-3 ${borderClass} ${dimmed ? "opacity-70" : ""}`}>
      <StepIcon step={step} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[var(--color-ink)] text-sm">{step.title}</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">{step.description}</p>
        {step.actionHref && (
          <Link
            href={step.actionHref}
            className="inline-block mt-2 text-xs font-bold text-[var(--color-brand-crust)] hover:underline"
          >
            {step.actionLabel}
          </Link>
        )}
        {step.status === "cta" && step.href && (
          <Button asChild size="sm" variant="primary" className="mt-3">
            <Link href={step.href}>
              Start a project →
            </Link>
          </Button>
        )}
      </div>
      {step.status === "pointer" && step.href && (
        <Link
          href={step.href}
          className="self-center text-sm font-bold text-[var(--color-brand-crust)] hover:underline shrink-0"
        >
          Open guide →
        </Link>
      )}
    </div>
  );
}

function StepIcon({ step }: { step: Step }) {
  const base = "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold";

  if (step.status === "done") {
    return (
      <div className={`${base} bg-[var(--color-brand-success)]/10 text-[var(--color-brand-success)]`}>
        <Check className="w-4 h-4" />
      </div>
    );
  }

  if (step.status === "locked") {
    if (step.number === 2) {
      return <SingpassIcon className="w-7 h-7 shrink-0" />;
    }
    return (
      <div className={`${base} bg-[var(--color-surface-overlay)] text-[var(--color-ink-subtle)]`}>
        <Lock className="w-3.5 h-3.5" />
      </div>
    );
  }

  if (step.status === "pointer") {
    return (
      <div className={`${base} bg-[var(--color-brand-crumb)] text-[var(--color-brand-crust-dark)] dark:bg-[var(--color-brand-crust-dark)]/25 dark:text-[var(--color-brand-golden)]`}>
        {step.number}
      </div>
    );
  }

  // cta
  return (
    <div className={`${base} bg-[var(--color-brand-golden)] text-white`}>
      {step.number}
    </div>
  );
}
