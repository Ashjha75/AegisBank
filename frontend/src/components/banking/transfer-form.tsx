"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Send } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Amount } from "@/components/ui/amount";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input, InputGroup } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { TransactionStatusBadge } from "@/components/ui/transaction-status";
import { useAccount, useTransaction, useTransfer } from "@/lib/api/banking";
import { isApiError } from "@/lib/api/problem";
import type { TransactionResponse } from "@/lib/api/types";
import { formatAccountNumber } from "@/lib/format";
import { isSettling, needsOtp, statusExplanationFor } from "@/lib/transactions";
import {
  accountNumberField,
  amountField,
  descriptionField,
  normalizeAccountNumber,
  normalizeAmount,
} from "@/lib/validation";
import { ApiErrorState } from "./api-error-state";
import { OtpPanel } from "./otp-panel";

/**
 * Sending money. The form mirrors transaction-service's TransferRequest, including its
 * @AssertTrue that the two accounts differ, so a mistake is caught before the request leaves.
 *
 * A transfer is a SAGA, not a single call: the POST answers as soon as the sender has been
 * debited and the fraud check has been published, with status PROCESSING. The receiver is
 * credited (COMPLETED), the transfer is held for a code (PENDING_VERIFICATION) or refunded
 * (FLAGGED / FAILED) a moment later, over Kafka - so the result panel keeps polling until the
 * status stops moving instead of claiming success straight away.
 */
export function TransferForm({ accountNumber }: { accountNumber: string }) {
  const [sentId, setSentId] = React.useState<string | null>(null);

  if (sentId) {
    return (
      <TransferResult
        transactionId={sentId}
        accountNumber={accountNumber}
        onSendAnother={() => setSentId(null)}
      />
    );
  }
  return <TransferFields accountNumber={accountNumber} onSent={setSentId} />;
}

// The sender is not a form field, so "sender must differ from receiver" (the backend's
// @AssertTrue isDifferentAccounts) is checked in the submit handler, where it is known.
const schema = z.object({
  receiverAccountNumber: accountNumberField,
  amount: amountField,
  description: descriptionField,
});

type Values = z.infer<typeof schema>;

