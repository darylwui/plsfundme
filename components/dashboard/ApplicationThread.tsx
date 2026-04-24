"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewNote {
  id: string;
  author_id: string;
  author_role: "admin" | "creator";
  body: string;
  created_at: string;
  author: { display_name: string; avatar_url: string | null } | null;
}

interface ApplicationThreadProps {
  currentUserId: string;
  canReply: boolean;
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
        <Image src={avatarUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-[var(--color-brand-crust)] flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ApplicationThread({ currentUserId, canReply }: ApplicationThreadProps) {
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/creator/application/notes");
    if (res.ok) {
      const { notes } = await res.json();
      setNotes(notes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/creator/application/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [...prev, note]);
      setBody("");
    } else {
      const { error: apiError } = await res.json().catch(() => ({ error: "Failed to send" }));
      setError(apiError ?? "Failed to send");
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <p className="text-sm text-[var(--color-ink-subtle)]">Loading messages…</p>
      ) : notes.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
          No messages yet. If a reviewer needs more information, their questions will appear here.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => {
            const isMine = n.author_id === currentUserId;
            return (
              <li
                key={n.id}
                className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}
              >
                <Avatar
                  name={n.author?.display_name ?? "?"}
                  avatarUrl={n.author?.avatar_url ?? null}
                />
                <div
                  className={`max-w-[80%] rounded-[var(--radius-btn)] px-3 py-2 border ${
                    isMine
                      ? "bg-[var(--color-brand-crust)]/10 border-[var(--color-brand-crust)]/20"
                      : "bg-[var(--color-surface-overlay)] border-[var(--color-border)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[var(--color-ink)]">
                      {isMine ? "You" : (n.author?.display_name ?? "Reviewer")}
                    </span>
                    <span className="text-[10px] text-[var(--color-ink-subtle)]">
                      {fmtDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{n.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canReply && (
        <div className="border border-[var(--color-border)] rounded-[var(--radius-btn)] p-3 flex flex-col gap-2">
          <textarea
            rows={3}
            placeholder="Type a reply to the review team…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none resize-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              loading={sending}
              disabled={!body.trim() || sending}
              onClick={submit}
            >
              <Send className="w-3.5 h-3.5" />
              Send reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
