import type { ApiError, ErrorCode } from "./problem";

/**
 * What the customer reads for each error code. Written for a person, not a developer:
 * what happened, and what they can do next. Backend `detail` text is never shown raw.
 */
export interface UserMessage {
  title: string;
  message: string;
  /** True when trying the same thing again may work. */
  retryable: boolean;
}

const messages: Record<ErrorCode, UserMessage> = {
  RESOURCE_NOT_FOUND: {
    title: "Not found",
    message:
      "We couldn't find what you were looking for. Check the details and try again.",
    retryable: false,
  },
  RESOURCE_ALREADY_EXISTS: {
    title: "Already exists",
    message:
      "Something with these details already exists. Try different details or sign in instead.",
    retryable: false,
  },
  VALIDATION_FAILED: {
    title: "Check your details",
    message: "Some fields need attention. Correct them and submit again.",
    retryable: false,
  },
  INTERNAL_ERROR: {
    title: "Something went wrong",
    message:
      "We hit an unexpected problem. Your money is safe. Please try again in a moment.",
    retryable: true,
  },
  ACCOUNT_NOT_ACTIVE: {
    title: "Account unavailable",
    message:
      "This account can't send or receive money right now. Contact support if you think this is a mistake.",
    retryable: false,
  },
  INSUFFICIENT_BALANCE: {
    title: "Not enough balance",
    message:
      "Your balance doesn't cover this amount. Enter a smaller amount or add money first.",
    retryable: false,
  },
  INVALID_TRANSACTION_STATE: {
    title: "Transfer already handled",
    message:
      "This transfer has moved on and can't be changed now. Check its latest status.",
    retryable: false,
  },
  INVALID_OTP: {
    title: "Incorrect code",
    message:
      "That code didn't match. Check the latest code we sent and try again.",
    retryable: true,
  },
  DOWNSTREAM_SERVICE_ERROR: {
    title: "Service busy",
    message:
      "One of our services didn't respond. Nothing was charged twice. Please try again shortly.",
    retryable: true,
  },
  NETWORK_ERROR: {
    title: "You're offline",
    message:
      "We couldn't reach AegisBank. Check your connection and try again.",
    retryable: true,
  },
  GATEWAY_UNAVAILABLE: {
    title: "Service unavailable",
    message:
      "AegisBank is temporarily unavailable. Please try again in a few minutes.",
    retryable: true,
  },
  GATEWAY_TIMEOUT: {
    title: "Taking too long",
    message:
      "The request timed out. Check your transaction history before trying again.",
    retryable: true,
  },
  RATE_LIMITED: {
    title: "Too many requests",
    message: "You're going a little fast. Wait a few seconds and try again.",
    retryable: true,
  },
  UNKNOWN_ERROR: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
  },
};

export function userMessageFor(
  error: Pick<ApiError, "errorCode">,
): UserMessage {
  return messages[error.errorCode] ?? messages.UNKNOWN_ERROR;
}
