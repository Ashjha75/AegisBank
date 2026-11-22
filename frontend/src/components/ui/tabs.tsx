"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

/**
 * Two looks:
 *   variant="underline" (default) - page sections, reads well above tables.
 *   variant="segmented"           - compact switch between views (Day / Week / Month).
 */
export function TabsList({
  className,
  variant = "underline",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: "underline" | "segmented";
}) {
  return (
    <TabsPrimitive.List
      data-variant={variant}
      className={cn(
        "group/tabs flex items-center",
        variant === "underline"
          ? "gap-6 border-border border-b"
          : "inline-flex w-fit gap-0.5 rounded-md border border-border bg-surface-subtle p-0.5",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "cursor-pointer font-medium text-label text-muted-foreground transition-colors duration-fast hover:text-foreground",
        // underline
        "group-data-[variant=underline]/tabs:-mb-px group-data-[variant=underline]/tabs:border-transparent group-data-[variant=underline]/tabs:border-b-2 group-data-[variant=underline]/tabs:pt-1 group-data-[variant=underline]/tabs:pb-2.5",
        "group-data-[variant=underline]/tabs:data-[state=active]:border-foreground group-data-[variant=underline]/tabs:data-[state=active]:text-foreground",
        // segmented
        "group-data-[variant=segmented]/tabs:rounded-sm group-data-[variant=segmented]/tabs:px-3 group-data-[variant=segmented]/tabs:py-1",
        "group-data-[variant=segmented]/tabs:data-[state=active]:bg-surface group-data-[variant=segmented]/tabs:data-[state=active]:text-foreground group-data-[variant=segmented]/tabs:data-[state=active]:shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("pt-5 outline-none", className)}
      {...props}
    />
  );
}
