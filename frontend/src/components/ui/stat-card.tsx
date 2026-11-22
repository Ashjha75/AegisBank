import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/cn";
import { Card } from "./card";
import { Skeleton } from "./skeleton";

/**
 * A single figure with its label: account balance, money in this month, pending transfers.
 *
 *   <StatCard label="Savings •••• 4821" value={<Amount value={balance} size="xl" />}
 *             hint="Available balance" action={<Button size="xs" variant="secondary">Statement</Button>} />
 *
 * `trend` is text the backend computed (e.g. "+12% vs last month") - never calculate it in the browser.
 */
export function StatCard({
  label,
  value,
  hint,
  Icon,
  trend,
  action,
  loading = false,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  Icon?: LucideIcon;
  trend?: { text: string; tone: "positive" | "negative" | "neutral" };
  action?: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("grid gap-3 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-body-sm text-muted-foreground">
          {Icon && (
            <Icon className="size-4" strokeWidth={1.85} aria-hidden="true" />
          )}
          {label}
        </span>
        {action}
      </div>
      {loading ? (
        <Skeleton className="h-9 w-40" />
      ) : (
        <div className="text-foreground">{value}</div>
      )}
      {(hint || trend) && (
        <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trend.tone === "positive" && "text-success-foreground",
                trend.tone === "negative" && "text-danger-foreground",
              )}
            >
              {trend.text}
            </span>
          )}
          {hint}
        </div>
      )}
    </Card>
  );
}
