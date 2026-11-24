"use client";

import { RotateCw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { userMessageFor } from "@/lib/api/error-messages";
import { isApiError } from "@/lib/api/problem";

/**
 * The one way a failed request is shown. It reads the stable `errorCode`, never the backend's
 * `detail` text, and offers "Try again" only when retrying could actually help.
 *
 *   {query.isError && <ApiErrorState error={query.error} onRetry={() => query.refetch()} />}
 */
export function ApiErrorState({
  error,
  onRetry,
  /** Replaces the standard message, e.g. "We couldn't find account 7588 8571 7853." */
  notFoundMessage,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  notFoundMessage?: string;
  className?: string;
}) {
  if (!isApiError(error)) {
    return (
      <Alert
        tone="danger"
        title="Something went wrong"
        className={className}
        action={
          onRetry && (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              <RotateCw aria-hidden="true" />
              Try again
            </Button>
          )
        }
      >
        An unexpected error occurred. Please try again.
      </Alert>
    );
  }

  const { title, message, retryable } = userMessageFor(error);
  const body =
    notFoundMessage && error.errorCode === "RESOURCE_NOT_FOUND"
      ? notFoundMessage
      : message;

  return (
    <Alert
      tone={retryable ? "warning" : "danger"}
      title={title}
      className={className}
      footer={
        error.instance ? (
          <span className="font-mono">{error.instance}</span>
        ) : undefined
      }
      action={
        retryable &&
        onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            <RotateCw aria-hidden="true" />
            Try again
          </Button>
        )
      }
    >
      {body}
    </Alert>
  );
}
