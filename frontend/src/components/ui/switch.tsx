"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

/** On/off setting that applies immediately (e.g. "Card payments online"). In forms use a checkbox. */
export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5",
        "bg-border-strong transition-colors duration-base ease-standard",
        "data-[state=checked]:bg-brand disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-surface shadow-sm transition-transform duration-base ease-standard data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
