import type { MoneyInput } from "@/lib/format";

/**
 * The backend's public API shapes, mirroring the request/response records of the three
 * client-facing services. Hand-written on purpose: `pnpm api:types` needs the whole backend
 * running, and these few records change rarely.
 *
 * Keep in sync with:
 *   account-service      dto/AccountResponse, dto/CreateAccountRequest
 *   transaction-service  dto/TransactionResponse, dto/TransferRequest, dto/VerifyOtpRequest
 *   payment-service      dto/PaymentOrderResponse, dto/CreatePaymentRequest
 *
 * Money is a Java BigDecimal, which Jackson writes as a JSON number - typed as `MoneyInput`
 * so a string stays valid too. Never do arithmetic on it in the browser.
 */

export const ACCOUNT_TYPES = ["SAVINGS", "CURRENT", "FIXED_DEPOSIT"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_STATUSES = ["ACTIVE", "BLOCKED", "CLOSED"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const TRANSACTION_TYPES = [
  "DEPOSIT",
  "WITHDRAW",
  "PAYMENT",
  "TRANSFER",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = [
  "PENDING",
  "PROCESSING",
  "PENDING_VERIFICATION",
  "COMPLETED",
  "FAILED",
  "FLAGGED",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "CREATED",
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** GET /v1/accounts/{accountNumber} */
export interface AccountResponse {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  accountStatus: AccountStatus;
  balance: MoneyInput;
  minimumBalance: MoneyInput;
  dailyTransactionLimit: MoneyInput;
  /** LocalDateTime, e.g. "2026-11-24T20:11:03.412". */
  createdAt: string;
}

/** POST /v1/accounts/create */
export interface CreateAccountRequest {
  email: string;
  phone: string;
  accountType: AccountType;
  accountHolderName: string;
  initialDeposit: MoneyInput;
}

/** GET /v1/transactions/{id} and the transfer / verify-otp responses. */
export interface TransactionResponse {
  id: string;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: MoneyInput;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  failureReason: string | null;
  referenceNumber: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** POST /v1/transactions/transfer */
export interface TransferRequest {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: string;
  description?: string;
}

/** POST /v1/transactions/{id}/verify-otp */
export interface VerifyOtpRequest {
  otp: string;
}

/** POST /v1/payments/create-order */
export interface CreatePaymentRequest {
  accountNumber: string;
  amount: string;
  description?: string;
}

export interface PaymentOrderResponse {
  paymentId: string;
  razorpayOrderId: string;
  amount: MoneyInput;
  currency: string;
  status: PaymentStatus;
  razorpayKeyId: string;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  SAVINGS: "Savings",
  CURRENT: "Current",
  FIXED_DEPOSIT: "Fixed deposit",
};

export function accountTypeLabel(type: AccountType): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type;
}

const ACCOUNT_STATUS_TONES: Record<
  AccountStatus,
  { label: string; tone: "success" | "danger" | "neutral" }
> = {
  ACTIVE: { label: "Active", tone: "success" },
  BLOCKED: { label: "Blocked", tone: "danger" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export function accountStatusBadge(status: AccountStatus) {
  return ACCOUNT_STATUS_TONES[status] ?? { label: status, tone: "neutral" };
}
