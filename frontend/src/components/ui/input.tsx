import type * as React from "react";
import { cn } from "@/lib/cn";

export function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-body text-foreground shadow-xs",
        "transition-[border-color,box-shadow] duration-fast ease-standard",
        "placeholder:text-subtle-foreground",
        "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20",
        "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20",
        "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60",
        "file:border-0 file:bg-transparent file:font-medium file:text-label",
        className,
      )}
      {...props}
    />
  );
}
