import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/cn";

/** Nothing to show yet (no transactions, no results). Says why and offers the next step. */
export function EmptyState({
  Icon,
  title,
  description,
  action,
  className,
}: {
  Icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground shadow-xs">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="grid max-w-sm gap-1">
        <p className="font-medium text-body text-foreground">{title}</p>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
