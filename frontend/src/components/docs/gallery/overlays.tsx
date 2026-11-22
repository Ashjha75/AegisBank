"use client";

import {
  Copy,
  Download,
  Flag,
  MoreHorizontal,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Amount } from "@/components/ui/amount";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingDots, PageLoader, Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import {
  type TransactionStatus,
  TransactionStatusBadge,
} from "@/components/ui/transaction-status";
import { Caption, Preview, Row } from "./frame";

export function GalleryOverlays() {
  const [columns, setColumns] = useState({ reference: true, status: true });
  return (
    <Preview
      title="Modals, drawers and menus"
      description="Dialog for short confirmations, Sheet (drawer) for details and longer forms, Dropdown for actions, Tooltip for hints."
    >
      <Toaster />
      <Row>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Send aria-hidden="true" /> Confirm transfer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send ₹25,000.00 to Priya?</DialogTitle>
              <DialogDescription>
                Money leaves Savings •••• 4821 immediately. Transfers can't be
                cancelled once completed.
              </DialogDescription>
            </DialogHeader>
            <dl className="grid gap-2 rounded-md border border-border bg-surface-subtle p-4 text-body-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">To</dt>
                <dd>Priya Sharma •••• 9012</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Amount</dt>
                <dd>
                  <Amount value="25000.00" />
                </dd>
              </div>
            </dl>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  variant="brand"
                  onClick={() =>
                    toast.success("Transfer sent", {
                      description: "₹25,000.00 to Priya Sharma",
                    })
                  }
                >
                  Send ₹25,000.00
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <ShieldCheck aria-hidden="true" /> Enter OTP
            </Button>
          </DialogTrigger>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Verify this transfer</DialogTitle>
              <DialogDescription>
                Transfers of ₹50,000 or more need the 6-digit code we sent to
                your phone.
              </DialogDescription>
            </DialogHeader>
            <Field label="One-time code" hint="Expires in 5 minutes">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                className="text-center font-mono text-h4 tracking-[0.5em]"
              />
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button className="w-full">Verify</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Transaction details</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Transfer to Priya Sharma</SheetTitle>
              <SheetDescription>
                <span className="font-mono">REF 7F3A-92C1</span>
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="grid content-start gap-6">
              <div className="grid gap-2">
                <TransactionStatusBadge status="COMPLETED" />
                <Amount value="25000.00" direction="debit" size="xl" />
              </div>
              <dl className="grid gap-3 text-body-sm">
                {[
                  ["From", "Savings •••• 4821"],
                  ["To", "Priya Sharma •••• 9012"],
                  ["Note", "Rent November"],
                  ["Date", "21 Nov 2026, 14:05"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 border-border border-b pb-3"
                  >
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </SheetBody>
            <SheetFooter>
              <Button variant="secondary">
                <Flag aria-hidden="true" /> Report a problem
              </Button>
              <Button>
                <Download aria-hidden="true" /> Receipt
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" aria-label="More actions">
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Payee</DropdownMenuLabel>
            <DropdownMenuItem shortcut="⌘E">
              <Pencil aria-hidden="true" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => toast("Account number copied")}
              shortcut="⌘C"
            >
              <Copy aria-hidden="true" /> Copy account number
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Columns</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={columns.reference}
              onCheckedChange={(v) =>
                setColumns((c) => ({ ...c, reference: v === true }))
              }
              onSelect={(e) => e.preventDefault()}
            >
              Reference
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.status}
              onCheckedChange={(v) =>
                setColumns((c) => ({ ...c, status: v === true }))
              }
              onSelect={(e) => e.preventDefault()}
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger">
              <Trash2 aria-hidden="true" /> Remove payee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip content="Available balance excludes pending debits">
          <Button variant="ghost">Hover me</Button>
        </Tooltip>
      </Row>
    </Preview>
  );
}

const STATUSES: TransactionStatus[] = [
  "PENDING",
  "PROCESSING",
  "PENDING_VERIFICATION",
  "COMPLETED",
  "FAILED",
  "FLAGGED",
];

export function GalleryFeedback() {
  const [visible, setVisible] = useState(true);
  return (
    <Preview
      title="Alerts, toasts and badges"
      description="Alerts stay in the page until resolved; toasts confirm and disappear. Colour always comes with words."
    >
      <Toaster />
      <div className="grid gap-6">
        <div className="grid gap-3">
          {visible && (
            <Alert
              tone="info"
              title="Scheduled maintenance"
              onDismiss={() => setVisible(false)}
            >
              Transfers may take longer on Sunday between 02:00 and 03:00.
            </Alert>
          )}
          <Alert tone="success" title="Payee added">
            Priya Sharma can receive transfers in 30 minutes.
          </Alert>
          <Alert
            tone="warning"
            title="Transfer needs your code"
            action={
              <Button size="xs" variant="secondary">
                Enter OTP
              </Button>
            }
          >
            ₹68,000.00 to Rahul Verma is waiting for verification.
          </Alert>
          <Alert
            tone="danger"
            title="Transfer failed"
            footer="Reference 3F07-C8A2"
          >
            The receiver's bank didn't respond. The debit was reversed - your
            balance is unchanged.
          </Alert>
        </div>
        <div className="grid gap-2.5">
          <Caption>Toasts</Caption>
          <Row>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast.success("Transfer sent", {
                  description: "₹25,000.00 to Priya Sharma",
                })
              }
            >
              Success
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast.error("Couldn't send the transfer", {
                  description: "Nothing was charged. Try again.",
                })
              }
            >
              Error
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.info("Statement is being prepared")}
            >
              Info
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast("Payee removed", {
                  action: { label: "Undo", onClick: () => {} },
                })
              }
            >
              With action
            </Button>
          </Row>
        </div>
        <div className="grid gap-2.5">
          <Caption>Badges and transaction status</Caption>
          <Row>
            <Badge>Neutral</Badge>
            <Badge tone="brand" dot>
              Brand
            </Badge>
            <Badge tone="info">Info</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="solid">New</Badge>
          </Row>
          <Row>
            {STATUSES.map((s) => (
              <TransactionStatusBadge key={s} status={s} />
            ))}
          </Row>
          <Row className="gap-6">
            <Amount value="142500.00" direction="credit" />
            <Amount value="25000.00" direction="debit" />
            <Amount value="68000.00" direction="pending" />
            <Amount value="12000.00" direction="failed" />
          </Row>
        </div>
      </div>
    </Preview>
  );
}

