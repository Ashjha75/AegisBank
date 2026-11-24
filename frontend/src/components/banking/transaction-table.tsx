"use client";

import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { Amount } from "@/components/ui/amount";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { TransactionStatusBadge } from "@/components/ui/transaction-status";
import type { TransactionResponse } from "@/lib/api/types";
import { formatAccountNumber, formatDateTime } from "@/lib/format";
import {
  amountDirectionFor,
  counterpartyFor,
  directionFor,
} from "@/lib/transactions";

/**
 * Transaction history, read from one account's point of view: the same transfer is "sent" for
 * the sender and "received" for the receiver, so `accountNumber` decides the arrow, the party
 * shown and the sign on the amount. Clicking a row opens the transaction.
 */
export function TransactionTable({
  transactions,
  accountNumber,
  loading,
  pageSize = 10,
  pagination = true,
  empty,
  className,
}: {
  transactions: TransactionResponse[];
  accountNumber: string;
  loading?: boolean;
  pageSize?: number;
  /** False on a "latest few" card: it shows pageSize rows with no page controls. */
  pagination?: boolean;
  empty?: {
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
  };
  className?: string;
}) {
  const router = useRouter();

  const columns: DataTableColumn<TransactionResponse>[] = [
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      sortValue: (row) => row.createdAt,
      className: "min-w-40",
      cell: (row) => (
        <span className="text-body-sm text-muted-foreground">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "counterparty",
      header: "To / From",
      className: "min-w-56",
      cell: (row) => {
        const sent = directionFor(row, accountNumber) === "debit";
        const Icon = sent ? ArrowUpRight : ArrowDownLeft;
        return (
          <span className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-subtle text-muted-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate font-mono text-body-sm text-foreground">
                {formatAccountNumber(counterpartyFor(row, accountNumber))}
              </span>
              <span className="truncate text-caption text-muted-foreground">
                {sent ? "Sent to" : "Received from"}
                {row.description ? ` · ${row.description}` : ""}
              </span>
            </span>
          </span>
        );
      },
    },
    {
      key: "referenceNumber",
      header: "Reference",
      className: "min-w-36",
      cell: (row) => (
        <span className="font-mono text-caption text-muted-foreground">
          {row.referenceNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "min-w-32",
      cell: (row) => <TransactionStatusBadge status={row.status} />,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      sortValue: (row) => Number(row.amount),
      className: "min-w-32",
      cell: (row) => (
        <Amount
          value={row.amount}
          direction={amountDirectionFor(row, accountNumber)}
          size="sm"
        />
      ),
    },
  ];

  return (
    <DataTable
      className={className}
      label="Transactions"
      columns={columns}
      data={transactions}
      getRowKey={(row) => row.id}
      loading={loading}
      pageSize={pageSize}
      pagination={pagination}
      onRowClick={(row) => router.push(`/app/transactions/${row.id}`)}
      empty={{
        Icon: ReceiptText,
        title: empty?.title ?? "No transactions yet",
        description:
          empty?.description ??
          "Transfers in and out of this account will appear here.",
        action: empty?.action,
      }}
    />
  );
}
