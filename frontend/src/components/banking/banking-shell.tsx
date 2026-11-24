"use client";

import { Plus, Wallet } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { BANKING_NAV } from "@/components/app-shell/nav";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useKnownAccounts } from "@/lib/accounts/accounts-store";
import { useAccount } from "@/lib/api/banking";
import { maskAccountNumber } from "@/lib/format";
import { AccountSwitcher } from "./account-switcher";

/**
 * The frame around every /app screen: sidebar, top bar and the account switcher.
 *
 * The menu itself is BANKING_NAV (components/app-shell/nav.ts), shared with the docs gallery.
 * There is no sign-out item because there is no sign-in: the active account comes from the
 * switcher, not from a session (see PENDING.md item 3 for the real thing).
 */
export function BankingShell({
  title,
  description,
  actions,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { active } = useKnownAccounts();
  const account = useAccount(active);

  const name =
    account.data?.accountHolderName ??
    (active ? maskAccountNumber(active) : "AegisBank");

  return (
    <AppShell
      nav={BANKING_NAV}
      user={{ name, email: account.data?.email }}
      search={false}
      topbarActions={<AccountSwitcher />}
      userMenu={
        <>
          <DropdownMenuItem asChild>
            <Link href="/app/accounts">
              <Wallet aria-hidden="true" />
              Your accounts
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/accounts/open">
              <Plus aria-hidden="true" />
              Open a new account
            </Link>
          </DropdownMenuItem>
        </>
      }
      sidebarFooter={<DemoNotice />}
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </AppShell>
  );
}

function DemoNotice() {
  return (
    <div className="grid gap-2 rounded-md border border-border bg-surface p-3">
      <Badge tone="brand" dot className="w-fit">
        Test mode
      </Badge>
      <p className="text-caption text-muted-foreground">
        A learning project. No real money is held or moved, and accounts are
        remembered in this browser only.
      </p>
    </div>
  );
}
