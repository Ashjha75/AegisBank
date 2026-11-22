import type * as React from "react";
import { cn } from "@/lib/cn";
import { inputClasses } from "./input";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="input"
      className={cn(
        inputClasses,
        "field-sizing-content min-h-20 resize-y py-2",
        className,
      )}
      {...props}
    />
  );
}
