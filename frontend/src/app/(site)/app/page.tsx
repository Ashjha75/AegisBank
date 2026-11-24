"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  Gauge,
  Plus,
  ShieldAlert,
  ShieldQuestion,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { AccountGate } from "@/components/banking/account-gate";
import { ApiErrorState } from "@/components/banking/api-error-state";
import { BankingShell } from "@/components/banking/banking-shell";
import { TransactionTable } from "@/components/banking/transaction-table";
import { Alert } from "@/components/ui/alert";
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
import { StatCard } from "@/components/ui/stat-card";
import { useAccount, useTransactionHistory } from "@/lib/api/banking";
import { accountStatusBadge, accountTypeLabel } from "@/lib/api/types";
import { formatAccountNumber } from "@/lib/format";
import { needsOtp } from "@/lib/transactions";

const RECENT_COUNT = 5;

export default function OverviewPage() {
  return (
    <BankingShell
      title="Overview"
      description="Your balance, what needs attention, and the last few transactions."
      actions={
        <>
          <Button asChild variant="secondary">
            <Link href="/app/add-money">
              <Plus aria-hidden="true" />
              Add money
            </Link>
          </Button>
          <Button asChild>
            <Link href="/app/transfers">
              <ArrowLeftRight aria-hidden="true" />
              Transfer money
            </Link>
          </Button>
        </>
      }
    >
      <AccountGate>
        {(accountNumber) => <Overview accountNumber={accountNumber} />}
      </AccountGate>
    </BankingShell>
  );
}

function Overview({ accountNumber }: { accountNumber: string }) {
  const account = useAccount(accountNumber);
  const history = useTransactionHistory(accountNumber);

  if (account.isError) {
    return (
      <ApiErrorState
        error={account.error}
        onRetry={() => account.refetch()}
        notFoundMessage={`We couldn't find account ${formatAccountNumber(accountNumber)}. Remove it from this device or check the number.`}
      />
    );
  }

  const status = account.data && accountStatusBadge(account.data.accountStatus);
  const awaitingOtp = (history.data ?? []).filter(
    (transaction) =>
      needsOtp(transaction) &&
      transaction.senderAccountNumber === accountNumber,
  );
  const recent = (history.data ?? []).slice(0, RECENT_COUNT);

  return (
    <div className="grid gap-6">
      {account.data?.accountStatus === "BLOCKED" && (
        <Alert tone="danger" title="This account is blocked">
          A fraud check stopped this account, so it cannot send or receive
          money. Unblocking needs an administrator.
        </Alert>
      )}

      {awaitingOtp.map((transaction) => (
        <Alert
          key={transaction.id}
          tone="info"
          title="A transfer is waiting for your code"
          action={
            <Button asChild size="sm">
              <Link href={`/app/transactions/${transaction.id}`}>
                <ShieldQuestion aria-hidden="true" />
                Enter code
              </Link>
            </Button>
          }
        >
          <span className="flex flex-wrap items-center gap-1.5">
            <Amount value={transaction.amount} size="sm" />
            to{" "}
            <span className="font-mono">
              {formatAccountNumber(transaction.receiverAccountNumber)}
            </span>
            needs a one-time code before it can be released.
          </span>
        </Alert>
      ))}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Available balance"
          Icon={Wallet}
          loading={account.isPending}
          value={
            account.data ? (
              <Amount value={account.data.balance} size="xl" />
            ) : null
          }
          hint={
            account.data ? (
              <span className="flex items-center gap-1">
                Minimum balance
                <Amount value={account.data.minimumBalance} size="sm" />
              </span>
            ) : undefined
          }
        />
        <StatCard
          label="Account"
          Icon={Wallet}
          loading={account.isPending}
          value={
            account.data ? (
              <span className="grid gap-1.5">
                <span className="font-mono text-h4 text-foreground">
                  {formatAccountNumber(account.data.accountNumber)}
                </span>
                {status && (
                  <span className="flex items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <span className="text-caption text-muted-foreground">
                      {accountTypeLabel(account.data.accountType)}
                    </span>
                  </span>
                )}
              </span>
            ) : null
          }
          hint={account.data?.accountHolderName}
        />
        <StatCard
          label="Daily transfer limit"
          Icon={Gauge}
          loading={account.isPending}
          value={
            account.data ? (
              <Amount value={account.data.dailyTransactionLimit} size="xl" />
            ) : null
          }
          hint="Set when the account was opened"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>
              The last {RECENT_COUNT} transfers in and out of this account.
            </CardDescription>
          </div>
          <Button asChild variant="link" size="sm">
            <Link href="/app/transactions">
              See all
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
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
              transactions={recent}
              loading={history.isPending}
              pageSize={RECENT_COUNT}
              pagination={false}
              empty={{
                title: "No transactions yet",
                description:
                  "Add money to this account or send your first transfer.",
                action: (
                  <Button asChild size="sm">
                    <Link href="/app/transfers">Transfer money</Link>
                  </Button>
                ),
              }}
            />
          )}
        </CardContent>
      </Card>

      {account.data?.accountStatus === "ACTIVE" && (
        <Alert tone="neutral" title="How a transfer is checked">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="size-3.5" aria-hidden="true" />
            Every transfer is screened for fraud before the receiver is
            credited. Large or unusual ones pause for a one-time code, and a
            transfer that cannot complete is refunded automatically.
          </span>
        </Alert>
      )}
    </div>
  );
}
