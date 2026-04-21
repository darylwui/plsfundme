"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

export function ScrollReveal({
  children,
  offset = 60,
  delay = 0,
  amount = 0.2,
  duration = 0.7,
}: {
  children: ReactNode;
  offset?: number;
  delay?: number;
  amount?: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -10% 0px" }}
      transition={{ duration, delay, ease: [0.21, 0.62, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}
