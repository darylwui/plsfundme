"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Shield, Clock, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FundingProgressBar } from "./FundingProgressBar";
import { RewardTierCard } from "./RewardTierCard";
import { daysRemaining } from "@/lib/utils/dates";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { ProjectWithRelations } from "@/types/project";
import type { Reward } from "@/types/reward";

interface FundingWidgetProps {
  project: ProjectWithRelations;
}

export function FundingWidget({ project }: FundingWidgetProps) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState<number>(25);
  const { convert, format } = useCurrency();
  const days = daysRemaining(project.deadline);
  const isFunded = project.amount_pledged_sgd >= project.funding_goal_sgd;
  const isClosed = project.status !== "active";
  const isZeroState = project.backer_count === 0 && project.amount_pledged_sgd === 0 && !isClosed;
  const activeRewards = useMemo(
    () => project.rewards.filter((r) => r.is_active).sort((a, b) => a.minimum_pledge_sgd - b.minimum_pledge_sgd),
    [project.rewards]
  );

  const eligibleRewards = useMemo(
    () => activeRewards.filter((r) => pledgeAmount >= r.minimum_pledge_sgd),
    [activeRewards, pledgeAmount]
  );

  useEffect(() => {
    if (selectedReward && pledgeAmount < selectedReward.minimum_pledge_sgd) {
      setSelectedReward(null);
    }
  }, [pledgeAmount, selectedReward]);

  const checkoutHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedReward) params.set("reward", selectedReward.id);
    if (Number.isFinite(pledgeAmount) && pledgeAmount > 0) {
      params.set("amount", String(Math.round(pledgeAmount)));
    }
    const query = params.toString();
    return `/backing/${project.id}/checkout${query ? `?${query}` : ""}`;
  }, [pledgeAmount, project.id, selectedReward]);

  return (
    <div className="flex flex-col gap-5">
      {/* Progress card — double-bezel */}
      <div className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)]">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] p-6">

        {!isClosed && activeRewards.length > 0 && (
          <div className="mb-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              Plan your pledge
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pledge-amount" className="text-sm font-semibold text-[var(--color-ink)]">
                Amount (SGD)
              </label>
              <div className="relative">
                <input
                  id="pledge-amount"
                  type="number"
                  min={1}
                  step={1}
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-crust)]"
                />
                {/* Threshold progress indicator */}
                {activeRewards.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-[var(--radius-btn)] bg-[var(--color-brand-crust)]/10 overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-brand-crust)] transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (pledgeAmount / Math.max(activeRewards[activeRewards.length - 1]?.minimum_pledge_sgd ?? 100, pledgeAmount)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--color-ink-subtle)]">
                You are pledging {format(convert(pledgeAmount))}
                {eligibleRewards.length > 0 && (
                  <span className="ml-1 font-semibold text-[var(--color-brand-crust)]">
                    · {eligibleRewards.length} reward{eligibleRewards.length !== 1 ? "s" : ""} unlocked ↓
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {isZeroState ? (
          /* ── Zero-state: be the first ── */
          <div className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-brand-crust)]/40 bg-[var(--color-brand-crust)]/5 px-5 py-4 text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand-crust)]/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-[var(--color-brand-crust)]" />
              </div>
              <p className="font-bold text-[var(--color-ink)]">No backers yet — be the first.</p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Help this campaign reach its goal of{" "}
                <span className="font-mono font-bold text-[var(--color-ink)]">
                  {format(convert(project.funding_goal_sgd))}
                </span>
                . Every campaign starts with one believer.
              </p>
            </div>

            {days <= 5 && days > 0 && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-brand-danger)] font-semibold bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 shrink-0" />
                Only {days} day{days !== 1 ? "s" : ""} left — don&apos;t miss out!
              </div>
            )}

            <Link href={checkoutHref}>
              <Button size="lg" fullWidth>
                {selectedReward ? `Back with ${selectedReward.title}` : "Be the first backer"}
              </Button>
            </Link>

            <p className="text-xs text-center text-[var(--color-ink-subtle)] flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Milestone-protected escrow — funds released as creator delivers
            </p>
          </div>
        ) : (
          /* ── Normal state ── */
          <>
            <FundingProgressBar
              pledged={project.amount_pledged_sgd}
              goal={project.funding_goal_sgd}
              deadline={project.deadline}
              backerCount={project.backer_count}
            />

            {!isClosed && days <= 5 && days > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-brand-danger)] font-semibold bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 shrink-0" />
                Only {days} day{days !== 1 ? "s" : ""} left — don&apos;t miss out!
              </div>
            )}

            <div className="mt-5">
              {isClosed ? (
                <div className="text-center text-sm text-[var(--color-ink-muted)] py-2 flex items-center justify-center gap-2">
                  {project.status === "funded" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-success)] shrink-0" />
                      This project was successfully funded!
                    </>
                  ) : (
                    "This campaign has ended."
                  )}
                </div>
              ) : (
                <Link href={checkoutHref}>
                  <Button size="lg" fullWidth>
                    {selectedReward ? `Back with ${selectedReward.title}` : "Pledge without reward"}
                  </Button>
                </Link>
              )}
            </div>

            <p className="mt-3 text-xs text-center text-[var(--color-ink-subtle)] flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Milestone-protected escrow — funds released as creator delivers
            </p>
          </>
        )}
      </div>
      </div>

      {/* Reward tiers */}
      {activeRewards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-sm text-[var(--color-ink-muted)] uppercase tracking-wider">
            Choose a reward
          </h3>
          {activeRewards.map((reward) => (
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
