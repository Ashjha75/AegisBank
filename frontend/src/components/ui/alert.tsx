import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/cn";

/** Inline message inside a page or form. For transient feedback use a toast instead. */
const alertVariants = cva(
  "flex gap-3 rounded-lg border px-4 py-3 text-body-sm",
  {
    variants: {
      tone: {
        info: "border-info-border bg-info-subtle text-info-foreground",
        success:
          "border-success-border bg-success-subtle text-success-foreground",
        warning:
          "border-warning-border bg-warning-subtle text-warning-foreground",
        danger: "border-danger-border bg-danger-subtle text-danger-foreground",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const icons = {
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
}

export function Alert({
  className,
  tone = "info",
  title,
  footer,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[tone ?? "info"];
  return (
    <div
      data-slot="alert"
      role={tone === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="grid gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-foreground/85">{children}</div>}
        {footer && <div className="text-caption opacity-80">{footer}</div>}
      </div>
    </div>
  );
}
