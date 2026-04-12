import { Megaphone, Lock } from "lucide-react";
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
      <h2 className="text-xl font-bold text-[var(--color-ink)] mb-4 tracking-tight flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-[var(--color-brand-violet)]" />
        Campaign updates
        <span className="font-mono text-sm font-semibold text-[var(--color-ink-muted)]">
          ({updates.length})
        </span>
      </h2>

      <div className="flex flex-col gap-4">
        {visible.map((update) => (
          <div
            key={update.id}
            className="p-[3px] rounded-[calc(var(--radius-card)+3px)] bg-[var(--color-surface-overlay)] ring-1 ring-[var(--color-border)]"
          >
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-bold text-[var(--color-ink)]">{update.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  {update.is_backers_only && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-violet)] bg-[var(--color-brand-violet)]/10 px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                      Backers only
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-ink-subtle)]">
                    {formatDate(update.created_at)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-line">
                {update.body}
              </p>
            </div>
          </div>
        ))}

        {lockedCount > 0 && (
          <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] p-5 flex items-center gap-3 text-[var(--color-ink-muted)]">
            <Lock className="w-4 h-4 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold text-[var(--color-ink)]">{lockedCount} backer-only update{lockedCount !== 1 ? "s" : ""}</span>
              {" "}— back this project to unlock them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
