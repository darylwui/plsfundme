"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

type CreatorStatus = "pending_review" | "approved" | "rejected" | "needs_info";

const POLL_INTERVAL_MS = 30_000; // 30s — friendly to the API + DB
const MAX_POLL_DURATION_MS = 60 * 60 * 1000; // 1 hour cap; refresh page to keep going

/**
 * Silently polls /api/creators/me/status every 30s while the user's
 * application is in a non-terminal state (`pending_review` or
 * `needs_info`). When the status flips, calls `router.refresh()` so
 * the parent server component picks up the new value and the banner
 * re-renders. Also fires a brief celebration overlay if the flip is
 * pending → approved — that's the moment the creator wants to see.
 *
 * Why polling and not realtime: Supabase Realtime would be tighter,
 * but adds a websocket connection on every dashboard pageview for a
 * status change that fires <once per creator per launch. 30s polling
 * matches the actual cadence of admin reviews (1–2 business days)
 * without keeping a socket open. The cost is one tiny GET every
 * 30s — and only while the tab is visible.
 *
 * Auto-stops on:
 *   - Status reaching a terminal state (`approved` or `rejected`)
 *   - 1 hour total elapsed (avoids zombie polls if the user leaves
 *     the tab open overnight)
 *   - Component unmount
 *   - Tab hidden (Page Visibility API — pauses, resumes on visible)
 */
export function ApplicationStatusPoller({
  initialStatus,
}: {
  initialStatus: CreatorStatus;
}) {
  const router = useRouter();
  const [showApprovedToast, setShowApprovedToast] = useState(false);
  const startedAtRef = useRef<number>(Date.now());
  const lastStatusRef = useRef<CreatorStatus>(initialStatus);

  useEffect(() => {
    // Don't poll for terminal states.
    if (initialStatus === "approved" || initialStatus === "rejected") return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function checkOnce() {
      if (cancelled) return;
      // Hard timeout — stop the loop after MAX_POLL_DURATION_MS.
      if (Date.now() - startedAtRef.current > MAX_POLL_DURATION_MS) {
        if (intervalId) clearInterval(intervalId);
        return;
      }
      try {
        const res = await fetch("/api/creators/me/status", {
          cache: "no-store",
        });
        if (!res.ok) return; // Silent fail; retry next tick.
        const body = (await res.json()) as { status: CreatorStatus | null };
        const next = body.status;
        if (!next) return;

        if (next !== lastStatusRef.current) {
          // Status changed — celebrate first, then refresh.
          if (lastStatusRef.current === "pending_review" && next === "approved") {
            setShowApprovedToast(true);
            // 4s of glory, then quietly let the page re-render.
            setTimeout(() => {
              if (!cancelled) {
                setShowApprovedToast(false);
                router.refresh();
              }
            }, 4_000);
          } else {
            // Any other transition (e.g., to `needs_info` or `rejected`)
            // — refresh immediately, the banner change is sufficient.
            router.refresh();
          }
          lastStatusRef.current = next;

          // Stop polling if we've hit a terminal state.
          if ((next === "approved" || next === "rejected") && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch {
        // Network blips are fine — the next tick will retry. We don't
        // want to surface a toast for "couldn't reach the server" on
        // a passive background poll.
      }
    }

    function start() {
      if (intervalId) return;
      intervalId = setInterval(checkOnce, POLL_INTERVAL_MS);
    }
    function stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        // Catch up immediately when the user returns, then resume the loop.
        checkOnce();
        start();
      } else {
        stop();
      }
    }

    // Kick off the loop only if the tab is currently visible.
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initialStatus, router]);

  if (!showApprovedToast) return null;

  // Inline celebration for the pending → approved flip. Sticks around
  // for ~4s before the router.refresh() folds the new state into the
  // page-level banner. Positioned as a fixed overlay so it's visible
  // regardless of where in the application page the user has scrolled.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-6 z-50 flex justify-center px-4 pointer-events-none"
    >
      <div className="pointer-events-auto rounded-full bg-[var(--color-brand-success)] text-white shadow-[0_10px_30px_-8px_rgba(62,142,91,0.5)] px-5 py-3 flex items-center gap-2 text-sm font-bold animate-fade-up">
        <Sparkles className="w-4 h-4" />
        You&apos;re approved! Welcome to the cohort.
      </div>
    </div>
  );
}
