import { describe, expect, it } from "vitest";
import { ApiError, isApiError, problemResponse } from "./problem";

describe("ApiError.fromResponse", () => {
  it("keeps the backend errorCode, title, detail and field errors", () => {
    const error = ApiError.fromResponse(400, {
      type: "about:blank",
      title: "Validation failed",
      status: 400,
      detail: "Request has invalid fields",
      instance: "/api/v1/transactions/transfer",
      errorCode: "VALIDATION_FAILED",
      timestamp: "2026-11-21T08:30:00Z",
      errors: { amount: "must be greater than 0" },
    });

    expect(error.errorCode).toBe("VALIDATION_FAILED");
    expect(error.title).toBe("Validation failed");
    expect(error.detail).toBe("Request has invalid fields");
    expect(error.fieldErrors).toEqual({ amount: "must be greater than 0" });
    expect(error.instance).toBe("/api/v1/transactions/transfer");
    expect(error.isClientError).toBe(true);
    expect(isApiError(error)).toBe(true);
  });

  it.each([
    [429, "RATE_LIMITED"],
    [502, "GATEWAY_UNAVAILABLE"],
    [503, "GATEWAY_UNAVAILABLE"],
    [504, "GATEWAY_TIMEOUT"],
    [500, "UNKNOWN_ERROR"],
  ] as const)("maps status %i without a known code to %s", (status, code) => {
    expect(ApiError.fromResponse(status, "<html>oops</html>").errorCode).toBe(
      code,
    );
  });

  it("treats an unknown backend errorCode by its status", () => {
    expect(
      ApiError.fromResponse(503, { errorCode: "SOMETHING_NEW" }).errorCode,
    ).toBe("GATEWAY_UNAVAILABLE");
  });

  it("does not treat rate limiting as a client error, so reads may retry", () => {
    expect(ApiError.fromResponse(429, {}).isClientError).toBe(false);
  });

  it("builds a network error with status 0", () => {
    const error = ApiError.network();
    expect(error.status).toBe(0);
    expect(error.errorCode).toBe("NETWORK_ERROR");
    expect(error.isClientError).toBe(false);
  });
});

describe("problemResponse", () => {
  it("returns an RFC 9457 body with the problem+json content type", async () => {
    const response = problemResponse(
      502,
      "GATEWAY_UNAVAILABLE",
      "Bad gateway",
      "Down",
      "/api/v1/x",
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    const body = await response.json();
    expect(body).toMatchObject({
      status: 502,
      errorCode: "GATEWAY_UNAVAILABLE",
      instance: "/api/v1/x",
    });
    expect(ApiError.fromResponse(response.status, body).errorCode).toBe(
      "GATEWAY_UNAVAILABLE",
    );
  });
});
