import type * as React from "react";
import { cn } from "@/lib/cn";
import { Breadcrumb } from "./breadcrumb";

/**
 * Top of a page: optional breadcrumb, title, description and page-level actions on the right.
 *
 *   <PageHeader breadcrumb={[{ label: "Accounts", href: "/app/accounts" }, { label: "Savings" }]}
 *               title="Savings •••• 4821" actions={<Button>Transfer</Button>} />
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)}>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          {title && <h1 className="text-h2 text-foreground">{title}</h1>}
          {description && (
            <p className="text-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
