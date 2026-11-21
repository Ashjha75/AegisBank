import type * as React from "react";
import { cn } from "@/lib/cn";

/** Placeholder that keeps the final layout while data loads. Size it like the real content. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "rounded-md bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--surface-sunken)_0%,var(--surface-subtle)_50%,var(--surface-sunken)_100%)]",
        "animate-shimmer motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
