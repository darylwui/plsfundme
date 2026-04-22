"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/**
 * A loud, unmissable "keep scrolling" affordance. Fades out after the user
 * scrolls past a small threshold so it doesn't linger past its usefulness.
 */
export function ScrollDownCue({
  label = "Scroll for more",
  hideAfter = 120,
}: {
  label?: string;
  hideAfter?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < hideAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideAfter]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="scroll-cue"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5, ease: [0.21, 0.62, 0.35, 1] }}
          className="mt-12 md:mt-16 flex flex-col items-center gap-4"
          aria-hidden="true"
        >
          <motion.span
            whileInView={{ y: [0, 6, 0] }}
            viewport={{ once: false }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm md:text-base uppercase tracking-[0.22em] font-black text-[var(--color-brand-crust)] dark:text-[var(--color-brand-golden)]"
          >
            {label}
          </motion.span>

          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[var(--color-brand-crust)] dark:border-[var(--color-brand-golden)]"
              whileInView={{ scale: [1, 1.6, 1.6], opacity: [0.7, 0, 0] }}
              viewport={{ once: false }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[var(--color-brand-crust)] dark:border-[var(--color-brand-golden)]"
              whileInView={{ scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] }}
              viewport={{ once: false }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.6,
              }}
            />
            {/* Bouncing chevron */}
            <motion.span
              whileInView={{ y: [0, 10, 0] }}
              viewport={{ once: false }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--color-brand-crust)] dark:bg-[var(--color-brand-golden)] text-white shadow-[var(--shadow-cta)]"
            >
              <ChevronDown
                className="w-6 h-6 md:w-7 md:h-7"
                strokeWidth={3}
              />
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
