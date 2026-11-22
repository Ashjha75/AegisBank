import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

/**
 * Buttons. One `primary` (ink) per view for the main action; `secondary` (outlined) for the rest;
 * `brand` (green) sparingly for a positive confirmation; `ghost` for toolbars; `danger` only for
 * irreversible actions; `link` for inline text actions.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-standard",
    "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        brand: "bg-brand text-brand-foreground shadow-xs hover:bg-brand-hover",
        secondary:
          "border border-border-strong bg-surface text-foreground shadow-xs hover:border-input hover:bg-surface-subtle",
        subtle:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "h-auto! px-0! text-brand underline-offset-4 hover:text-brand-hover hover:underline active:scale-100",
        danger: "bg-danger text-danger-on shadow-xs hover:bg-danger-hover",
      },
      size: {
        xs: "h-7 gap-1.5 px-2.5 text-caption [&_svg]:size-3.5",
        sm: "h-8 px-3 text-label [&_svg]:size-4",
        md: "h-9.5 px-4 text-body-sm [&_svg]:size-4",
        lg: "h-11 px-5 text-body [&_svg]:size-4.5",
        icon: "size-9.5 [&_svg]:size-4.5",
        "icon-sm": "size-8 [&_svg]:size-4",
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
  /** Shows a spinner in place of the label, disables the button and keeps its width. */
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
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner size="sm" label="Working" />
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-[inherit]",
              loading && "invisible",
            )}
          >
            {children}
          </span>
        </>
      )}
    </Comp>
  );
}

export { buttonVariants };
