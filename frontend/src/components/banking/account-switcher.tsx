"use client";

import { Check, ChevronsUpDown, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useKnownAccounts } from "@/lib/accounts/accounts-store";
import { useAccount } from "@/lib/api/banking";
import { formatAccountNumber, maskAccountNumber } from "@/lib/format";
import { AddAccountDialog } from "./add-account-dialog";

/**
 * Picks the account every screen is about. Without authentication this is the closest thing the
 * app has to "who is signed in", so it sits in the top bar on every page.
 */
export function AccountSwitcher() {
  const { accounts, active, select, ready } = useKnownAccounts();
  const [addOpen, setAddOpen] = React.useState(false);
  const account = useAccount(active);

  if (!ready) return <Skeleton className="h-8 w-44" />;

  if (!active) {
    return (
      <>
        <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" />
          Add account
        </Button>
        <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
      </>
    );
  }

  const name = account.data?.accountHolderName;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="max-w-56 justify-between gap-2"
          >
            <Wallet aria-hidden="true" className="text-brand" />
            <span className="truncate">
              {name ?? maskAccountNumber(active)}
            </span>
            <ChevronsUpDown aria-hidden="true" className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Accounts on this device</DropdownMenuLabel>
          {accounts.map((accountNumber) => (
            <DropdownMenuItem
              key={accountNumber}
              onSelect={() => select(accountNumber)}
              className="gap-2"
            >
              <span className="flex-1 font-mono text-body-sm">
                {formatAccountNumber(accountNumber)}
              </span>
              {accountNumber === active && (
                <Check aria-hidden="true" className="size-4 text-brand" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setAddOpen(true)}>
            <Plus aria-hidden="true" />
            Add an existing account
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/accounts/open">
              <Wallet aria-hidden="true" />
              Open a new account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
