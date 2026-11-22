import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Data table. Right-align money columns (`align="right"` + <Amount/>) so decimals line up.
 * For a toolbar (search, filters) and pagination around it, see the "Transactions" example
 * in the docs gallery.
 */
export function Table({
  className,
  bordered = true,
  ...props
}: React.ComponentProps<"table"> & {
  /** Draw the outer frame. Turn off when the table sits inside a <Card>. */
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto bg-surface",
        bordered && "rounded-md border border-border",
      )}
    >
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
        "border-border border-b transition-colors duration-fast hover:bg-surface-subtle data-[state=selected]:bg-brand-subtle",
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
        "h-9 whitespace-nowrap border-border border-b px-4 font-medium text-caption text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

/** Clickable column header. `sorted` reflects the current sort; announce it with aria-sort. */
export function TableSortHead({
  children,
  sorted,
  onSort,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  sorted: "asc" | "desc" | false;
  onSort: () => void;
  className?: string;
} & Align) {
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
  return (
    <TableHead
      align={align}
      aria-sort={
        sorted === "asc"
          ? "ascending"
          : sorted === "desc"
            ? "descending"
            : "none"
      }
      className={className}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "-mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1.5 py-0.5 transition-colors duration-fast hover:bg-accent hover:text-foreground",
          sorted && "text-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {children}
        <Icon
          className={cn("size-3.5", !sorted && "opacity-50")}
          aria-hidden="true"
        />
      </button>
    </TableHead>
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
