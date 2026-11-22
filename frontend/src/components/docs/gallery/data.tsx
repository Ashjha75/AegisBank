"use client";

import { Download, Search, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Amount } from "@/components/ui/amount";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ActiveFilter, FilterChip } from "@/components/ui/filter-chip";
import { Input, InputGroup } from "@/components/ui/input";
import {
  type SearchableOption,
  SearchableSelect,
} from "@/components/ui/searchable-select";
import { TransactionStatusBadge } from "@/components/ui/transaction-status";
import { formatDate } from "@/lib/format";
import { Preview } from "./frame";
import { SAMPLE_TRANSACTIONS, type SampleTransaction } from "./sample-data";

const STATUS_OPTIONS: SearchableOption[] = [
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PENDING_VERIFICATION", label: "Needs OTP" },
  { value: "FAILED", label: "Failed" },
  { value: "FLAGGED", label: "Flagged" },
];

const ACCOUNT_OPTIONS: SearchableOption[] = [
  {
    value: "Savings •••• 4821",
    label: "Savings",
    description: "•••• 4821",
    icon: <Wallet aria-hidden="true" />,
  },
  {
    value: "Current •••• 7710",
    label: "Current",
    description: "•••• 7710",
    icon: <Wallet aria-hidden="true" />,
  },
];

const PAYEE_OPTIONS: SearchableOption[] = [
  ...new Set(SAMPLE_TRANSACTIONS.map((t) => t.counterparty)),
].map((name) => ({
  value: name,
  label: name,
  icon: <Avatar name={name} size="sm" />,
}));

/** Columns: labels and how each cell renders. The S.N. column is added by DataTable. */
const COLUMNS: DataTableColumn<SampleTransaction>[] = [
  {
    key: "date",
    header: "Date",
    sortable: true,
    className: "whitespace-nowrap",
    cell: (t) => (
      <span className="numeric text-muted-foreground">
        {formatDate(t.date)}
      </span>
    ),
  },
  {
    key: "counterparty",
    header: "Details",
    sortable: true,
    cell: (t) => (
      <div className="grid gap-0.5">
        <span className="font-medium">{t.counterparty}</span>
        <span className="text-caption text-muted-foreground">
          {t.reference} · <span className="font-mono">{t.id}</span>
        </span>
      </div>
    ),
  },
  { key: "account", header: "Account", className: "whitespace-nowrap" },
  {
    key: "status",
    header: "Status",
    cell: (t) => <TransactionStatusBadge status={t.status} />,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    sortable: true,
    // Sorting compares the backend's values; nothing is calculated.
    sortValue: (t) => Number(t.amount),
    cell: (t) => (
      <Amount
        value={t.amount}
        direction={
          t.status === "FAILED"
            ? "failed"
            : t.status === "COMPLETED"
              ? t.direction
              : "pending"
        }
      />
    ),
  },
];

type Direction = "all" | "credit" | "debit";

/**
 * Transactions example: the filters are plain page code (not a reusable component), the table is the
 * reusable <DataTable>. Filtering happens here; DataTable only receives the result.
 */
