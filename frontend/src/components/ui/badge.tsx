import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/cn";

/** Small status label. Colour carries meaning, so the text must say the same thing. */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 font-medium text-caption [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface-subtle text-muted-foreground",
        info: "border-info-border bg-info-subtle text-info-foreground",
        success:
          "border-success-border bg-success-subtle text-success-foreground",
        warning:
          "border-warning-border bg-warning-subtle text-warning-foreground",
        danger: "border-danger-border bg-danger-subtle text-danger-foreground",
        accent: "border-transparent bg-accent-subtle text-accent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  /** Adds a small dot in the tone colour before the text. */
  dot?: boolean;
}

export function Badge({
  className,
  tone,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };
