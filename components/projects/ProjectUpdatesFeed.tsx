import { Lock, Megaphone } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import type { ProjectUpdatePost } from "@/types/project";

interface ProjectUpdatesFeedProps {
  updates: ProjectUpdatePost[];
  isBacker: boolean;
}

export function ProjectUpdatesFeed({ updates, isBacker }: ProjectUpdatesFeedProps) {
  if (updates.length === 0) return null;

  const visible = updates.filter((u) => !u.is_backers_only || isBacker);
  const lockedCount = updates.filter((u) => u.is_backers_only && !isBacker).length;

  if (visible.length === 0 && lockedCount === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-black text-[var(--color-ink)] mb-5 tracking-tight flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-[var(--color-brand-crust)]" />
        Updates
        <span className="font-mono text-sm font-semibold text-[var(--color-ink-muted)]">
          ({updates.length})
        </span>
      </h2>

      <div className="flex flex-col gap-6">
        {visible.map((update) => (
          <article key={update.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-[var(--color-ink)]">{update.title}</h3>
                {update.is_backers_only && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-crust)] bg-[var(--color-brand-crust)]/10 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    Backers only
                  </span>
                )}
              </div>
              <time className="text-xs text-[var(--color-ink-subtle)] shrink-0">
                {formatDate(update.created_at)}
              </time>
            </div>
            <p className="text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-line">
              {update.body}
            </p>
            <div className="h-px bg-[var(--color-border)]" />
          </article>
        ))}

        {lockedCount > 0 && (
          <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-5 flex items-center gap-3 text-[var(--color-ink-muted)]">
            <Lock className="w-4 h-4 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold text-[var(--color-ink)]">
                {lockedCount} backer-only update{lockedCount !== 1 ? "s" : ""}
              </span>{" "}
              — back this project to unlock them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
