"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

export function ScrollReveal({
  children,
  offset = 40,
  delay = 0,
  amount = 0.25,
}: {
  children: ReactNode;
  offset?: number;
  delay?: number;
  amount?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.62, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}
