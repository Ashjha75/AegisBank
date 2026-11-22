"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

/** Page numbers to show: first, last, current ±1, with "gap" markers in between. */
export function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const result: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) result.push("gap");
  for (let p = start; p <= end; p++) result.push(p);
  if (end < pages - 1) result.push("gap");
  result.push(pages);
  return result;
}

/**
 * "51–100 of 248", rows-per-page selector, page numbers, previous/next. Pages are 1-based.
 * Used by <DataTable>; usable on its own for any paged list.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  disabled = false,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Show a rows-per-page selector with these options. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 text-body-sm text-muted-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <p className="numeric" aria-live="polite">
          <span className="text-foreground">
            {from}–{to}
          </span>{" "}
          of {total}
        </p>
        {pageSizeOptions && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              disabled={disabled}
            >
              <SelectTrigger
                aria-label="Rows per page"
                className="numeric h-8 w-18"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        {pageWindow(page, pages).map((p, i) =>
          p === "gap" ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: gaps have no identity
              key={`gap-${i}`}
              className="px-1 text-subtle-foreground"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "secondary" : "ghost"}
              size="icon-sm"
              className="numeric w-auto min-w-8 px-2"
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              disabled={disabled}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
