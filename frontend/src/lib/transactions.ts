import type { AmountDirection } from "@/components/ui/amount";
import type { TransactionResponse, TransactionStatus } from "@/lib/api/types";

/**
 * Reading a transaction from one account's point of view.
 *
 * The backend stores a transfer once, with a sender and a receiver. The same row is money out
 * for one account and money in for the other, so every list needs the account it is shown for.
 */

export type TransactionDirection = "credit" | "debit" | "other";

export function directionFor(
  transaction: Pick<
    TransactionResponse,
    "senderAccountNumber" | "receiverAccountNumber"
  >,
  accountNumber: string,
): TransactionDirection {
  if (transaction.receiverAccountNumber === accountNumber) return "credit";
  if (transaction.senderAccountNumber === accountNumber) return "debit";
  return "other";
}

/** The other side of the transfer, for the "To / From" column. */
export function counterpartyFor(
  transaction: Pick<
    TransactionResponse,
    "senderAccountNumber" | "receiverAccountNumber"
  >,
  accountNumber: string,
): string {
  return directionFor(transaction, accountNumber) === "credit"
    ? transaction.senderAccountNumber
    : transaction.receiverAccountNumber;
}

/** Money is only green or signed once it has actually settled. */
export function amountDirectionFor(
  transaction: Pick<
    TransactionResponse,
    "senderAccountNumber" | "receiverAccountNumber" | "status"
  >,
  accountNumber: string,
): AmountDirection {
  switch (transaction.status) {
    case "FAILED":
    case "FLAGGED":
      return "failed";
    case "PENDING":
    case "PROCESSING":
    case "PENDING_VERIFICATION":
      return "pending";
    default: {
      const direction = directionFor(transaction, accountNumber);
      return direction === "other" ? "neutral" : direction;
    }
  }
}

/** Waiting for a one-time code from the customer. */
export function needsOtp(
  transaction: Pick<TransactionResponse, "status">,
): boolean {
  return transaction.status === "PENDING_VERIFICATION";
}

/** Still moving: the final status arrives over Kafka, so the UI keeps polling. */
export function isSettling(
  transaction: Pick<TransactionResponse, "status">,
): boolean {
  return (
    transaction.status === "PENDING" || transaction.status === "PROCESSING"
  );
}

/**
 * One plain sentence about where a transfer stands, written for the customer and from the
 * point of view of the account on screen. Backend `failureReason` text is never shown raw.
 */
export function statusExplanationFor(
  transaction: Pick<
    TransactionResponse,
    "senderAccountNumber" | "receiverAccountNumber" | "status"
  >,
  accountNumber: string,
): string {
  const sent = directionFor(transaction, accountNumber) === "debit";
  const explanations: Record<TransactionStatus, string> = {
    PENDING: "Just created. The transfer has not started moving yet.",
    PROCESSING: sent
      ? "The amount has left this account and is being screened for fraud. The receiver is credited once it passes."
      : "On its way. The amount is credited here once the fraud check passes.",
    PENDING_VERIFICATION: sent
      ? "This transfer is large enough to need a one-time code. Enter the code to release it."
      : "Waiting for the sender to confirm with a one-time code.",
    COMPLETED: sent
      ? "Sent. The receiver has been credited."
      : "Received and credited to this account.",
    FAILED: sent
      ? "This transfer did not go through. Nothing left this account."
      : "This transfer did not go through. Nothing was credited here.",
    FLAGGED: sent
      ? "Stopped by the fraud check. The amount has been returned to this account."
      : "Stopped by the fraud check. Nothing was credited here.",
  };
  return explanations[transaction.status] ?? "";
}

/** Newest first, the order the history endpoint already uses - re-applied after client filtering. */
export function byNewestFirst(
  a: Pick<TransactionResponse, "createdAt">,
  b: Pick<TransactionResponse, "createdAt">,
): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
