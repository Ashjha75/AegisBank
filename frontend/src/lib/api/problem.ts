import { z } from "zod";

/**
 * The error model.
 *
 * Every Spring Boot service answers errors as RFC 9457 Problem Details (GlobalExceptionHandler):
 *   { type, title, status, detail, instance, errorCode, timestamp, errors? }
 * `errorCode` is the stable, machine-readable part - the UI branches on it, never on `detail` text.
 * `errors` (VALIDATION_FAILED only) maps a field name to its message.
 *
 * The frontend adds its own codes for failures that never reach a service (network, timeout,
 * gateway down, rate limit), so callers always deal with exactly one shape: ApiError.
 */
export const problemDetailSchema = z.looseObject({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().int().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errorCode: z.string().optional(),
  timestamp: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional(),
});

export type ProblemDetail = z.infer<typeof problemDetailSchema>;

/** Error codes sent by the backend services (keep in sync with each service's ErrorCode enum). */
export const BACKEND_ERROR_CODES = [
  "RESOURCE_NOT_FOUND",
  "RESOURCE_ALREADY_EXISTS",
  "VALIDATION_FAILED",
  "INTERNAL_ERROR",
  "ACCOUNT_NOT_ACTIVE",
  "INSUFFICIENT_BALANCE",
  "INVALID_TRANSACTION_STATE",
  "INVALID_OTP",
  "DOWNSTREAM_SERVICE_ERROR",
] as const;

/** Error codes produced by the frontend itself. */
export const CLIENT_ERROR_CODES = [
  "NETWORK_ERROR", // browser could not reach our server
  "GATEWAY_UNAVAILABLE", // our server could not reach the api-gateway
  "GATEWAY_TIMEOUT", // the gateway did not answer in time
  "RATE_LIMITED", // gateway answered 429
  "UNKNOWN_ERROR", // anything else, e.g. a non-JSON error body
] as const;

export type ErrorCode =
  | (typeof BACKEND_ERROR_CODES)[number]
  | (typeof CLIENT_ERROR_CODES)[number];

const KNOWN_CODES = new Set<string>([
  ...BACKEND_ERROR_CODES,
  ...CLIENT_ERROR_CODES,
]);

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: ErrorCode;
  readonly title: string;
  readonly detail?: string;
  /** Field name -> message, for VALIDATION_FAILED. */
  readonly fieldErrors: Record<string, string>;
  /** Request path that failed, useful in logs and support messages. */
  readonly instance?: string;
  readonly problem?: ProblemDetail;

  constructor(init: {
    status: number;
    errorCode: ErrorCode;
    title: string;
    detail?: string;
    fieldErrors?: Record<string, string>;
    instance?: string;
    problem?: ProblemDetail;
  }) {
    super(init.detail ?? init.title);
    this.name = "ApiError";
    this.status = init.status;
    this.errorCode = init.errorCode;
    this.title = init.title;
    this.detail = init.detail;
    this.fieldErrors = init.fieldErrors ?? {};
    this.instance = init.instance;
    this.problem = init.problem;
  }

  /** 4xx: the request itself was wrong - retrying the same request will not help. */
  get isClientError() {
    return (
      this.status >= 400 &&
      this.status < 500 &&
      this.errorCode !== "RATE_LIMITED"
    );
  }

  /** Build an ApiError from any failed HTTP response body (Problem Details or not). */
  static fromResponse(status: number, body: unknown): ApiError {
    const parsed = problemDetailSchema.safeParse(body);
    const problem = parsed.success ? parsed.data : undefined;
    const rawCode = problem?.errorCode;
    const errorCode: ErrorCode =
      rawCode && KNOWN_CODES.has(rawCode)
        ? (rawCode as ErrorCode)
        : status === 429
          ? "RATE_LIMITED"
          : status === 502 || status === 503
            ? "GATEWAY_UNAVAILABLE"
            : status === 504
              ? "GATEWAY_TIMEOUT"
              : "UNKNOWN_ERROR";
    return new ApiError({
      status,
      errorCode,
      title: problem?.title ?? `Request failed (${status})`,
      detail: problem?.detail,
      fieldErrors: problem?.errors,
      instance: problem?.instance,
      problem,
    });
  }

  static network(detail = "Could not reach the server"): ApiError {
    return new ApiError({
      status: 0,
      errorCode: "NETWORK_ERROR",
      title: "Network error",
      detail,
    });
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** A Problem Details body produced by the frontend server (e.g. when the gateway is down). */
export function problemResponse(
  status: number,
  errorCode: ErrorCode,
  title: string,
  detail: string,
  instance?: string,
): Response {
  const body: ProblemDetail = {
    type: "about:blank",
    title,
    status,
    detail,
    instance,
    errorCode,
    timestamp: new Date().toISOString(),
  };
  return Response.json(body, {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}
