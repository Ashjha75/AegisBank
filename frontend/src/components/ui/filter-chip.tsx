"use client";

import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Filters.
 *   <FilterChip pressed={...} onPressedChange={...}>Credits</FilterChip>   toggle a quick filter
 *   <ActiveFilter onRemove={...}>Status: Failed</ActiveFilter>            an applied filter, removable
 */
export function FilterChip({
  pressed,
  onPressedChange,
  count,
  className,
  children,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  /** Optional number of matching items. */
  count?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 font-medium text-label transition-colors duration-fast",
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-surface text-foreground hover:bg-surface-subtle",
        className,
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "numeric text-caption",
            pressed ? "text-primary-foreground/70" : "text-subtle-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function ActiveFilter({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-surface-subtle pr-1 pl-2.5 text-caption text-foreground">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${typeof children === "string" ? children : ""}`.trim()}
        className="flex size-5 cursor-pointer items-center justify-center rounded-xs text-muted-foreground transition-colors duration-fast hover:bg-secondary-hover hover:text-foreground"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </span>
  );
}
