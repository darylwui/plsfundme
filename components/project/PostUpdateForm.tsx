"use client";

import { useState } from "react";
import { Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface PostUpdateFormProps {
  projectId: string;
  creatorId: string;
  onPosted?: () => void;
}

export function PostUpdateForm({ projectId, creatorId, onPosted }: PostUpdateFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [backersOnly, setBackersOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.from("project_updates").insert({
      project_id: projectId,
      creator_id: creatorId,
      title: title.trim(),
      body: body.trim(),
      is_backers_only: backersOnly,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setTitle("");
      setBody("");
      setBackersOnly(false);
      setSuccess(true);
      setOpen(false);
      setTimeout(() => setSuccess(false), 3000);
      onPosted?.();
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--color-surface-raised)] transition-colors"
      >
        <div>
          <p className="font-bold text-[var(--color-ink)] text-sm">Post a campaign update</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Keep backers in the loop — they&apos;re more likely to share when they feel involved.
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[var(--color-ink-subtle)] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-ink-subtle)] shrink-0" />
        )}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-[var(--color-border)] px-5 py-4 flex flex-col gap-4">
          <Input
            label="Update title"
            placeholder="e.g. We hit 50% funded — thank you!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-ink)]">Message</label>
            <textarea
              rows={4}
              placeholder="Share progress, milestones, or behind-the-scenes details with your backers…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-violet)] resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={backersOnly}
              onChange={(e) => setBackersOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--color-brand-violet)]"
            />
            <span className="text-sm text-[var(--color-ink-muted)]">
              Backers only — hide from public
            </span>
          </label>

          {error && (
            <p className="text-xs text-[var(--color-brand-coral)]">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] transition-colors"
            >
              Cancel
            </button>
            <Button size="sm" loading={loading} disabled={!title.trim() || !body.trim()}>
              <Send className="w-3.5 h-3.5" />
              Post update
            </Button>
          </div>
        </form>
      )}

      {success && (
        <div className="border-t border-[var(--color-border)] bg-lime-50 dark:bg-lime-900/20 px-5 py-3 text-sm font-semibold text-lime-700 dark:text-lime-400">
          Update posted — your backers can see it now.
        </div>
      )}
    </div>
  );
}
