import { ApiError } from "./problem";

/**
 * The one way the UI calls the backend.
 *
 *   const account = await apiFetch<AccountResponse>("/v1/accounts/123456789012");
 *   await apiFetch("/v1/transactions/transfer", { method: "POST", json: body, idempotencyKey });
 *
 * In the browser, requests go to our own server (/api/gateway/...), which forwards them to the
 * Spring Cloud api-gateway (src/app/api/gateway/[...path]/route.ts). The browser never needs the
 * gateway's address and there is no CORS to configure.
 * On success it returns the parsed JSON; on failure it throws an ApiError (see problem.ts).
 */
export type ApiPath = `/v1/${string}`;

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Request body, sent as JSON. */
  json?: unknown;
  /** Sent as the Idempotency-Key header so a retried POST does not move money twice. */
  idempotencyKey?: string;
}

export const GATEWAY_PROXY_PREFIX = "/api/gateway";

export async function apiFetch<T = unknown>(
  path: ApiPath,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, idempotencyKey, headers, ...init } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json, application/problem+json");
  if (json !== undefined)
    requestHeaders.set("Content-Type", "application/json");
  if (idempotencyKey) requestHeaders.set("Idempotency-Key", idempotencyKey);

  let response: Response;
  try {
    response = await fetch(`${GATEWAY_PROXY_PREFIX}${path}`, {
      ...init,
      headers: requestHeaders,
      body: json === undefined ? undefined : JSON.stringify(json),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw ApiError.network();
  }

  const body = await readBody(response);
  if (!response.ok) throw ApiError.fromResponse(response.status, body);
  return body as T;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  const type = response.headers.get("Content-Type") ?? "";
  if (type.includes("json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

/** A fresh key per user action (not per retry). */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
