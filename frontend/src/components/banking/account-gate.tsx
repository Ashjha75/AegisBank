"use client";

import { Plus, Wallet } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { useKnownAccounts } from "@/lib/accounts/accounts-store";
import { AddAccountDialog } from "./add-account-dialog";

/**
 * Every screen under /app is about one account. This renders the screen only once there is one,
 * and otherwise explains how to get started - so no page has to handle "no account" itself.
 *
 *   <AccountGate>{(accountNumber) => <Dashboard accountNumber={accountNumber} />}</AccountGate>
 *
 * While localStorage is still being read it shows a loader, never the empty state: an account
 * that is already saved must not flash "no accounts yet" on every page load.
 */
export function AccountGate({
  children,
}: {
  children: (accountNumber: string) => React.ReactNode;
}) {
  const { active, ready } = useKnownAccounts();
  const [addOpen, setAddOpen] = React.useState(false);

  if (!ready) return <PageLoader label="Loading your account" />;
  if (active) return <>{children(active)}</>;

  return (
    <>
      <EmptyState
        Icon={Wallet}
        title="No account on this device yet"
        description="Open a new AegisBank account, or add one you already have. Accounts are remembered in this browser."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/app/accounts/open">
                <Plus aria-hidden="true" />
                Open an account
              </Link>
            </Button>
            <Button variant="secondary" onClick={() => setAddOpen(true)}>
              Add an existing account
            </Button>
          </div>
        }
      />
      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