export function GalleryLoaders() {
  const [value, setValue] = useState(20);
  useEffect(() => {
    const id = setInterval(
      () => setValue((v) => (v >= 100 ? 10 : v + 15)),
      900,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <Preview
      title="Loaders"
      description="Skeletons when the layout is known, spinners for short actions, progress bars for long or multi-step work."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div className="grid content-start gap-5">
          <Caption>Spinners</Caption>
          <Row className="gap-5">
            <Spinner size="sm" />
            <Spinner />
            <Spinner size="lg" />
            <span className="text-body-sm text-muted-foreground">
              Verifying
              <LoadingDots />
            </span>
            <Button loading>Saving</Button>
          </Row>
          <Caption>Progress</Caption>
          <div className="grid gap-3">
            <Progress value={value} label="Upload progress" />
            <Progress label="Processing transfer" tone="brand" />
          </div>
        </div>
        <div className="grid content-start gap-5">
          <Caption>Skeleton</Caption>
          <div className="grid gap-3 rounded-md border border-border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-3/5" />
          </div>
          <div className="rounded-md border border-border">
            <PageLoader label="Loading your accounts" className="min-h-32" />
          </div>
        </div>
      </div>
    </Preview>
  );
}

export function GalleryNavigation() {
  return (
    <Preview
      title="Tabs, breadcrumbs and identity"
      description="Underline tabs for page sections, segmented tabs to switch views."
    >
      <div className="grid gap-7">
        <Breadcrumb
          items={[
            { label: "Accounts", href: "#" },
            { label: "Savings •••• 4821", href: "#" },
            { label: "Statement" },
          ]}
        />
        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="statements">Statements</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent
            value="activity"
            className="text-body-sm text-muted-foreground"
          >
            Recent transactions appear here.
          </TabsContent>
          <TabsContent
            value="statements"
            className="text-body-sm text-muted-foreground"
          >
            Monthly statements as PDF.
          </TabsContent>
          <TabsContent
            value="details"
            className="text-body-sm text-muted-foreground"
          >
            IFSC, branch and nominee.
          </TabsContent>
        </Tabs>
        <Tabs defaultValue="month">
          <TabsList variant="segmented">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
        <Row className="gap-5">
          <div className="flex items-center gap-2.5">
            <Avatar name="Priya Sharma" />
            <div className="grid">
              <span className="font-medium text-body-sm">Priya Sharma</span>
              <span className="text-caption text-muted-foreground">
                •••• 9012
              </span>
            </div>
          </div>
          <Avatar name="Rahul Verma" size="sm" />
          <Avatar name="Acme Payroll" size="lg" />
          <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
            Search <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </Row>
      </div>
    </Preview>
  );
}
