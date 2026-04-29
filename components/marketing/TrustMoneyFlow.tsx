"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Lock, Landmark, Milestone, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Node = {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  caption: string;
};

const NODES: ReadonlyArray<Node> = [
  {
    Icon: CreditCard,
    title: "Backer pledges",
    sub: "PayNow / Card",
    caption: "Backer commits — no charge yet.",
  },
  {
    Icon: Lock,
    title: "Stripe holds auth",
    sub: "Until goal met",
    caption: "If goal misses, auths cancel cleanly.",
  },
  {
    Icon: Landmark,
    title: "Stripe escrow",
    sub: "Segregated account",
    caption: "Goal hit. Funds move into escrow.",
  },
  {
    Icon: Milestone,
    title: "Milestone release",
    sub: "Verified payouts",
    caption: "Each milestone unlocks a tranche.",
  },
  {
    Icon: Package,
    title: "Creator delivers",
    sub: "Reward fulfilled",
    caption: "Reward ships. Cycle closes.",
  },
];

/**
 * Animated 5-node "how the money flows" diagram for /backer-protection.
 *
 * Sits on a dark ribbon. When the section scrolls into view, each node
 * lights up in sequence over ~2 seconds. After all five have lit, the
 * full chain stays bright. No looping animation — once the user has seen
 * the flow it stays as a static reference.
 */
export function TrustMoneyFlow() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggeredRef.current) {
          triggeredRef.current = true;
          // Sequence the nodes lighting up
          NODES.forEach((_, i) => {
            setTimeout(() => setActiveIndex(i), 350 * i);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {/* ── Diagram (horizontal on desktop, vertical on mobile) ── */}
      <ol className="grid grid-cols-1 sm:grid-cols-[repeat(5,minmax(0,1fr))] gap-3 sm:gap-2 max-w-5xl mx-auto">
        {NODES.map((node, i) => {
          const isActive = activeIndex >= i;
          return (
            <li key={node.title} className="relative">
              <div
                className={cn(
                  "h-full rounded-[var(--radius-card)] p-5 sm:p-4 lg:p-5 text-center transition-all duration-500",
                  isActive
                    ? "bg-gradient-to-br from-[var(--color-brand-crust)] to-[var(--color-brand-golden)] border border-[var(--color-brand-golden)] shadow-[0_12px_36px_-8px_rgba(245,176,62,0.5)] -translate-y-1"
                    : "bg-white/5 border border-white/10"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 transition-colors duration-500",
                    isActive ? "bg-white/25 text-white" : "bg-white/8 text-white/60"
                  )}
                >
                  <node.Icon className="w-5 h-5" />
                </span>
                <div
                  className={cn(
                    "text-sm font-semibold transition-colors duration-500",
                    isActive ? "text-white" : "text-white/85"
                  )}
                >
                  {node.title}
                </div>
                <div
                  className={cn(
                    "font-mono text-[10px] font-semibold uppercase tracking-[0.18em] mt-1.5 transition-colors duration-500",
                    isActive ? "text-white/85" : "text-white/45"
                  )}
                >
                  {node.sub}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* ── Captions row (desktop only — mobile cards are tall enough) ── */}
      <div className="hidden sm:grid grid-cols-5 gap-2 mt-5 max-w-5xl mx-auto">
        {NODES.map((node, i) => {
          const isActive = activeIndex >= i;
          return (
            <p
              key={node.title}
              className={cn(
                "text-xs leading-[1.5] text-center px-2 transition-colors duration-500",
                isActive ? "text-white/85" : "text-white/40"
              )}
            >
              {node.caption}
            </p>
          );
        })}
      </div>

      {/* ── Step dots ──────────────────────────────────────── */}
      <div className="flex justify-center gap-2 mt-10">
        {NODES.map((_, i) => {
          const isActive = activeIndex >= i;
          return (
            <span
              key={i}
              aria-hidden
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                isActive ? "w-7 bg-[var(--color-brand-golden)]" : "w-2 bg-white/20"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
