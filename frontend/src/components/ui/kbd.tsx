import type * as React from "react";
import { cn } from "@/lib/cn";

/** Keyboard key hint, e.g. <Kbd>⌘</Kbd><Kbd>K</Kbd>. */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-border border-b-2 bg-surface px-1 font-mono text-[0.6875rem] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
