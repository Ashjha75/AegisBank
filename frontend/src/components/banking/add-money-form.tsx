"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, ExternalLink, RotateCw } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Field } from "@/components/ui/field";
import { Input, InputGroup } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAccount, useCreatePaymentOrder } from "@/lib/api/banking";
import type { PaymentOrderResponse } from "@/lib/api/types";
import { formatAccountNumber } from "@/lib/format";
import { loadRazorpayCheckout } from "@/lib/payments/razorpay";
import {
  amountField,
  descriptionField,
  normalizeAmount,
} from "@/lib/validation";
import { ApiErrorState } from "./api-error-state";

/**
 * Adding money through Razorpay.
 *
 * Two steps, and only the first one is ours: payment-service creates a Razorpay order
 * (`POST /v1/payments/create-order`) and hands back the order id plus the publishable key;
 * Razorpay Checkout then collects the money in its own dialog. Whether the payment succeeded
 * is decided by the signed webhook Razorpay sends to payment-service, never by this page -
 * so the UI reports "submitted", not "paid", and says where the confirmation comes from.
 */
const schema = z.object({
  amount: amountField,
  description: descriptionField,
});

type Values = z.infer<typeof schema>;

type Stage =
  | { name: "form" }
  | { name: "checkout"; order: PaymentOrderResponse }
  | { name: "submitted"; order: PaymentOrderResponse; paymentId: string }
  | { name: "cancelled"; order: PaymentOrderResponse }
  | { name: "failed"; order: PaymentOrderResponse; reason?: string };

export function AddMoneyForm({ accountNumber }: { accountNumber: string }) {
  const account = useAccount(accountNumber);
  const createOrder = useCreatePaymentOrder();
  const [stage, setStage] = React.useState<Stage>({ name: "form" });
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", description: "" },
  });

  const openCheckout = React.useCallback(
    async (order: PaymentOrderResponse) => {
      setCheckoutError(null);
      let Razorpay: Awaited<ReturnType<typeof loadRazorpayCheckout>>;
      try {
        Razorpay = await loadRazorpayCheckout();
      } catch {
        setCheckoutError(
          "We couldn't load the payment window. Check your connection and try again.",
        );
        return;
      }

      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        order_id: order.razorpayOrderId,
        currency: order.currency,
        name: "AegisBank",
        description: "Add money to your account",
        prefill: {
          name: account.data?.accountHolderName,
          email: account.data?.email,
          contact: account.data?.phone,
        },
        notes: { accountNumber },
        handler: (response) => {
          setStage({
            name: "submitted",
            order,
            paymentId: response.razorpay_payment_id,
          });
          toast.success("Payment submitted", {
            description: "Waiting for Razorpay to confirm it.",
          });
        },
        modal: {
          ondismiss: () =>
            setStage((current) =>
              current.name === "checkout"
                ? { name: "cancelled", order }
                : current,
            ),
        },
      });

      checkout.on("payment.failed", (response) => {
        setStage({
          name: "failed",
          order,
          reason: response.error?.description,
        });
      });

      setStage({ name: "checkout", order });
      checkout.open();
    },
    [account.data, accountNumber],
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      const order = await createOrder.mutateAsync({
        accountNumber,
        amount: normalizeAmount(values.amount),
        description: values.description?.trim() || undefined,
      });
      await openCheckout(order);
    } catch {
      // Shown by <ApiErrorState> from createOrder.error.
    }
  });

  const restart = () => {
    setStage({ name: "form" });
    setCheckoutError(null);
    createOrder.reset();
  };

  if (stage.name !== "form" && stage.name !== "checkout") {
    return (
      <PaymentOutcome
        stage={stage}
        onRestart={restart}
        onRetry={openCheckout}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {createOrder.isError && <ApiErrorState error={createOrder.error} />}
      {checkoutError && (
        <Alert tone="danger" title="Payment window didn't open">
          {checkoutError}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add money</CardTitle>
          <CardDescription>
            Pay into{" "}
            <span className="font-mono">
              {formatAccountNumber(accountNumber)}
            </span>{" "}
            with a card, UPI or netbanking through Razorpay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid max-w-xl gap-5" noValidate>
            <Field label="Amount" error={errors.amount?.message}>
              <InputGroup start="₹" end="INR">
                <Input
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="500.00"
                  {...register("amount")}
                />
              </InputGroup>
            </Field>

            <Field
              label="Note"
              labelSuffix="Optional"
              error={errors.description?.message}
            >
              <Textarea
                rows={2}
                maxLength={255}
                placeholder="Top-up"
                {...register("description")}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                loading={createOrder.isPending || stage.name === "checkout"}
              >
                <CreditCard aria-hidden="true" />
                Continue to payment
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

      <TestModeNote />
    </div>
  );
}

function PaymentOutcome({
  stage,
  onRestart,
  onRetry,
}: {
  stage: Extract<Stage, { name: "submitted" | "cancelled" | "failed" }>;
  onRestart: () => void;
  onRetry: (order: PaymentOrderResponse) => void;
}) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-5">
          {stage.name === "submitted" && (
            <>
              <Alert tone="success" title="Payment submitted">
                Razorpay has taken the payment. AegisBank marks it completed
                once Razorpay confirms it with a signed webhook - that usually
                takes a few seconds.
              </Alert>
              <dl className="grid gap-2 rounded-md border border-border bg-surface-subtle px-4 py-3 text-body-sm">
                <OutcomeRow label="Amount">
                  <Amount value={stage.order.amount} size="sm" />
                </OutcomeRow>
                <OutcomeRow label="Razorpay payment">
                  <span className="break-all font-mono">{stage.paymentId}</span>
                </OutcomeRow>
                <OutcomeRow label="Order">
                  <span className="break-all font-mono">
                    {stage.order.razorpayOrderId}
                  </span>
                </OutcomeRow>
              </dl>
            </>
          )}

          {stage.name === "cancelled" && (
            <Alert tone="warning" title="Payment window closed">
              Nothing was paid. The order is still open, so you can go back to
              it or start again.
            </Alert>
          )}

          {stage.name === "failed" && (
            <Alert tone="danger" title="The payment didn't go through">
              {stage.reason
                ? "Razorpay turned the payment down. Try a different method or start again."
                : "Razorpay turned the payment down. Try again, or use a different method."}
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            {stage.name !== "submitted" && (
              <Button onClick={() => onRetry(stage.order)}>
                <RotateCw aria-hidden="true" />
                Back to payment
              </Button>
            )}
            <Button
              variant={stage.name === "submitted" ? "primary" : "secondary"}
              onClick={onRestart}
            >
              Add a different amount
            </Button>
          </div>
        </CardContent>
      </Card>

      <TestModeNote />
    </div>
  );
}

function OutcomeRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Razorpay runs in test mode and, today, a completed payment does not yet move the balance:
 * crediting the account from `payment.completed` is still open (PENDING.md item 2). Saying so
 * here is better than letting someone wait for a balance that will not change.
 */
function TestModeNote() {
  return (
    <Alert tone="info" title="Test mode">
      <span className="grid gap-1">
        <span>
          Payments run against Razorpay&apos;s test environment, so no real
          money moves. Use a test card - any future expiry and any CVV.
        </span>
        <span>
          The balance on your account does not change yet: crediting it from a
          completed payment is still being built.
        </span>
        <a
          href="https://razorpay.com/docs/payments/payments/test-card-details/"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex w-fit items-center gap-1 text-brand underline-offset-4 hover:underline"
        >
          Razorpay test cards
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </span>
    </Alert>
  );
}
