import { problemResponse } from "./problem";

/**
 * Server-side forwarding from /api/gateway/<path> to <API_GATEWAY_URL>/api/<path>.
 * Kept separate from the route file so it can be unit-tested without Next.js.
 */

/** Request headers worth passing on. Cookies and hop-by-hop headers are not forwarded. */
const FORWARD_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "idempotency-key",
  "x-request-id",
];

/** Response headers worth passing back to the browser. */
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "x-request-id",
  "retry-after",
  "x-ratelimit-remaining",
  "x-ratelimit-replenish-rate",
  "x-ratelimit-burst-capacity",
  "location",
];

/** Only the public API is reachable. /internal/** and anything else is refused here too. */
const ALLOWED_PATH = /^v1\/[A-Za-z0-9._~\-/]+$/;

export interface ForwardOptions {
  gatewayUrl: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

export async function forwardToGateway(
  request: Request,
  pathSegments: string[],
  { gatewayUrl, timeoutMs, fetchImpl = fetch }: ForwardOptions,
): Promise<Response> {
  const path = pathSegments.map(encodeURIComponent).join("/");
  const instance = `/api/${path}`;
  if (
    !ALLOWED_PATH.test(path) ||
    pathSegments.some((s) => s === ".." || s === ".")
  ) {
    return problemResponse(
      404,
      "RESOURCE_NOT_FOUND",
      "Not found",
      "Unknown API path.",
      instance,
    );
  }

  const incoming = new URL(request.url);
  const target = `${gatewayUrl.replace(/\/+$/, "")}/api/${path}${incoming.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const requestId = headers.get("x-request-id") ?? crypto.randomUUID();
  headers.set("x-request-id", requestId);
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetchImpl(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    return timedOut
      ? problemResponse(
          504,
          "GATEWAY_TIMEOUT",
          "Gateway timeout",
          `No answer within ${timeoutMs} ms.`,
          instance,
        )
      : problemResponse(
          502,
          "GATEWAY_UNAVAILABLE",
          "Bad gateway",
          "The API gateway could not be reached.",
          instance,
        );
  }

  const responseHeaders = new Headers({
    "x-request-id": requestId,
    "Cache-Control": "no-store",
  });
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
