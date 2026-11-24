"use client";

import { ArrowRight, Check, Plus, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AddAccountDialog } from "@/components/banking/add-account-dialog";
import { BankingShell } from "@/components/banking/banking-shell";
import { Alert } from "@/components/ui/alert";
import { Amount } from "@/components/ui/amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/ui/spinner";
import { useKnownAccounts } from "@/lib/accounts/accounts-store";
import { useAccount } from "@/lib/api/banking";
import { accountStatusBadge, accountTypeLabel } from "@/lib/api/types";
import { formatAccountNumber } from "@/lib/format";

export default function AccountsPage() {
  const { accounts, active, ready } = useKnownAccounts();
  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <BankingShell
      title="Accounts"
      description="The accounts this browser knows about. Pick the one the app is about."
      actions={
        <>
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            Add existing
          </Button>
          <Button asChild>
            <Link href="/app/accounts/open">
              <Plus aria-hidden="true" />
              Open an account
            </Link>
          </Button>
        </>
      }
    >
      {!ready ? (
        <PageLoader label="Loading your accounts" />
      ) : accounts.length === 0 ? (
        <EmptyState
          Icon={Wallet}
          title="No account on this device yet"
          description="Open a new AegisBank account, or add one you already have."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/app/accounts/open">Open an account</Link>
              </Button>
              <Button variant="secondary" onClick={() => setAddOpen(true)}>
                Add an existing account
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4">
          <Alert tone="neutral" title="Stored in this browser only">
            Without sign-in, AegisBank remembers account numbers locally.
            Clearing site data removes them here - the accounts themselves stay
            open in the bank.
          </Alert>
          <div className="grid gap-4 lg:grid-cols-2">
            {accounts.map((accountNumber) => (
              <AccountCard
                key={accountNumber}
                accountNumber={accountNumber}
                isActive={accountNumber === active}
              />
            ))}
          </div>
        </div>
      )}

      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
    </BankingShell>
  );
}

function AccountCard({
  accountNumber,
  isActive,
}: {
  accountNumber: string;
  isActive: boolean;
}) {
  const { select, remove } = useKnownAccounts();
  const account = useAccount(accountNumber);
  const status = account.data && accountStatusBadge(account.data.accountStatus);

  return (
    <Card className={isActive ? "border-primary ring-1 ring-primary" : ""}>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <span className="font-mono text-body text-foreground">
              {formatAccountNumber(accountNumber)}
            </span>
            {account.isPending ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="text-body-sm text-muted-foreground">
                {account.data?.accountHolderName ?? "Could not load details"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* "Selected", not "Active": the badge next to it is the account's own status. */}
            {isActive && (
              <Badge tone="solid">
                <Check aria-hidden="true" />
                Selected
              </Badge>
            )}
            {status && <Badge tone={status.tone}>{status.label}</Badge>}
          </div>
        </div>

        {account.isError ? (
          <p className="text-body-sm text-danger-foreground">
            We couldn&apos;t load this account. It may have been closed, or the
            number is wrong.
          </p>
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid gap-0.5">
              <span className="text-caption text-muted-foreground">
                Balance
              </span>
              {account.isPending ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <Amount value={account.data?.balance ?? 0} />
              )}
            </div>
            {account.data && (
              <span className="text-caption text-muted-foreground">
                {accountTypeLabel(account.data.accountType)}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-border border-t pt-4">
          {!isActive && (
            <Button size="sm" onClick={() => select(accountNumber)}>
              Use this account
            </Button>
          )}
          <Button asChild size="sm" variant="secondary">
            <Link href={`/app/accounts/${accountNumber}`}>
              Details
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <ConfirmDialog
            tone="danger"
            title="Remove from this device?"
            description="The account stays open at the bank. You can add it again with its number."
            confirmLabel="Remove"
            onConfirm={() => remove(accountNumber)}
            trigger={
              <Button
                size="icon-sm"
                variant="ghost"
                className="ml-auto"
                aria-label={`Remove account ${accountNumber} from this device`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
