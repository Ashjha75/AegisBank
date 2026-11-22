"use client";

import { RadioGroup as RadioPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/cn";

export function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioPrimitive.Root>) {
  return (
    <RadioPrimitive.Root className={cn("grid gap-2.5", className)} {...props} />
  );
}

export function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioPrimitive.Item>) {
  return (
    <RadioPrimitive.Item
      className={cn(
        "peer flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-input bg-surface shadow-xs",
        "transition-colors duration-fast data-[state=checked]:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator className="size-2 rounded-full bg-primary" />
    </RadioPrimitive.Item>
  );
}

/**
 * Large selectable option (choose an account, a transfer speed). Wraps a RadioGroupItem.
 *
 *   <RadioGroup><RadioCard value="imps" title="Instant" description="Arrives in seconds" /></RadioGroup>
 */
export function RadioCard({
  value,
  title,
  description,
  aside,
  disabled,
}: {
  value: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  disabled?: boolean;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface px-4 py-3",
        "transition-colors duration-fast hover:border-border-strong",
        "has-data-[state=checked]:border-primary has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-primary",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <RadioGroupItem
        id={id}
        value={value}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="grid flex-1 gap-0.5">
        <span className="font-medium text-body-sm text-foreground">
          {title}
        </span>
        {description && (
          <span className="text-caption text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      {aside && <span className="text-body-sm text-foreground">{aside}</span>}
    </label>
  );
}
