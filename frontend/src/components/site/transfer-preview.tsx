"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { TransactionStatusBadge } from "@/components/ui/transaction-status";

/** Illustrative transfer receipt for the hero. Static example data - labelled as such. */
const steps = [
  {
    label: "Funds reserved",
    detail: "Debited from Savings •••• 4821",
    time: "14:05:02",
  },
  {
    label: "Fraud check passed",
    detail: "Velocity, amount and balance rules",
    time: "14:05:02",
  },
  {
    label: "Credited to receiver",
    detail: "Priya Sharma •••• 9012",
    time: "14:05:03",
  },
];

export function TransferPreview() {
  return (
    <Card className="w-full max-w-md shadow-sm">
      <div className="flex items-center justify-between gap-3 border-border border-b px-6 py-4">
        <div className="grid gap-0.5">
          <span className="font-medium text-overline text-subtle-foreground uppercase">
            Transfer · Example
          </span>
          <span className="font-mono text-caption text-muted-foreground">
            REF 7F3A-92C1-0B4E
          </span>
        </div>
        <TransactionStatusBadge status="COMPLETED" />
      </div>

      <div className="grid gap-1 px-6 pt-5 pb-4">
        <span className="text-body-sm text-muted-foreground">
          To Priya Sharma
        </span>
        <Amount value={25000} size="xl" />
      </div>

      <ol className="grid gap-0 px-6 pb-6">
        {steps.map((step, index) => (
          <motion.li
            key={step.label}
            className="relative flex gap-3 pb-4 last:pb-0"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.28,
              delay: 0.35 + index * 0.12,
              ease: [0.05, 0.7, 0.1, 1],
            }}
          >
            {index < steps.length - 1 && (
              <span
                className="absolute top-6 bottom-0 left-[0.6875rem] w-px bg-border"
                aria-hidden="true"
              />
            )}
            <span className="relative mt-0.5 flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border border-success-border bg-success-subtle text-success-foreground">
              <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="grid gap-0.5">
                <span className="font-medium text-body-sm text-foreground">
                  {step.label}
                </span>
                <span className="text-caption text-muted-foreground">
                  {step.detail}
                </span>
              </div>
              <span className="numeric pt-0.5 text-caption text-subtle-foreground">
                {step.time}
              </span>
            </div>
          </motion.li>
        ))}
      </ol>
    </Card>
  );
}
