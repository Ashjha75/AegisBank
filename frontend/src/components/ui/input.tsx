import type * as React from "react";
import { cn } from "@/lib/cn";

export const inputClasses = cn(
  "flex h-9.5 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-body-sm text-foreground shadow-xs",
  "transition-[border-color,box-shadow] duration-fast ease-standard",
  "placeholder:text-subtle-foreground",
  "hover:border-foreground/40",
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/15",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/15",
  "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60",
  "file:border-0 file:bg-transparent file:font-medium file:text-label",
);

export function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClasses, className)}
      {...props}
    />
  );
}

/**
 * Input with a leading and/or trailing adornment (icon, currency symbol, button).
 *
 *   <InputGroup start={<Search />}><Input placeholder="Search" /></InputGroup>
 *   <InputGroup start="₹" end="INR"><Input inputMode="decimal" /></InputGroup>
 */
export function InputGroup({
  start,
  end,
  className,
  children,
}: {
  start?: React.ReactNode;
  end?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "relative flex w-full items-center",
        start && "[&_[data-slot=input]]:pl-9",
        end && "[&_[data-slot=input]]:pr-12",
        className,
      )}
    >
      {start && (
        <span className="pointer-events-none absolute left-3 flex items-center text-body-sm text-subtle-foreground [&_svg]:size-4">
          {start}
        </span>
      )}
      {children}
      {end && (
        <span className="absolute right-2 flex items-center text-caption text-subtle-foreground [&_svg]:size-4">
          {end}
        </span>
      )}
    </div>
  );
}
