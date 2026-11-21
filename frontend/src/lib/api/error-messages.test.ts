import { describe, expect, it } from "vitest";
import { userMessageFor } from "./error-messages";
import { BACKEND_ERROR_CODES, CLIENT_ERROR_CODES } from "./problem";

describe("userMessageFor", () => {
  it.each([
    ...BACKEND_ERROR_CODES,
    ...CLIENT_ERROR_CODES,
  ])("has a customer message for %s", (errorCode) => {
    const message = userMessageFor({ errorCode });
    expect(message.title.length).toBeGreaterThan(0);
    expect(message.message.length).toBeGreaterThan(0);
  });

  it("never offers a retry for insufficient balance", () => {
    expect(
      userMessageFor({ errorCode: "INSUFFICIENT_BALANCE" }).retryable,
    ).toBe(false);
  });
});
