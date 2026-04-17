"use client";

import { useEffect, useRef, useState } from "react";

export interface ProjectSection {
  id: string;
  label: string;
}

interface ProjectSectionNavProps {
  sections: ProjectSection[];
  /** Extra top offset in px on top of the default sticky (64px navbar). Default 0. */
  offsetPx?: number;
}

export function ProjectSectionNav({ sections, offsetPx = 0 }: ProjectSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const isProgrammaticScroll = useRef(false);

  // IntersectionObserver scroll-spy
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (!el) continue;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isProgrammaticScroll.current) {
            setActiveId(id);
            history.replaceState(null, "", `#${id}`);
          }
        },
        { rootMargin: "-15% 0px -80% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    isProgrammaticScroll.current = true;
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);

    const NAVBAR = 64;
    const NAV_BAR = 48;
    const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR - NAV_BAR - offsetPx - 8;
    window.scrollTo({ top, behavior: "smooth" });

    // Re-enable observer after animation completes (~600ms)
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 700);
  }

  return (
    <div className="sticky top-16 z-20 border-b border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
      <div className="flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={`
              px-3.5 py-1.5 text-sm rounded-full border whitespace-nowrap transition-all duration-160 shrink-0 relative
              ${
                activeId === id
                  ? "bg-[var(--color-brand-violet)]/10 border-[var(--color-brand-violet)] text-[var(--color-brand-violet)] font-semibold shadow-[0_0_0_2px_rgba(146,64,14,0.15)]"
                  : "bg-transparent border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-brand-violet)]/30 hover:shadow-[0_4px_12px_0_rgba(146,64,14,0.08)]"
              }
            `}
          >
            {label}
            {activeId === id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1 bg-[var(--color-brand-violet)] rounded-r animate-slide-in" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
