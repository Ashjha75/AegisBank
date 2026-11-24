"use client";

import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Copy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type * as React from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import { AccountGate } from "@/components/banking/account-gate";
import { ApiErrorState } from "@/components/banking/api-error-state";
import { BankingShell } from "@/components/banking/banking-shell";
import { OtpPanel } from "@/components/banking/otp-panel";
import { Alert } from "@/components/ui/alert";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { TransactionStatusBadge } from "@/components/ui/transaction-status";
import { useTransaction } from "@/lib/api/banking";
import type { TransactionResponse } from "@/lib/api/types";
import { formatAccountNumber, formatDateTime } from "@/lib/format";
import {
  amountDirectionFor,
  directionFor,
  isSettling,
  needsOtp,
  statusExplanationFor,
} from "@/lib/transactions";

/**
 * With `cacheComponents`, the id in the URL only exists at request time, so everything that
 * reads it has to sit inside <Suspense> - the shell around it is prerendered, the transaction
 * streams in (see AGENTS.md > Next.js 16).
 */
export default function TransactionDetailPage() {
  return (
    <BankingShell>
      <Suspense fallback={<PageLoader label="Loading the transaction" />}>
        <TransactionRoute />
      </Suspense>
    </BankingShell>
  );
}

function TransactionRoute() {
  const params = useParams<{ transactionId: string }>();
  const transactionId = params?.transactionId ?? null;

  return (
    <AccountGate>
      {(accountNumber) => (
        <Detail transactionId={transactionId} accountNumber={accountNumber} />
      )}
    </AccountGate>
  );
}

function Detail({
  transactionId,
  accountNumber,
}: {
  transactionId: string | null;
  accountNumber: string;
}) {
  const query = useTransaction(transactionId);

  if (query.isPending) return <PageLoader label="Loading the transaction" />;
  if (query.isError) {
    return (
      <ApiErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        notFoundMessage="We couldn't find this transaction. It may belong to another account."
      />
    );
  }

  const transaction = query.data as TransactionResponse;
  const sent = directionFor(transaction, accountNumber) === "debit";
  const Icon = sent ? ArrowUpRight : ArrowDownLeft;

  return (
    <div className="grid max-w-3xl gap-6">
      <Button asChild variant="link" size="sm" className="w-fit">
        <Link href="/app/transactions">
          <ArrowLeft aria-hidden="true" />
          All transactions
        </Link>
      </Button>

      <Card>
        <CardContent className="grid gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md border border-border bg-surface-subtle text-muted-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="grid gap-0.5">
                <span className="text-body-sm text-muted-foreground">
                  {sent ? "Sent to" : "Received from"}
                </span>
                <span className="font-mono text-h4 text-foreground">
                  {formatAccountNumber(
                    sent
                      ? transaction.receiverAccountNumber
                      : transaction.senderAccountNumber,
                  )}
                </span>
              </span>
            </div>
            <div className="grid justify-items-end gap-2">
              <Amount
                value={transaction.amount}
                direction={amountDirectionFor(transaction, accountNumber)}
                size="xl"
              />
              <TransactionStatusBadge status={transaction.status} />
            </div>
          </div>

          <Alert
            tone={
              transaction.status === "COMPLETED"
                ? "success"
                : transaction.status === "FAILED" ||
                    transaction.status === "FLAGGED"
                  ? "danger"
                  : "info"
            }
            title="What happened"
          >
            {statusExplanationFor(transaction, accountNumber)}
          </Alert>

          {isSettling(transaction) && (
            <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
              <Spinner size="sm" label="" />
              Still being checked. This page updates by itself.
            </p>
          )}
        </CardContent>
      </Card>

      {needsOtp(transaction) && sent && <OtpPanel transaction={transaction} />}

      {needsOtp(transaction) && !sent && (
        <Alert tone="info" title="Waiting for the sender">
          This transfer is held until the sender confirms it with a one-time
          code. Nothing has been credited here yet.
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid divide-y divide-border">
            <Row label="From">
              <Mono value={transaction.senderAccountNumber} />
            </Row>
            <Row label="To">
              <Mono value={transaction.receiverAccountNumber} />
            </Row>
            <Row label="Amount">
              <Amount value={transaction.amount} size="sm" />
            </Row>
            <Row label="Type">{titleCase(transaction.type)}</Row>
            {transaction.description && (
              <Row label="Note">{transaction.description}</Row>
            )}
            <Row label="Reference">
              {transaction.referenceNumber ? (
                <CopyableReference value={transaction.referenceNumber} />
              ) : (
                "—"
              )}
            </Row>
            <Row label="Started">{formatDateTime(transaction.createdAt)}</Row>
            <Row label="Finished">
              {transaction.completedAt
                ? formatDateTime(transaction.completedAt)
                : "Not finished yet"}
            </Row>
            {transaction.failureReason && (
              <Row label="Reason given">
                <span className="text-danger-foreground">
                  {transaction.failureReason}
                </span>
              </Row>
            )}
            <Row label="Transaction ID">
              <Mono value={transaction.id} plain />
            </Row>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 py-2.5 text-body-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

function Mono({ value, plain = false }: { value: string; plain?: boolean }) {
  return (
    <span className="font-mono text-body-sm">
      {plain ? value : formatAccountNumber(value)}
    </span>
  );
}

function CopyableReference({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-body-sm">{value}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-6"
        aria-label="Copy reference number"
        onClick={() => {
          navigator.clipboard
            .writeText(value)
            .then(() => toast.success("Reference copied"))
            .catch(() => toast.error("Could not copy the reference"));
        }}
      >
        <Copy aria-hidden="true" />
      </Button>
    </span>
  );
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}
