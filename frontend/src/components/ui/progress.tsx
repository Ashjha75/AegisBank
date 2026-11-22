"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

/**
 * Progress bar. Pass `value` (0-100) for known progress; leave it out for an indeterminate bar
 * (e.g. "Processing transfer"). Always give it an accessible `label`.
 */
export function Progress({
  value,
  label,
  className,
  tone = "primary",
}: {
  value?: number | null;
  label: string;
  className?: string;
  tone?: "primary" | "brand";
}) {
  const indeterminate = value === undefined || value === null;
  return (
    <ProgressPrimitive.Root
      value={indeterminate ? null : value}
      aria-label={label}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken",
        className,
      )}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full",
          tone === "brand" ? "bg-brand" : "bg-primary",
          indeterminate
            ? "w-2/5 animate-indeterminate motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-40"
            : "transition-[width] duration-slow ease-standard",
        )}
        style={indeterminate ? undefined : { width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
