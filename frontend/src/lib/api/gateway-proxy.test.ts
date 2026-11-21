import { describe, expect, it, vi } from "vitest";
import { forwardToGateway } from "./gateway-proxy";

const options = (fetchImpl: typeof fetch) => ({
  gatewayUrl: "http://gateway:8080/",
  timeoutMs: 1000,
  fetchImpl,
});

describe("forwardToGateway", () => {
  it("forwards to /api/<path> on the gateway with query, body and allowed headers only", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(
        { id: "t-1" },
        { status: 201, headers: { "set-cookie": "a=b", location: "/x" } },
      ),
    );
    const request = new Request(
      "http://frontend/api/gateway/v1/transactions/transfer?dry=1",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-1",
          cookie: "session=secret",
          "x-request-id": "req-1",
        },
        body: JSON.stringify({ amount: "100.00" }),
      },
    );

    const response = await forwardToGateway(
      request,
      ["v1", "transactions", "transfer"],
      options(fetchImpl),
    );

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("http://gateway:8080/api/v1/transactions/transfer?dry=1");
    const headers = new Headers(init?.headers);
    expect(init?.method).toBe("POST");
    expect(headers.get("idempotency-key")).toBe("key-1");
    expect(headers.get("x-request-id")).toBe("req-1");
    expect(headers.has("cookie")).toBe(false);
    expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe(
      '{"amount":"100.00"}',
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("location")).toBe("/x");
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ id: "t-1" });
  });

  it("adds a request id when the browser did not send one", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 204 }),
    );
    const response = await forwardToGateway(
      new Request("http://frontend/api/gateway/v1/accounts/1"),
      ["v1", "accounts", "1"],
      options(fetchImpl),
    );
    const sent = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers).get(
      "x-request-id",
    );
    expect(sent).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get("x-request-id")).toBe(sent);
  });

  it.each([
    [["internal", "v1", "accounts", "1", "deduct"]],
    [["v1", "..", "internal", "v1", "accounts"]],
    [["docs", "account", "v3", "api-docs"]],
    [["v1"]],
  ])("refuses paths outside /v1: %j", async (segments) => {
    const fetchImpl = vi.fn<typeof fetch>();
    const response = await forwardToGateway(
      new Request("http://frontend/x"),
      segments,
      options(fetchImpl),
    );
    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("answers 502 GATEWAY_UNAVAILABLE when the gateway can't be reached", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    const response = await forwardToGateway(
      new Request("http://frontend/x"),
      ["v1", "accounts"],
      options(fetchImpl),
    );
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      errorCode: "GATEWAY_UNAVAILABLE",
    });
  });

  it("answers 504 GATEWAY_TIMEOUT when the gateway is too slow", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    const response = await forwardToGateway(
      new Request("http://frontend/x"),
      ["v1", "accounts"],
      options(fetchImpl),
    );
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({
      errorCode: "GATEWAY_TIMEOUT",
    });
  });

  it("passes backend error responses through unchanged", async () => {
    const problem = {
      status: 422,
      errorCode: "INSUFFICIENT_BALANCE",
      title: "Insufficient balance",
    };
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(problem, {
        status: 422,
        headers: { "content-type": "application/problem+json" },
      }),
    );
    const response = await forwardToGateway(
      new Request("http://frontend/x"),
      ["v1", "accounts"],
      options(fetchImpl),
    );
    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(await response.json()).toEqual(problem);
  });
});