function TransferFields({
  accountNumber,
  onSent,
}: {
  accountNumber: string;
  onSent: (transactionId: string) => void;
}) {
  const account = useAccount(accountNumber);
  const transfer = useTransfer();
  const [confirming, setConfirming] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<unknown>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { receiverAccountNumber: "", amount: "", description: "" },
  });

  const blocked = account.data?.accountStatus !== "ACTIVE" && !!account.data;

  /** Validate first, then ask for confirmation - never show a confirm dialog over a bad form. */
  const review = handleSubmit((values) => {
    if (
      normalizeAccountNumber(values.receiverAccountNumber) === accountNumber
    ) {
      setError("receiverAccountNumber", {
        message: "This is the account you are sending from.",
      });
      return;
    }
    setSubmitError(null);
    setConfirming(true);
  });

  const send = async () => {
    const values = getValues();
    try {
      const transaction = await transfer.mutateAsync({
        senderAccountNumber: accountNumber,
        receiverAccountNumber: normalizeAccountNumber(
          values.receiverAccountNumber,
        ),
        amount: normalizeAmount(values.amount),
        description: values.description?.trim() || undefined,
      });
      setConfirming(false);
      onSent(transaction.id);
    } catch (caught) {
      setConfirming(false);
      setSubmitError(caught);
      // Field-level messages from the backend's VALIDATION_FAILED body.
      if (isApiError(caught)) {
        for (const [field, message] of Object.entries(caught.fieldErrors)) {
          if (field in getValues()) {
            setError(field as keyof Values, { message });
          }
        }
      }
      throw caught; // keeps ConfirmDialog from reporting success
    }
  };

  const values = getValues();

  return (
    <div className="grid gap-6">
      {blocked && (
        <Alert tone="danger" title="This account cannot send money">
          Its status is {account.data?.accountStatus.toLowerCase()}. Transfers
          are only possible from an active account.
        </Alert>
      )}

      {submitError !== null && <ApiErrorState error={submitError} />}

      <Card>
        <CardHeader>
          <CardTitle>Send money</CardTitle>
          <CardDescription>
            Transfers between AegisBank accounts arrive in seconds, after the
            fraud check.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={review} className="grid max-w-xl gap-5" noValidate>
            <Field label="From">
              <Input
                value={formatAccountNumber(accountNumber)}
                readOnly
                aria-readonly="true"
                className="font-mono text-muted-foreground"
              />
            </Field>

            <Field
              label="To account number"
              hint="The receiver's 12-digit AegisBank account number"
              error={errors.receiverAccountNumber?.message}
            >
              <Input
                inputMode="numeric"
                autoComplete="off"
                placeholder="279012587051"
                maxLength={17}
                className="font-mono"
                {...register("receiverAccountNumber")}
              />
            </Field>

            <Field
              label="Amount"
              hint="Transfers of ₹50,000 or more ask for a one-time code."
              error={errors.amount?.message}
            >
              <InputGroup start="₹" end="INR">
                <Input
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="1500.00"
                  {...register("amount")}
                />
              </InputGroup>
            </Field>

            <Field
              label="Note"
              labelSuffix="Optional"
              hint="Shown on both statements."
              error={errors.description?.message}
            >
              <Textarea
                rows={2}
                maxLength={255}
                placeholder="Rent for November"
                {...register("description")}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={blocked}>
                <Send aria-hidden="true" />
                Review transfer
              </Button>
              {account.data && (
                <span className="text-body-sm text-muted-foreground">
                  Balance <Amount value={account.data.balance} size="sm" />
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        tone="brand"
        title="Send this transfer?"
        description="Check the account number. A transfer to the wrong account cannot be undone from here."
        confirmLabel="Send money"
        onConfirm={send}
      >
        <dl className="grid gap-2 rounded-md border border-border bg-surface-subtle px-4 py-3 text-body-sm">
          <Row label="Amount">
            {values.amount ? (
              <Amount value={normalizeAmount(values.amount)} />
            ) : null}
          </Row>
          <Row label="To">
            <span className="font-mono">
              {formatAccountNumber(
                normalizeAccountNumber(values.receiverAccountNumber ?? ""),
              )}
            </span>
          </Row>
          <Row label="From">
            <span className="font-mono">
              {formatAccountNumber(accountNumber)}
            </span>
          </Row>
          {values.description?.trim() && (
            <Row label="Note">{values.description.trim()}</Row>
          )}
        </dl>
      </ConfirmDialog>
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
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

/** What happened to the transfer we just sent - kept on screen until it stops moving. */
function TransferResult({
  transactionId,
  accountNumber,
  onSendAnother,
}: {
  transactionId: string;
  accountNumber: string;
  onSendAnother: () => void;
}) {
  const query = useTransaction(transactionId);

  if (query.isPending) return <Spinner label="Checking the transfer" />;
  if (query.isError) {
    return (
      <ApiErrorState error={query.error} onRetry={() => query.refetch()} />
    );
  }

  const transaction = query.data as TransactionResponse;
  const settling = isSettling(transaction);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>
              {settling ? "Transfer sent for checking" : "Transfer result"}
            </CardTitle>
            <CardDescription>
              {statusExplanationFor(transaction, accountNumber)}
            </CardDescription>
          </div>
          <TransactionStatusBadge status={transaction.status} />
        </CardHeader>
        <CardContent className="grid gap-5">
          <dl className="grid gap-2 rounded-md border border-border bg-surface-subtle px-4 py-3 text-body-sm">
            <Row label="Amount">
              <Amount value={transaction.amount} />
            </Row>
            <Row label="To">
              <span className="font-mono">
                {formatAccountNumber(transaction.receiverAccountNumber)}
              </span>
            </Row>
            {transaction.referenceNumber && (
              <Row label="Reference">
                <span className="font-mono">{transaction.referenceNumber}</span>
              </Row>
            )}
          </dl>

          {settling && (
            <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
              <Spinner size="sm" label="" />
              Waiting for the fraud check to finish. This page updates by
              itself.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onSendAnother}>
              Send another transfer
            </Button>
            <Button asChild variant="link">
              <Link href={`/app/transactions/${transaction.id}`}>
                See the full transaction
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {needsOtp(transaction) && <OtpPanel transaction={transaction} />}
    </div>
  );
}
