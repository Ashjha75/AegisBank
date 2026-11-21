import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Buttons. One `primary` per view (the main action); `secondary` for the rest;
 * `ghost` for toolbars; `danger` only for irreversible actions.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-standard",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        accent:
          "bg-accent text-accent-foreground shadow-xs hover:bg-accent-hover",
        secondary:
          "border border-border-strong bg-surface text-foreground shadow-xs hover:bg-surface-subtle",
        ghost: "text-foreground hover:bg-secondary",
        link: "h-auto px-0 text-accent underline-offset-4 hover:text-accent-hover hover:underline",
        danger: "bg-danger text-danger-on shadow-xs hover:bg-danger-hover",
      },
      size: {
        sm: "h-8 px-3 text-label [&_svg]:size-4",
        md: "h-10 px-4 text-body [&_svg]:size-4",
        lg: "h-12 px-6 text-body-lg [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a Next.js <Link>) with button styles. */
  asChild?: boolean;
  /** Shows a spinner, disables the button and keeps its width. */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { buttonVariants };
