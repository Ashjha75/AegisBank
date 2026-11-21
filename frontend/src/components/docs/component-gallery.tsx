"use client";

import { ArrowRight, MoreHorizontal, Send } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Amount } from "@/components/ui/amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { TransactionStatusBadge } from "@/components/ui/transaction-status";

/** Every base component in its real states, for the design-system docs page. */
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h4 className="font-semibold text-foreground text-sm">{title}</h4>
      <div className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-background p-5">
        {children}
      </div>
    </section>
  );
}

export function ComponentGallery() {
  return (
    <div className="not-prose my-6 grid gap-8 font-sans">
      <Toaster />
      <Panel title="Buttons">
        <Button>
          <Send aria-hidden="true" />
          Send money
        </Button>
        <Button variant="accent">Verify code</Button>
        <Button variant="secondary">Download statement</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="link">
          View details <ArrowRight aria-hidden="true" />
        </Button>
        <Button variant="danger">Close account</Button>
        <Button loading>Processing</Button>
        <Button size="sm" variant="secondary">
          Small
        </Button>
      </Panel>

      <Panel title="Status badges">
        <TransactionStatusBadge status="COMPLETED" />
        <TransactionStatusBadge status="PROCESSING" />
        <TransactionStatusBadge status="PENDING_VERIFICATION" />
        <TransactionStatusBadge status="FAILED" />
        <TransactionStatusBadge status="FLAGGED" />
        <Badge>Savings</Badge>
        <Badge tone="accent" dot>
          New
        </Badge>
      </Panel>

      <Panel title="Amounts">
        <div className="grid gap-2">
          <Amount value={125000} size="xl" />
          <div className="flex flex-wrap gap-5">
            <Amount value={2500} direction="credit" />
            <Amount value={600} direction="debit" />
            <Amount value={25000} direction="pending" />
            <Amount value={480} direction="failed" />
          </div>
        </div>
      </Panel>

      <Panel title="Form fields">
        <div className="grid w-full max-w-sm gap-4">
          <Field label="Receiver account number" hint="12 digits, no spaces">
            <Input inputMode="numeric" placeholder="1234 5678 9012" />
          </Field>
          <Field label="Amount" error="Your balance doesn't cover this amount.">
            <Input inputMode="decimal" defaultValue="250000" />
          </Field>
          <Field label="Description" labelSuffix="Optional">
            <Input placeholder="Rent for November" />
          </Field>
        </div>
      </Panel>

      <Panel title="Alerts">
        <div className="grid w-full gap-3">
          <Alert
            tone="info"
            title="Transfers over ₹50,000 need a one-time code"
          >
            We send it to your registered mobile number.
          </Alert>
          <Alert tone="success" title="Transfer completed">
            ₹25,000.00 was credited to Priya Sharma.
          </Alert>
          <Alert tone="warning" title="Waiting for verification">
            Enter the code within 5 minutes or the transfer is cancelled and
            refunded.
          </Alert>
          <Alert
            tone="danger"
            title="Not enough balance"
            footer="Reference: ERR-INSUFFICIENT_BALANCE"
          >
            Your balance doesn&apos;t cover this amount. Enter a smaller amount
            or add money first.
          </Alert>
        </div>
      </Panel>

      <Panel title="Table">
        <div className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="numeric text-muted-foreground">
                  21 Nov, 14:05
                </TableCell>
                <TableCell>Transfer to Priya Sharma</TableCell>
                <TableCell>
                  <TransactionStatusBadge status="COMPLETED" />
                </TableCell>
                <TableCell align="right">
                  <Amount value={25000} direction="debit" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="numeric text-muted-foreground">
                  20 Nov, 09:12
                </TableCell>
                <TableCell>Salary - Acme Ltd</TableCell>
                <TableCell>
                  <TransactionStatusBadge status="COMPLETED" />
                </TableCell>
                <TableCell align="right">
                  <Amount value={85000} direction="credit" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="numeric text-muted-foreground">
                  19 Nov, 18:40
                </TableCell>
                <TableCell>Transfer to Rahul Verma</TableCell>
                <TableCell>
                  <TransactionStatusBadge status="FAILED" />
                </TableCell>
                <TableCell align="right">
                  <Amount value={480} direction="failed" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Panel>

      <Panel title="Loading">
        <div className="grid w-full max-w-sm gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-full" />
        </div>
      </Panel>

      <Panel title="Overlays">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter your one-time code</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to the mobile number ending 3210.
              </DialogDescription>
            </DialogHeader>
            <Field label="Code">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
              />
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="accent">Verify and send</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" aria-label="More actions">
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem>Download statement</DropdownMenuItem>
            <DropdownMenuItem>Copy account number</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger">Block card</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip content="Copies the 12-digit number">
          <Button variant="ghost">Hover for tooltip</Button>
        </Tooltip>
        <Button
          variant="secondary"
          onClick={() =>
            toast.success("Transfer sent", {
              description: "₹600.00 to Priya Sharma",
            })
          }
        >
          Show toast
        </Button>
      </Panel>
    </div>
  );
}
