"use client";

import { Inbox, type LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Checkbox } from "./checkbox";
import { EmptyState } from "./empty-state";
import { Pagination } from "./pagination";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortHead,
} from "./table";

/**
 * Generic data table with built-in pagination and an automatic S.N. (serial number) column.
 *
 *   <DataTable
 *     columns={[
 *       { key: "name", header: "Name" },
 *       { key: "amount", header: "Amount", align: "right", cell: (row) => <Amount value={row.amount} /> },
 *     ]}
 *     data={rows}
 *     getRowKey={(row) => row.id}
 *   />
 *
 * Pagination has two modes:
 *   - Client (default): pass ALL rows in `data`; the table slices them per page.
 *   - Server: pass only the current page in `data` plus `total`, `page`, `onPageChange`
 *     (and `pageSize` / `onPageSizeChange`) - the backend does the paging.
 *
 * S.N. always continues across pages: page 2 with 50 rows per page starts at 51.
 * Filters live OUTSIDE the table: filter your rows (or your API query) and pass the result.
 */

export type DataTableColumn<T> = {
  /** Unique id. Also the default property read from the row when there is no `cell`. */
  key: string;
  /** Column label. */
  header: React.ReactNode;
  /** Custom cell. Without it, `row[key]` is shown as text. */
  cell?: (row: T, rowIndex: number) => React.ReactNode;
  align?: "left" | "right";
  /** Show a sort button in the header. */
  sortable?: boolean;
  /** Value used for client-side sorting (default `row[key]`). Compare only - never calculate money. */
  sortValue?: (row: T) => string | number;
  /** e.g. "w-40" or "min-w-56". */
  className?: string;
};

export type SortState = { key: string; direction: "asc" | "desc" } | null;

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Stable row id. Defaults to the row's position (fine for static data). */
  getRowKey?: (row: T, index: number) => string;

  /** Show the S.N. column (default true). */
  showSerialNumber?: boolean;
  serialNumberLabel?: string;

  /**
   * Hides the pagination bar. The table still shows only `pageSize` rows, so this is what a
   * "latest 5" preview wants: no page controls, and no "Rows per page" box offering sizes that
   * would not make sense there.
   */
  pagination?: boolean;
  /** Rows per page. Controlled with `onPageSizeChange`, otherwise the initial value. Default 10. */
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  /** 1-based. Controlled with `onPageChange`, otherwise internal. */
  page?: number;
  onPageChange?: (page: number) => void;
  /** Server mode: total number of rows across all pages. */
  total?: number;

  /** Controlled sort (server mode). Without `onSortChange` the table sorts client-side. */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;

  /** Row selection (checkbox column). */
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;

  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: {
    Icon?: LucideIcon;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
  };
  /** Accessible name for the table. */
  label?: string;
  className?: string;
}

function readValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export function DataTable<T>({
  columns,
  data,
  getRowKey = (_row, index) => String(index),
  showSerialNumber = true,
  serialNumberLabel = "S.N.",
  pagination = true,
  pageSize: pageSizeProp = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  page: pageProp,
  onPageChange,
  total,
  sort: sortProp,
  onSortChange,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  onRowClick,
  loading = false,
  empty = { title: "Nothing to show yet" },
  label,
  className,
}: DataTableProps<T>) {
  const serverMode = total !== undefined;

  // Controlled or internal state for page, page size and sort.
  const [innerPage, setInnerPage] = React.useState(1);
  const [innerPageSize, setInnerPageSize] = React.useState(pageSizeProp);
  const [innerSort, setInnerSort] = React.useState<SortState>(null);
  const page = pageProp ?? innerPage;
  const pageSize = onPageSizeChange ? pageSizeProp : innerPageSize;
  const sort = onSortChange ? (sortProp ?? null) : innerSort;

  const setPage = (next: number) => {
    setInnerPage(next);
    onPageChange?.(next);
  };
  const setPageSize = (next: number) => {
    setInnerPageSize(next);
    onPageSizeChange?.(next);
    setPage(1);
  };
  const setSort = (next: SortState) => {
    setInnerSort(next);
    onSortChange?.(next);
    if (!serverMode) setPage(1);
  };

  const totalRows = serverMode ? total : data.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  // Data shrank (e.g. a filter was applied) - don't stay on a page that no longer exists.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-check when the bounds change
  React.useEffect(() => {
    if (!loading && page > pageCount) setPage(pageCount);
  }, [page, pageCount, loading]);

  const rows = React.useMemo(() => {
    if (serverMode) return data;
    let sorted = data;
    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      const value = (row: T) =>
        column?.sortValue
          ? column.sortValue(row)
          : (readValue(row, sort.key) as string | number);
      sorted = [...data].sort((a, b) => {
        const va = value(a);
        const vb = value(b);
        const order =
          typeof va === "number" && typeof vb === "number"
            ? va - vb
            : String(va).localeCompare(String(vb), undefined, {
                numeric: true,
              });
        return sort.direction === "asc" ? order : -order;
      });
    }
    return sorted.slice((page - 1) * pageSize, page * pageSize);
  }, [serverMode, data, sort, columns, page, pageSize]);

  const firstSerial = (page - 1) * pageSize + 1;
  const keys = rows.map((row, i) => getRowKey(row, firstSerial - 1 + i));
  const selected = selectedKeys ?? new Set<string>();
  const allSelected = keys.length > 0 && keys.every((k) => selected.has(k));
  const someSelected = keys.some((k) => selected.has(k));

  const toggleSort = (key: string) => {
    if (sort?.key !== key) setSort({ key, direction: "asc" });
    else if (sort.direction === "asc") setSort({ key, direction: "desc" });
    else setSort(null);
  };

  const setSelection = (update: (next: Set<string>) => void) => {
    const next = new Set(selected);
    update(next);
    onSelectionChange?.(next);
  };

  const columnCount =
    columns.length + (showSerialNumber ? 1 : 0) + (selectable ? 1 : 0);
  const skeletonRows = Math.min(pageSize, 8);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-surface",
        className,
      )}
    >
      <Table
        bordered={false}
        aria-label={label}
        aria-busy={loading || undefined}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {selectable && (
              <TableHead className="w-10 pr-0">
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  disabled={loading || keys.length === 0}
                  onCheckedChange={(checked) =>
                    setSelection((next) => {
                      for (const k of keys) {
                        if (checked === true) next.add(k);
                        else next.delete(k);
                      }
                    })
                  }
                />
              </TableHead>
            )}
            {showSerialNumber && (
              <TableHead className="w-14 pr-0">{serialNumberLabel}</TableHead>
            )}
            {columns.map((column) =>
              column.sortable ? (
                <TableSortHead
                  key={column.key}
                  align={column.align}
                  className={column.className}
                  sorted={sort?.key === column.key ? sort.direction : false}
                  onSort={() => toggleSort(column.key)}
                >
                  {column.header}
                </TableSortHead>
              ) : (
                <TableHead
                  key={column.key}
                  align={column.align}
                  className={column.className}
                >
                  {column.header}
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no identity
              <TableRow key={i} className="hover:bg-transparent">
                {Array.from({ length: columnCount }, (_, j) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: placeholder cells have no identity
                  <TableCell key={j}>
                    <Skeleton
                      className={cn("h-4", j === 0 ? "w-6" : "w-full max-w-40")}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="p-4">
                <EmptyState
                  Icon={empty.Icon ?? Inbox}
                  title={empty.title}
                  description={empty.description}
                  action={empty.action}
                  className="border-0"
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => {
              const key = getRowKey(row, firstSerial - 1 + i);
              const isSelected = selected.has(key);
              return (
                <TableRow
                  key={key}
                  data-state={isSelected ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {selectable && (
                    <TableCell
                      className="w-10 pr-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        aria-label={`Select row ${firstSerial + i}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          setSelection((next) => {
                            if (checked === true) next.add(key);
                            else next.delete(key);
                          })
                        }
                      />
                    </TableCell>
                  )}
                  {showSerialNumber && (
                    <TableCell className="numeric w-14 pr-0 text-muted-foreground">
                      {firstSerial + i}
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align}
                      className={column.className}
                    >
                      {column.cell
                        ? column.cell(row, firstSerial - 1 + i)
                        : String(readValue(row, column.key) ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {pagination && (
        <Pagination
          className="border-border border-t px-4 py-3"
          page={Math.min(page, pageCount)}
          pageSize={pageSize}
          total={totalRows}
          onPageChange={setPage}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={setPageSize}
          disabled={loading}
        />
      )}
    </div>
  );
}
