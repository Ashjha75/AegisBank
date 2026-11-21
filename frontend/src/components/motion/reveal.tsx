"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Fade + 8px rise when content first appears. For page-level entrances (hero, section headers) only -
 * not for every element. Reduced-motion users get the content immediately (MotionConfig in providers).
 * Timings mirror the motion tokens: --duration-slower (420ms), --ease-enter.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  inView = false,
}: {
  children: ReactNode;
  /** Seconds. Stagger siblings by ~0.06s. */
  delay?: number;
  className?: string;
  /** Animate when scrolled into view instead of on page load. */
  inView?: boolean;
}) {
  const target = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      {...(inView
        ? { whileInView: target, viewport: { once: true, margin: "-64px" } }
        : { animate: target })}
      transition={{ duration: 0.42, delay, ease: [0.05, 0.7, 0.1, 1] }}
    >
      {children}
    </motion.div>
  );
}
