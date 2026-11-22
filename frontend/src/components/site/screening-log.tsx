"use client";

import { motion } from "motion/react";

/**
 * Terminal-style log of a transfer moving through the transaction-service SAGA (hero illustration,
 * example data). Steps mirror TransactionService: PENDING -> debit sender -> PROCESSING ->
 * OTP if amount >= threshold (default ₹50,000) -> credit receiver -> COMPLETED.
 * Lines appear one by one; reduced-motion users see them immediately (MotionConfig).
 */
const lines: { text: string; tone?: "muted" | "ok" }[] = [
  { text: "$ transfer create --to ••9012 --amount 25000.00", tone: "muted" },
  { text: "→ status PENDING" },
  { text: "→ debit sender SAV-4821 ................ ok" },
  { text: "→ status PROCESSING" },
  { text: "→ below OTP threshold (₹50,000) ........ no OTP" },
  { text: "→ credit receiver ••9012 ............... ok" },
  { text: "✓ COMPLETED  ref 7F3A-92C1", tone: "ok" },
];

export function ScreeningLog() {
  return (
    <div className="overflow-hidden rounded-md border border-primary bg-primary text-primary-foreground shadow-lg">
      <div className="flex items-center justify-between gap-3 border-primary-foreground/10 border-b px-4 py-2.5">
        <span className="font-mono text-caption text-primary-foreground/60">
          transaction-service · example
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-caption text-primary-foreground/60">
          <span
            className="size-1.5 rounded-full bg-brand-mark-accent"
            aria-hidden="true"
          />
          replay
        </span>
      </div>
      <ol className="grid gap-1 px-4 py-4 font-mono text-[0.75rem] leading-relaxed">
        {lines.map((line, index) => (
          <motion.li
            key={line.text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.5 + index * 0.22 }}
            className={
              line.tone === "muted"
                ? "text-primary-foreground/55"
                : line.tone === "ok"
                  ? "text-brand-mark-accent"
                  : "text-primary-foreground/85"
            }
          >
            <span className="whitespace-pre">{line.text}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
