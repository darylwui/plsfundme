"use client";

import { useEffect, useRef, useState } from "react";
import type { CampaignHeading } from "@/lib/utils/campaignHtml";

interface CampaignTocProps {
  headings: CampaignHeading[];
}

export function CampaignToc({ headings }: CampaignTocProps) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? "");
  const isProgrammaticScroll = useRef(false);

  useEffect(() => {
    if (headings.length === 0) return;

    const observers: IntersectionObserver[] = [];
    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isProgrammaticScroll.current) {
            setActiveId(id);
          }
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [headings]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    isProgrammaticScroll.current = true;
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
    const NAVBAR = 64;
    const SECTION_NAV = 48;
    const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR - SECTION_NAV - 8;
    window.scrollTo({ top, behavior: "smooth" });
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 700);
  }

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Campaign sections"
      className="mt-4 pt-3 border-t border-[var(--color-border)]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-ink-subtle)] mb-2">
        In this campaign
      </p>
      <ul className="flex flex-col gap-0.5 max-h-[40vh] overflow-y-auto pr-1 [scrollbar-width:thin]">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => scrollTo(h.id)}
                className={`
                  w-full text-left text-sm rounded-[var(--radius-btn)] px-2.5 py-1.5 transition-colors
                  ${h.level === 3 ? "pl-6 text-[13px]" : "font-semibold"}
                  ${
                    active
                      ? "bg-[var(--color-brand-crust)]/10 text-[var(--color-brand-crust)]"
                      : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]"
                  }
                `}
              >
                <span className="line-clamp-2">{h.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
