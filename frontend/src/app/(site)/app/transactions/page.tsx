"use client";

import { ArrowLeftRight, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AccountGate } from "@/components/banking/account-gate";
import { ApiErrorState } from "@/components/banking/api-error-state";
import { BankingShell } from "@/components/banking/banking-shell";
import { TransactionTable } from "@/components/banking/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { Input, InputGroup } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactionHistory } from "@/lib/api/banking";
import {
  TRANSACTION_STATUSES,
  type TransactionResponse,
  type TransactionStatus,
} from "@/lib/api/types";
import { directionFor } from "@/lib/transactions";

export default function TransactionsPage() {
  return (
    <BankingShell
      title="Transactions"
      description="Everything in and out of this account, newest first."
      actions={
        <Button asChild>
          <Link href="/app/transfers">
            <ArrowLeftRight aria-hidden="true" />
            Transfer money
          </Link>
        </Button>
      }
    >
      <AccountGate>
        {(accountNumber) => <History accountNumber={accountNumber} />}
      </AccountGate>
    </BankingShell>
  );
}

type DirectionFilter = "all" | "credit" | "debit";

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  PENDING_VERIFICATION: "Needs OTP",
  COMPLETED: "Completed",
  FAILED: "Failed",
  FLAGGED: "Flagged",
};

/**
 * Filtering happens here, not in the table: the history endpoint returns the whole list for an
 * account, so narrowing it is a plain array filter and the table only ever renders what it is
 * given (see DataTable's note on filters living outside the table).
 */
function History({ accountNumber }: { accountNumber: string }) {
  const history = useTransactionHistory(accountNumber);
  const [search, setSearch] = React.useState("");
  const [direction, setDirection] = React.useState<DirectionFilter>("all");
  const [status, setStatus] = React.useState<TransactionStatus | "all">("all");

  const all = React.useMemo(() => history.data ?? [], [history.data]);

  const counts = React.useMemo(
    () => ({
      all: all.length,
      credit: all.filter((t) => directionFor(t, accountNumber) === "credit")
        .length,
      debit: all.filter((t) => directionFor(t, accountNumber) === "debit")
        .length,
    }),
    [all, accountNumber],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().replace(/\s/g, "").toLowerCase();
    return all.filter((transaction) => {
      if (
        direction !== "all" &&
        directionFor(transaction, accountNumber) !== direction
      )
        return false;
      if (status !== "all" && transaction.status !== status) return false;
      if (!needle) return true;
      return matches(transaction, needle);
    });
  }, [all, accountNumber, direction, status, search]);

  if (history.isError) {
    return (
      <ApiErrorState error={history.error} onRetry={() => history.refetch()} />
    );
  }

  const narrowed = direction !== "all" || status !== "all" || search !== "";

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <InputGroup
            start={<Search aria-hidden="true" />}
            className="max-w-xs"
          >
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Account number, reference or note"
              aria-label="Search transactions"
              className="h-8"
            />
          </InputGroup>

          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              pressed={direction === "all"}
              onPressedChange={() => setDirection("all")}
              count={counts.all}
            >
              All
            </FilterChip>
            <FilterChip
              pressed={direction === "credit"}
              onPressedChange={() => setDirection("credit")}
              count={counts.credit}
            >
              Received
            </FilterChip>
            <FilterChip
              pressed={direction === "debit"}
              onPressedChange={() => setDirection("debit")}
              count={counts.debit}
            >
              Sent
            </FilterChip>
          </div>

          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as TransactionStatus | "all")
            }
          >
            <SelectTrigger className="h-8 w-44" aria-label="Filter by status">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {TRANSACTION_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {narrowed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setDirection("all");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <TransactionTable
        accountNumber={accountNumber}
        transactions={filtered}
        loading={history.isPending}
        pageSize={25}
        empty={
          narrowed
            ? {
                title: "No transactions match these filters",
                description: "Try a different status, or clear the filters.",
              }
            : {
                title: "No transactions yet",
                description:
                  "Transfers in and out of this account will appear here.",
                action: (
                  <Button asChild size="sm">
                    <Link href="/app/transfers">Transfer money</Link>
                  </Button>
                ),
              }
        }
      />
    </div>
  );
}

function matches(transaction: TransactionResponse, needle: string): boolean {
  const haystack = [
    transaction.senderAccountNumber,
    transaction.receiverAccountNumber,
    transaction.referenceNumber ?? "",
    transaction.description ?? "",
  ];
  return haystack.some((value) =>
    value.replace(/\s/g, "").toLowerCase().includes(needle),
  );
}
