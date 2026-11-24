"use client";

import {
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch, newIdempotencyKey } from "./client";
import type {
  AccountResponse,
  CreateAccountRequest,
  CreatePaymentRequest,
  PaymentOrderResponse,
  TransactionResponse,
  TransferRequest,
} from "./types";

/**
 * Every call the customer UI makes, in one place.
 *
 * Reads are TanStack Query hooks (cached, retried twice, never on a 4xx). Writes are mutations:
 * they carry an Idempotency-Key, never retry by themselves, and invalidate whatever they changed.
 *
 * Endpoints used (all through the BFF proxy -> api-gateway; `/internal/**` is never reachable):
 *   GET  /v1/accounts/{n}                      account details
 *   GET  /v1/accounts/{n}/balance              balance only (a bare number)
 *   POST /v1/accounts/create                   open an account
 *   GET  /v1/transactions/account/{n}/history  sent + received, newest first
 *   GET  /v1/transactions/{id}                 one transaction
 *   POST /v1/transactions/transfer             move money
 *   POST /v1/transactions/{id}/verify-otp      release a held transfer
 *   POST /v1/payments/create-order             start a Razorpay top-up
 */

export const bankingKeys = {
  account: (accountNumber: string) => ["account", accountNumber] as const,
  balance: (accountNumber: string) =>
    ["account", accountNumber, "balance"] as const,
  history: (accountNumber: string) =>
    ["transactions", "history", accountNumber] as const,
  transaction: (transactionId: string) =>
    ["transactions", "detail", transactionId] as const,
};

/** A transfer in flight settles through Kafka, so the UI polls until it stops moving. */
const SETTLING_STATUSES = new Set(["PENDING", "PROCESSING"]);
const SETTLING_POLL_MS = 2500;

export function useAccount(
  accountNumber: string | null,
): UseQueryResult<AccountResponse> {
  return useQuery({
    queryKey: bankingKeys.account(accountNumber ?? ""),
    queryFn: () => apiFetch<AccountResponse>(`/v1/accounts/${accountNumber}`),
    enabled: Boolean(accountNumber),
  });
}

export function useBalance(
  accountNumber: string | null,
): UseQueryResult<number> {
  return useQuery({
    queryKey: bankingKeys.balance(accountNumber ?? ""),
    queryFn: () => apiFetch<number>(`/v1/accounts/${accountNumber}/balance`),
    enabled: Boolean(accountNumber),
    staleTime: 10_000,
  });
}

export function useTransactionHistory(
  accountNumber: string | null,
): UseQueryResult<TransactionResponse[]> {
  return useQuery({
    queryKey: bankingKeys.history(accountNumber ?? ""),
    queryFn: () =>
      apiFetch<TransactionResponse[]>(
        `/v1/transactions/account/${accountNumber}/history`,
      ),
    enabled: Boolean(accountNumber),
  });
}

/**
 * One transaction. While it is still settling (PENDING / PROCESSING) the query refetches every
 * few seconds, because the final status arrives over Kafka after the HTTP call has answered.
 */
export function useTransaction(
  transactionId: string | null,
): UseQueryResult<TransactionResponse> {
  return useQuery({
    queryKey: bankingKeys.transaction(transactionId ?? ""),
    queryFn: () =>
      apiFetch<TransactionResponse>(`/v1/transactions/${transactionId}`),
    enabled: Boolean(transactionId),
    refetchInterval: (query) =>
      query.state.data && SETTLING_STATUSES.has(query.state.data.status)
        ? SETTLING_POLL_MS
        : false,
  });
}

export function useCreateAccount() {
  return useMutation({
    mutationFn: (body: CreateAccountRequest) =>
      apiFetch<AccountResponse>("/v1/accounts/create", {
        method: "POST",
        json: body,
        idempotencyKey: newIdempotencyKey(),
      }),
  });
}

export function useTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TransferRequest) =>
      apiFetch<TransactionResponse>("/v1/transactions/transfer", {
        method: "POST",
        json: body,
        idempotencyKey: newIdempotencyKey(),
      }),
    onSuccess: (transaction) => {
      invalidateAccountViews(queryClient, transaction.senderAccountNumber);
      invalidateAccountViews(queryClient, transaction.receiverAccountNumber);
      queryClient.setQueryData(
        bankingKeys.transaction(transaction.id),
        transaction,
      );
    },
  });
}

export function useVerifyOtp(transactionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otp: string) =>
      apiFetch<TransactionResponse>(
        `/v1/transactions/${transactionId}/verify-otp`,
        {
          method: "POST",
          json: { otp },
          idempotencyKey: newIdempotencyKey(),
        },
      ),
    onSuccess: (transaction) => {
      queryClient.setQueryData(
        bankingKeys.transaction(transaction.id),
        transaction,
      );
      invalidateAccountViews(queryClient, transaction.senderAccountNumber);
      invalidateAccountViews(queryClient, transaction.receiverAccountNumber);
    },
  });
}

export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: (body: CreatePaymentRequest) =>
      apiFetch<PaymentOrderResponse>("/v1/payments/create-order", {
        method: "POST",
        json: body,
        idempotencyKey: newIdempotencyKey(),
      }),
  });
}

/** Balance and history of one account are both stale after money has moved. */
function invalidateAccountViews(
  queryClient: ReturnType<typeof useQueryClient>,
  accountNumber: string,
) {
  queryClient.invalidateQueries({
    queryKey: bankingKeys.account(accountNumber),
  });
  queryClient.invalidateQueries({
    queryKey: bankingKeys.history(accountNumber),
  });
}
