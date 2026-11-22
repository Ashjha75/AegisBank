"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  CircleHelp,
  Plus,
  RotateCcw,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { BANKING_NAV } from "@/components/app-shell/nav";
import { StatusPage } from "@/components/feedback/status-page";
import {
  STATUS_PRESETS,
  type StatusCode,
} from "@/components/feedback/status-presets";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Amount } from "@/components/ui/amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { StatCard } from "@/components/ui/stat-card";
import { TransactionStatusBadge } from "@/components/ui/transaction-status";
import { cn } from "@/lib/cn";
import { Preview } from "./frame";
import { SAMPLE_TRANSACTIONS } from "./sample-data";

/** The reusable AppShell with the banking menu and an example overview page, in a fixed frame. */
export function GalleryAppShell() {
  return (
    <Preview
      title="App shell"
      description="AppShell with nav={BANKING_NAV}. Below 1024px the sidebar becomes a drawer (menu button)."
      padded={false}
      className="h-[42rem] overflow-auto"
    >
      <AppShell
        nav={BANKING_NAV}
        active="/app"
        user={{ name: "Ashish Jha", email: "you@example.com" }}
        title="Overview"
        description="Saturday, 21 November"
        topbarActions={
          <>
            <Button variant="ghost" size="icon-sm" aria-label="Help">
              <CircleHelp aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Notifications, 2 unread"
              className="relative"
            >
              <Bell aria-hidden="true" />
              <span
                className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand"
                aria-hidden="true"
              />
            </Button>
          </>
        }
        userMenu={
          <>
            <DropdownMenuItem>
              <User aria-hidden="true" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ShieldCheck aria-hidden="true" /> Security
            </DropdownMenuItem>
          </>
        }
        sidebarFooter={
          <div className="grid gap-1.5 rounded-md border border-border bg-surface p-3">
            <span className="flex items-center gap-2 font-medium text-label">
              <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
              Transfers protected
            </span>
            <span className="text-caption text-muted-foreground">
              OTP for transfers of ₹50,000 or more.
            </span>
          </div>
        }
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Plus aria-hidden="true" /> Add money
            </Button>
            <Button size="sm">
              <ArrowLeftRight aria-hidden="true" /> Transfer
            </Button>
          </>
        }
        className="min-h-full [&_aside>div]:h-[42rem]"
      >
        <Stagger className="grid gap-4 md:grid-cols-3">
          <StaggerItem>
            <StatCard
              label="Savings •••• 4821"
              value={<Amount value="124500.00" size="xl" />}
              hint="Available balance"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Money in · November"
              Icon={ArrowDownLeft}
              value={<Amount value="144762.37" size="xl" direction="credit" />}
              trend={{ text: "4 payments", tone: "neutral" }}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Money out · November"
              Icon={ArrowUpRight}
              value={<Amount value="38240.50" size="xl" />}
              action={<Badge tone="warning">1 needs OTP</Badge>}
              trend={{ text: "6 payments", tone: "neutral" }}
            />
          </StaggerItem>
        </Stagger>
        <DataTable
          className="mt-4"
          label="Recent activity"
          pageSize={5}
          pageSizeOptions={[5, 10]}
          data={SAMPLE_TRANSACTIONS.slice(0, 15)}
          getRowKey={(t) => t.id}
          columns={[
            {
              key: "counterparty",
              header: "Recent activity",
              cell: (t) => (
                <div className="grid gap-0.5">
                  <span className="font-medium">{t.counterparty}</span>
                  <span className="text-caption text-muted-foreground">
                    {t.reference}
                  </span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (t) => <TransactionStatusBadge status={t.status} />,
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              cell: (t) => (
                <Amount
                  value={t.amount}
                  direction={t.status === "COMPLETED" ? t.direction : "pending"}
                />
              ),
            },
          ]}
        />
      </AppShell>
    </Preview>
  );
}

const CODES = Object.keys(STATUS_PRESETS) as StatusCode[];

/** Every full-page status (400-503) with the same component the real routes use. */
export function GalleryStatusPages() {
  const [code, setCode] = useState<StatusCode>("404");
  return (
    <Preview
      title="Error and status pages"
      description="404 and 500 are wired to Next.js (not-found.tsx, error.tsx). The others are ready for when the API returns them."
      padded={false}
    >
      <div
        role="tablist"
        aria-label="Status code"
        className="flex flex-wrap gap-1 border-border border-b bg-surface-subtle p-2"
      >
        {CODES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={c === code}
            onClick={() => setCode(c)}
            className={cn(
              "cursor-pointer rounded-sm px-2.5 py-1 font-mono text-caption transition-colors duration-fast",
              c === code
                ? "bg-surface text-foreground shadow-xs ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <StatusPage
        embedded
        status={code}
        actions={
          code === "401" ? (
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          ) : code.startsWith("5") || code === "429" ? (
            <>
              <Button>
                <RotateCcw aria-hidden="true" /> Try again
              </Button>
              <Button variant="secondary">Back to home</Button>
            </>
          ) : (
            <Button>Back to home</Button>
          )
        }
        footnote={code.startsWith("5") ? "Reference 9f2c41ab" : undefined}
      />
    </Preview>
  );
}
