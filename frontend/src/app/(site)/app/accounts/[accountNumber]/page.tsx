"use client";

import { ArrowLeft, ArrowLeftRight, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type * as React from "react";
import { Suspense } from "react";
import { ApiErrorState } from "@/components/banking/api-error-state";
import { BankingShell } from "@/components/banking/banking-shell";
import { TransactionTable } from "@/components/banking/transaction-table";
import { Amount } from "@/components/ui/amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { useAccount, useTransactionHistory } from "@/lib/api/banking";
import { accountStatusBadge, accountTypeLabel } from "@/lib/api/types";
import { formatAccountNumber, formatDateTime } from "@/lib/format";

const RECENT_COUNT = 10;

/**
 * One account in full. Reachable for any account on this device, not only the active one, so
 * the switcher is not needed just to look something up.
 *
 * With `cacheComponents`, the account number in the URL only exists at request time, so the
 * part that reads it sits inside <Suspense> (see AGENTS.md > Next.js 16).
 */
export default function AccountDetailPage() {
  return (
    <BankingShell>
      <Suspense fallback={<PageLoader label="Loading the account" />}>
        <AccountRoute />
      </Suspense>
    </BankingShell>
  );
}

function AccountRoute() {
  const params = useParams<{ accountNumber: string }>();
  return <Detail accountNumber={params?.accountNumber ?? ""} />;
}

function Detail({ accountNumber }: { accountNumber: string }) {
  const account = useAccount(accountNumber);
  const history = useTransactionHistory(accountNumber);

  if (account.isPending) return <PageLoader label="Loading the account" />;
  if (account.isError) {
    return (
      <ApiErrorState
        error={account.error}
        onRetry={() => account.refetch()}
        notFoundMessage={`We couldn't find account ${formatAccountNumber(accountNumber)}.`}
      />
    );
  }

  const data = account.data;
  const status = accountStatusBadge(data.accountStatus);

  return (
    <div className="grid gap-6">
      <Button asChild variant="link" size="sm" className="w-fit">
        <Link href="/app/accounts">
          <ArrowLeft aria-hidden="true" />
          All accounts
        </Link>
      </Button>

      <Card>
        <CardContent className="grid gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-1.5">
              <span className="text-body-sm text-muted-foreground">
                {accountTypeLabel(data.accountType)} account
              </span>
              <span className="font-mono text-h3 text-foreground">
                {formatAccountNumber(data.accountNumber)}
              </span>
              <span className="text-body-sm text-foreground">
                {data.accountHolderName}
              </span>
            </div>
            <div className="grid justify-items-end gap-2">
              <Amount value={data.balance} size="xl" />
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-border border-t pt-4">
            <Button asChild>
              <Link href="/app/transfers">
                <ArrowLeftRight aria-hidden="true" />
                Transfer money
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/app/add-money">
                <Plus aria-hidden="true" />
                Add money
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid divide-y divide-border">
              <Row label="Holder">{data.accountHolderName}</Row>
              <Row label="Type">{accountTypeLabel(data.accountType)}</Row>
              <Row label="Status">
                <Badge tone={status.tone}>{status.label}</Badge>
              </Row>
              <Row label="Opened">{formatDateTime(data.createdAt)}</Row>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limits and contact</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid divide-y divide-border">
              <Row label="Balance">
                <Amount value={data.balance} size="sm" />
              </Row>
              <Row label="Minimum balance">
                <Amount value={data.minimumBalance} size="sm" />
              </Row>
              <Row label="Daily transfer limit">
                <Amount value={data.dailyTransactionLimit} size="sm" />
              </Row>
              <Row label="Email">
                <span className="break-all">{data.email}</span>
              </Row>
              <Row label="Phone">{data.phone}</Row>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription>
            The last {RECENT_COUNT} transfers for this account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.isError ? (
            <ApiErrorState
              error={history.error}
              onRetry={() => history.refetch()}
            />
          ) : (
            <TransactionTable
              accountNumber={accountNumber}
              transactions={(history.data ?? []).slice(0, RECENT_COUNT)}
              loading={history.isPending}
              pageSize={RECENT_COUNT}
              pagination={false}
            />
          )}
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
