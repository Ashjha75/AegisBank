import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Inline message inside a page or form. For transient feedback use a toast instead.
 * `variant="banner"` is a full-width strip for the top of a page (maintenance, account notices).
 */
const alertVariants = cva("flex gap-3 border text-body-sm", {
  variants: {
    tone: {
      neutral: "border-border bg-surface-subtle text-foreground",
      info: "border-info-border bg-info-subtle text-info-foreground",
      success:
        "border-success-border bg-success-subtle text-success-foreground",
      warning:
        "border-warning-border bg-warning-subtle text-warning-foreground",
      danger: "border-danger-border bg-danger-subtle text-danger-foreground",
    },
    variant: {
      default: "rounded-md px-4 py-3",
      banner: "items-center border-x-0 px-5 py-2.5",
    },
  },
  defaultVariants: { tone: "info", variant: "default" },
});

const icons = {
  neutral: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export interface AlertProps
  extends Omit<React.ComponentProps<"div">, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  /** Extra line under the message, e.g. a reference number for support. */
  footer?: React.ReactNode;
  /** Buttons or links on the right. */
  action?: React.ReactNode;
  /** Shows a close button that calls this. */
  onDismiss?: () => void;
}

export function Alert({
  className,
  tone = "info",
  variant,
  title,
  footer,
  action,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[tone ?? "info"];
  return (
    <div
      data-slot="alert"
      role={tone === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ tone, variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="grid flex-1 gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-foreground/80">{children}</div>}
        {footer && <div className="text-caption opacity-80">{footer}</div>}
      </div>
      {action && (
        <div className="flex shrink-0 items-start gap-2">{action}</div>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm opacity-70 transition-opacity duration-fast hover:opacity-100"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
