"use client";

import { Package, Users, Calendar } from "lucide-react";
import { formatDateShort } from "@/lib/utils/dates";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Reward } from "@/types/reward";

interface RewardTierCardProps {
  reward: Reward;
  selected?: boolean;
  onSelect?: (reward: Reward) => void;
  disabled?: boolean;
}

export function RewardTierCard({
  reward,
  selected = false,
  onSelect,
  disabled = false,
}: RewardTierCardProps) {
  const { convert, format } = useCurrency();
  const isSoldOut =
    reward.max_backers !== null &&
    reward.claimed_count >= reward.max_backers;
  const spotsLeft =
    reward.max_backers !== null
      ? reward.max_backers - reward.claimed_count
      : null;

  return (
    <button
      type="button"
      onClick={() => !isSoldOut && !disabled && onSelect?.(reward)}
      disabled={isSoldOut || disabled || !onSelect}
      className={`
        w-full text-left rounded-[var(--radius-card)] border-2 p-5 relative
        transition-[border-color,background-color,opacity,box-shadow,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]
        ${
          selected
            ? "border-[var(--color-brand-crust)] bg-[var(--color-surface-overlay)]/60 shadow-[0_0_0_2px_rgba(146,64,14,0.15)]"
            : isSoldOut
            ? "border-[var(--color-border)] bg-[var(--color-surface-raised)] opacity-60 cursor-not-allowed"
            : onSelect
            ? "border-[var(--color-border)] hover:border-[var(--color-brand-crust)]/30 hover:shadow-[0_8px_24px_0_rgba(146,64,14,0.12)] hover:-translate-y-1 cursor-pointer"
            : "border-[var(--color-border)]"
        }
      `}
    >
      {reward.image_url && (
        <div className="w-full h-40 rounded-lg overflow-hidden mb-4 -mt-1">
          <img
            src={reward.image_url}
            alt={reward.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-lg text-[var(--color-brand-crust)]">
              {format(convert(reward.minimum_pledge_sgd))}+
            </span>
            {isSoldOut && (
              <span className="text-xs font-semibold text-[var(--color-brand-danger)] bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                Sold out
              </span>
            )}
          </div>
          <h4 className="font-bold text-[var(--color-ink)] mt-0.5">
            {reward.title}
          </h4>
          {reward.description && (
            <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed">
              {reward.description}
            </p>
          )}
        </div>

        {selected && (
          <div className="w-5 h-5 rounded-full bg-[var(--color-brand-crust)] flex items-center justify-center shrink-0 mt-0.5 animate-pop">
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-ink-subtle)]">
        {(() => {
          const formatted = formatDateShort(reward.estimated_delivery_date);
          if (!formatted) return null;
          return (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Est. delivery {formatted}
            </span>
          );
        })()}
        {reward.includes_physical_item && (
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            Ships to you
          </span>
        )}
        {spotsLeft !== null && !isSoldOut && (
          <span className="flex items-center gap-1 text-[var(--color-brand-golden)]">
            <Users className="w-3.5 h-3.5" />
            {spotsLeft} left
          </span>
        )}
      </div>
    </button>
  );
}
