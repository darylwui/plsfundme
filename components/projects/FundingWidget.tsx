"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FundingProgressBar } from "./FundingProgressBar";
import { RewardTierCard } from "./RewardTierCard";
import { daysRemaining } from "@/lib/utils/dates";
import type { ProjectWithRelations } from "@/types/project";
import type { Reward } from "@/types/reward";

interface FundingWidgetProps {
  project: ProjectWithRelations;
}

export function FundingWidget({ project }: FundingWidgetProps) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const days = daysRemaining(project.deadline);
  const isFunded = project.amount_pledged_sgd >= project.funding_goal_sgd;
  const isClosed = project.status !== "active";
  const activeRewards = project.rewards.filter((r) => r.is_active);

  return (
    <div className="flex flex-col gap-5">
      {/* Progress card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
        <FundingProgressBar
          pledged={project.amount_pledged_sgd}
          goal={project.funding_goal_sgd}
          deadline={project.deadline}
          backerCount={project.backer_count}
        />

        {/* Deadline urgency */}
        {!isClosed && days <= 5 && days > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-brand-coral)] font-semibold bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 shrink-0" />
            Only {days} day{days !== 1 ? "s" : ""} left — don&apos;t miss out!
          </div>
        )}

        {/* CTA */}
        <div className="mt-5">
          {isClosed ? (
            <div className="text-center text-sm text-[var(--color-ink-muted)] py-2">
              {project.status === "funded"
                ? "🎉 This project was successfully funded!"
                : "This campaign has ended."}
            </div>
          ) : (
            <Link
              href={`/backing/${project.id}/checkout${
                selectedReward ? `?reward=${selectedReward.id}` : ""
              }`}
            >
              <Button size="lg" fullWidth>
                {selectedReward
                  ? `Back with ${selectedReward.title}`
                  : "Back this project"}
              </Button>
            </Link>
          )}
        </div>

        {/* Trust note */}
        <p className="mt-3 text-xs text-center text-[var(--color-ink-subtle)] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          All-or-nothing — you&apos;re only charged if the goal is reached
        </p>
      </div>

      {/* Reward tiers */}
      {activeRewards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-sm text-[var(--color-ink-muted)] uppercase tracking-wider">
            Choose a reward
          </h3>
          {activeRewards
            .sort((a, b) => a.minimum_pledge_sgd - b.minimum_pledge_sgd)
            .map((reward) => (
              <RewardTierCard
                key={reward.id}
                reward={reward}
                selected={selectedReward?.id === reward.id}
                onSelect={isClosed ? undefined : setSelectedReward}
                disabled={isClosed}
              />
            ))}
        </div>
      )}
    </div>
  );
}
