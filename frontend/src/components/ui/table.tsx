import type * as React from "react";
import { cn } from "@/lib/cn";

/** Data table. Right-align money columns (`align="right"` + <Amount/>) so decimals line up. */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface">
      <table
        className={cn(
          "w-full caption-bottom border-collapse text-body-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return <thead className={cn("bg-surface-subtle", className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-border border-b transition-colors duration-fast hover:bg-surface-subtle/60",
        className,
      )}
      {...props}
    />
  );
}

type Align = { align?: "left" | "right" };

export function TableHead({
  className,
  align = "left",
  ...props
}: React.ComponentProps<"th"> & Align) {
  return (
    <th
      scope="col"
      className={cn(
        "h-10 whitespace-nowrap border-border border-b px-4 font-medium text-caption text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  align = "left",
  ...props
}: React.ComponentProps<"td"> & Align) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-foreground",
        align === "right" && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn("py-3 text-caption text-muted-foreground", className)}
      {...props}
    />
  );
}
