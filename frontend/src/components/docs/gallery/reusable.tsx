"use client";

import { Landmark, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Amount } from "@/components/ui/amount";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { StatCard } from "@/components/ui/stat-card";
import { Toaster } from "@/components/ui/toaster";
import { Preview, Row } from "./frame";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PAYEES = [
  {
    value: "priya",
    label: "Priya Sharma",
    description: "HDFC •••• 9012",
    group: "Recent",
  },
  {
    value: "rahul",
    label: "Rahul Verma",
    description: "ICICI •••• 3381",
    group: "Recent",
  },
  {
    value: "neha",
    label: "Neha Gupta",
    description: "SBI •••• 7720",
    group: "All payees",
  },
  {
    value: "arjun",
    label: "Arjun Mehta",
    description: "Axis •••• 1049",
    group: "All payees",
  },
  {
    value: "kavya",
    label: "Kavya Iyer",
    description: "Kotak •••• 5566",
    group: "All payees",
  },
  {
    value: "vikram",
    label: "Vikram Singh",
    description: "HDFC •••• 2210",
    group: "All payees",
  },
].map((p) => ({ ...p, icon: <Avatar name={p.label} size="sm" /> }));

export function GallerySearchableSelect() {
  const [payee, setPayee] = useState<string | null>("priya");
  const [banks, setBanks] = useState<string[]>([]);
  return (
    <Preview
      title="SearchableSelect"
      description="One component, two looks: a form field (single choice, grouped options with descriptions) and a toolbar filter (several choices)."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Pay to" hint="Type a name or the last 4 digits">
          <SearchableSelect
            variant="field"
            label="Payee"
            options={PAYEES}
            value={payee}
            onChange={setPayee}
          />
        </Field>
        <div className="grid content-start gap-1.5">
          <span className="font-medium text-label">Filter</span>
          <Row>
            <SearchableSelect
              label="Bank"
              multiple
              options={["HDFC", "ICICI", "SBI", "Axis", "Kotak"].map((b) => ({
                value: b,
                label: b,
                icon: <Landmark aria-hidden="true" />,
              }))}
              value={banks}
              onChange={setBanks}
            />
          </Row>
        </div>
      </div>
    </Preview>
  );
}

export function GalleryReusableBlocks() {
  return (
    <Preview
      title="ConfirmDialog, StatCard, PageHeader, Stagger"
      description="Ready-made blocks: the confirm button shows a spinner while onConfirm runs; StatCards reveal one after another."
    >
      <Toaster />
      <div className="grid gap-8">
        <PageHeader
          breadcrumb={[
            { label: "Accounts", href: "#" },
            { label: "Savings •••• 4821" },
          ]}
          title="Savings •••• 4821"
          description="Opened March 2024 · IFSC AEGB0000421"
          actions={
            <>
              <ConfirmDialog
                trigger={
                  <Button variant="secondary" size="sm">
                    <Trash2 aria-hidden="true" /> Close account
                  </Button>
                }
                tone="danger"
                title="Close this account?"
                description="The balance must be zero first. This can't be undone."
                confirmLabel="Close account"
                onConfirm={async () => {
                  await wait(900);
                  toast.success("Account closed (example)");
                }}
              />
              <ConfirmDialog
                trigger={<Button size="sm">Transfer</Button>}
                tone="brand"
                title="Send ₹25,000.00 to Priya?"
                description="Money leaves Savings •••• 4821 immediately."
                confirmLabel="Send ₹25,000.00"
                onConfirm={async () => {
                  await wait(1200);
                  toast.success("Transfer sent", {
                    description: "₹25,000.00 to Priya Sharma",
                  });
                }}
              >
                <div className="flex items-center justify-between rounded-md border border-border bg-surface-subtle p-4 text-body-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <Amount value="25000.00" />
                </div>
              </ConfirmDialog>
            </>
          }
        />
        <Stagger inView className="grid gap-4 sm:grid-cols-3">
          <StaggerItem>
            <StatCard
              label="Available"
              Icon={Wallet}
              value={<Amount value="124500.00" size="xl" />}
              hint="As of today, 14:05"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Money in this month"
              value={<Amount value="144762.37" size="xl" direction="credit" />}
              trend={{ text: "+12% vs October", tone: "positive" }}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard label="Loading" value={null} loading hint="Fetching" />
          </StaggerItem>
        </Stagger>
      </div>
    </Preview>
  );
}
