import Link from "next/link";
import { ArrowRight, Rocket, Users, DollarSign, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How it works — get that bread",
};

const CREATOR_STEPS = [
  {
    icon: "📝",
    title: "Create your campaign",
    description:
      "Set your funding goal, deadline, and reward tiers. Tell your story with a compelling description and cover image.",
  },
  {
    icon: "🚀",
    title: "Launch & share",
    description:
      "Go live and share your campaign with your network. Every backer brings you closer to your goal.",
  },
  {
    icon: "🎯",
    title: "Hit your goal",
    description:
      "If your campaign reaches its funding goal by the deadline, you receive the funds minus our 5% platform fee.",
  },
  {
    icon: "📦",
    title: "Deliver your rewards",
    description:
      "Fulfill your promises to backers. Keep them updated with campaign posts along the way.",
  },
];

const BACKER_STEPS = [
  {
    icon: "🔍",
    title: "Discover projects",
    description: "Browse trending campaigns from Singapore entrepreneurs across all categories.",
  },
  {
    icon: "💳",
    title: "Back with confidence",
    description:
      "Pledge via Credit Card or PayNow. Your payment is only captured if the campaign reaches its goal.",
  },
  {
    icon: "🎁",
    title: "Receive your rewards",
    description:
      "Get exclusive rewards from creators as a thank-you for your support.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-[var(--color-ink)] tracking-tight">
          How get that bread works
        </h1>
        <p className="mt-4 text-lg text-[var(--color-ink-muted)] max-w-xl mx-auto">
          All-or-nothing crowdfunding for Singapore entrepreneurs. Simple, safe, and transparent.
        </p>
      </div>

      {/* All-or-nothing explainer */}
      <div className="rounded-[var(--radius-card)] bg-violet-50 dark:bg-violet-900/20 border-2 border-[var(--color-brand-violet)]/20 p-8 mb-16 flex gap-4">
        <Shield className="w-8 h-8 text-[var(--color-brand-violet)] shrink-0 mt-1" />
        <div>
          <h2 className="text-xl font-black text-[var(--color-ink)]">
            All-or-nothing funding
          </h2>
          <p className="mt-2 text-[var(--color-ink-muted)] leading-relaxed">
            Backers are only charged if a campaign reaches its full funding goal
            by the deadline. If the goal isn&apos;t met, no one pays a cent. This
            protects backers and motivates creators to set realistic goals.
          </p>
        </div>
      </div>

      {/* For creators */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-violet)] flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black text-[var(--color-ink)]">For creators</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CREATOR_STEPS.map((step, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6"
            >
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-bold text-[var(--color-ink)] mb-1">{step.title}</h3>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/projects/create">
            <Button size="lg">
              Start your campaign <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* For backers */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-teal)] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black text-[var(--color-ink)]">For backers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {BACKER_STEPS.map((step, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6"
            >
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-bold text-[var(--color-ink)] mb-1">{step.title}</h3>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/explore">
            <Button variant="secondary" size="lg">
              Explore projects <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Fees */}
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-8">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-[var(--color-brand-violet)]" />
          <h2 className="text-xl font-black text-[var(--color-ink)]">Fees</h2>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-muted)]">Platform fee</span>
            <span className="font-bold text-[var(--color-ink)]">5% of funds raised</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-muted)]">Payment processing</span>
            <span className="font-bold text-[var(--color-ink)]">Included</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-muted)]">If goal not reached</span>
            <span className="font-bold text-[var(--color-brand-lime)]">Free — no charges</span>
          </div>
        </div>
      </div>
    </div>
  );
}