export function GalleryDataTable() {
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<Direction>("all");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [payees, setPayees] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_TRANSACTIONS.filter(
      (t) =>
        (direction === "all" || t.direction === direction) &&
        (statuses.length === 0 || statuses.includes(t.status)) &&
        (!account || t.account === account) &&
        (payees.length === 0 || payees.includes(t.counterparty)) &&
        (!q ||
          t.counterparty.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)),
    );
  }, [query, direction, statuses, account, payees]);

  const filtered =
    query || direction !== "all" || statuses.length || account || payees.length;
  const reset = () => {
    setQuery("");
    setDirection("all");
    setStatuses([]);
    setAccount(null);
    setPayees([]);
  };
  const statusLabel = (v: string) =>
    STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;

  return (
    <Preview
      title="Transactions: filters + DataTable"
      description="Search, Money in/out chips, three searchable dropdown filters (Status and Payee allow several), sortable columns, row selection, S.N. and pagination with rows-per-page."
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup
            start={<Search aria-hidden="true" />}
            className="w-full sm:w-60"
          >
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, reference, ID"
              aria-label="Search transactions"
              className="h-8"
            />
          </InputGroup>
          {(["all", "credit", "debit"] as const).map((d) => (
            <FilterChip
              key={d}
              pressed={direction === d}
              onPressedChange={() => setDirection(d)}
            >
              {d === "all" ? "All" : d === "credit" ? "Money in" : "Money out"}
            </FilterChip>
          ))}
          <SearchableSelect
            label="Status"
            multiple
            options={STATUS_OPTIONS}
            value={statuses}
            onChange={setStatuses}
          />
          <SearchableSelect
            label="Account"
            options={ACCOUNT_OPTIONS}
            value={account}
            onChange={setAccount}
          />
          <SearchableSelect
            label="Payee"
            multiple
            options={PAYEE_OPTIONS}
            value={payees}
            onChange={setPayees}
          />
          <Button variant="secondary" size="sm" className="ml-auto">
            <Download aria-hidden="true" /> Export
          </Button>
        </div>

        {filtered ? (
          <div className="flex flex-wrap items-center gap-2">
            {query && (
              <ActiveFilter onRemove={() => setQuery("")}>
                {`Search: ${query}`}
              </ActiveFilter>
            )}
            {direction !== "all" && (
              <ActiveFilter onRemove={() => setDirection("all")}>
                {direction === "credit" ? "Money in" : "Money out"}
              </ActiveFilter>
            )}
            {statuses.map((s) => (
              <ActiveFilter
                key={s}
                onRemove={() => setStatuses(statuses.filter((x) => x !== s))}
              >
                {`Status: ${statusLabel(s)}`}
              </ActiveFilter>
            ))}
            {account && (
              <ActiveFilter onRemove={() => setAccount(null)}>
                {`Account: ${account}`}
              </ActiveFilter>
            )}
            {payees.map((p) => (
              <ActiveFilter
                key={p}
                onRemove={() => setPayees(payees.filter((x) => x !== p))}
              >
                {`Payee: ${p}`}
              </ActiveFilter>
            ))}
            <Button variant="link" size="xs" onClick={reset}>
              Clear all
            </Button>
          </div>
        ) : null}

        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-sm bg-surface-subtle px-3 py-1.5 text-label">
            <span className="numeric">{selected.size} selected</span>
            <Button
              variant="link"
              size="xs"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </Button>
          </div>
        )}

        <DataTable
          label="Transactions"
          columns={COLUMNS}
          data={rows}
          getRowKey={(t) => t.id}
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          empty={{
            title: "No transactions match",
            description: "Try a different search or remove a filter.",
            action: (
              <Button variant="secondary" size="sm" onClick={reset}>
                Clear filters
              </Button>
            ),
          }}
        />
      </div>
    </Preview>
  );
}

/** The same table in its loading state, and with server-side paging (rows for one page + total). */
export function GalleryDataTableStates() {
  const [page, setPage] = useState(3);
  const [pageSize, setPageSize] = useState(10);
  const serverRows = SAMPLE_TRANSACTIONS.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const simple = COLUMNS.filter((c) =>
    ["date", "counterparty", "status", "amount"].includes(c.key),
  );
  return (
    <>
      <Preview
        title="Server-side paging"
        description={`The API returns one page plus the total (here page ${page}, ${pageSize} per page): pass data, total, page and pageSize. S.N. continues from ${(page - 1) * pageSize + 1}.`}
      >
        <DataTable
          label="Transactions, server paged"
          columns={simple}
          data={serverRows}
          getRowKey={(t) => t.id}
          total={SAMPLE_TRANSACTIONS.length}
          page={page}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </Preview>
      <Preview
        title="Loading"
        description="Skeleton rows keep the layout while data loads."
      >
        <DataTable
          label="Loading example"
          columns={simple}
          data={[] as SampleTransaction[]}
          loading
          pageSize={5}
        />
      </Preview>
    </>
  );
}
