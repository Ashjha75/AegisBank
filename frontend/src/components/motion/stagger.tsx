"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Reveals a list one item after another (cards in a grid, rows of a summary).
 * Quiet by design: 6px rise, 40ms apart. Reduced-motion users see everything at once (MotionConfig).
 *
 *   <Stagger className="grid gap-4 md:grid-cols-3">
 *     {accounts.map((a) => <StaggerItem key={a.id}><StatCard ... /></StaggerItem>)}
 *   </Stagger>
 */
const EASE = [0.16, 1, 0.3, 1] as const;

export function Stagger({
  children,
  className,
  inView = false,
  gap = 0.04,
}: {
  children: ReactNode;
  className?: string;
  /** Start when scrolled into view instead of on mount. */
  inView?: boolean;
  /** Seconds between items. */
  gap?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      {...(inView
        ? { whileInView: "visible", viewport: { once: true, margin: "-48px" } }
        : { animate: "visible" })}
      variants={{ visible: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 6 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
