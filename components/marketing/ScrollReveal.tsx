"use client";

import { useEffect, useRef } from "react";

export function ScrollReveal({
  children,
  className,
  offset = 60,
  delay = 0,
  amount = 0.2,
  duration = 0.7,
}: {
  children: React.ReactNode;
  className?: string;
  offset?: number;
  amount?: number;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("scroll-reveal-visible");
          observer.disconnect();
        }
      },
      { threshold: amount, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, amount]);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className ?? ""}`}
      style={
        duration !== 0.7
          ? {
              transitionDuration: `${duration * 1000}ms`,
              ["--scroll-reveal-offset" as string]: `${offset}px`,
            }
          : offset !== 60
          ? { ["--scroll-reveal-offset" as string]: `${offset}px` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
