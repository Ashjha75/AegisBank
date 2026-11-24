import { describe, expect, it } from "vitest";
import type { TransactionResponse, TransactionStatus } from "@/lib/api/types";
import {
  amountDirectionFor,
  byNewestFirst,
  counterpartyFor,
  directionFor,
  isSettling,
  needsOtp,
  statusExplanationFor,
} from "./transactions";

const ME = "758885717853";
const THEM = "279012587051";

function txn(
  overrides: Partial<TransactionResponse> = {},
): TransactionResponse {
  return {
    id: "t-1",
    senderAccountNumber: ME,
    receiverAccountNumber: THEM,
    amount: 1500,
    type: "TRANSFER",
    status: "COMPLETED",
    description: null,
    failureReason: null,
    referenceNumber: "TXN123",
    createdAt: "2026-11-24T10:00:00",
    completedAt: "2026-11-24T10:00:02",
    ...overrides,
  };
}

describe("directionFor", () => {
  it("is a debit for the sender and a credit for the receiver", () => {
    expect(directionFor(txn(), ME)).toBe("debit");
    expect(directionFor(txn(), THEM)).toBe("credit");
  });

  it("is 'other' for an unrelated account", () => {
    expect(directionFor(txn(), "411122223333")).toBe("other");
  });
});

describe("counterpartyFor", () => {
  it("shows the other side of the transfer", () => {
    expect(counterpartyFor(txn(), ME)).toBe(THEM);
    expect(counterpartyFor(txn(), THEM)).toBe(ME);
  });
});

describe("amountDirectionFor", () => {
  it("signs the amount once the transfer has settled", () => {
    expect(amountDirectionFor(txn({ status: "COMPLETED" }), ME)).toBe("debit");
    expect(amountDirectionFor(txn({ status: "COMPLETED" }), THEM)).toBe(
      "credit",
    );
  });

  it("stays pending while the transfer is still moving", () => {
    for (const status of [
      "PENDING",
      "PROCESSING",
      "PENDING_VERIFICATION",
    ] as TransactionStatus[]) {
      expect(amountDirectionFor(txn({ status }), ME)).toBe("pending");
      expect(amountDirectionFor(txn({ status }), THEM)).toBe("pending");
    }
  });

  it("marks failed and flagged transfers as failed for both sides", () => {
    for (const status of ["FAILED", "FLAGGED"] as TransactionStatus[]) {
      expect(amountDirectionFor(txn({ status }), ME)).toBe("failed");
      expect(amountDirectionFor(txn({ status }), THEM)).toBe("failed");
    }
  });

  it("is neutral for an account that is neither side", () => {
    expect(amountDirectionFor(txn(), "411122223333")).toBe("neutral");
  });
});

describe("needsOtp / isSettling", () => {
  it("asks for an OTP only while PENDING_VERIFICATION", () => {
    expect(needsOtp(txn({ status: "PENDING_VERIFICATION" }))).toBe(true);
    expect(needsOtp(txn({ status: "COMPLETED" }))).toBe(false);
    expect(needsOtp(txn({ status: "PROCESSING" }))).toBe(false);
  });

  it("is settling only while PENDING or PROCESSING", () => {
    expect(isSettling(txn({ status: "PENDING" }))).toBe(true);
    expect(isSettling(txn({ status: "PROCESSING" }))).toBe(true);
    // An OTP transfer waits for the customer, not for the backend.
    expect(isSettling(txn({ status: "PENDING_VERIFICATION" }))).toBe(false);
    expect(isSettling(txn({ status: "COMPLETED" }))).toBe(false);
  });
});

describe("statusExplanationFor", () => {
  it("has a sentence for every status, from both sides", () => {
    const statuses: TransactionStatus[] = [
      "PENDING",
      "PROCESSING",
      "PENDING_VERIFICATION",
      "COMPLETED",
      "FAILED",
      "FLAGGED",
    ];
    for (const status of statuses) {
      expect(statusExplanationFor(txn({ status }), ME).length).toBeGreaterThan(
        0,
      );
      expect(
        statusExplanationFor(txn({ status }), THEM).length,
      ).toBeGreaterThan(0);
    }
  });

  it("tells the sender the money came back when a transfer is flagged", () => {
    expect(statusExplanationFor(txn({ status: "FLAGGED" }), ME)).toContain(
      "returned to this account",
    );
    expect(statusExplanationFor(txn({ status: "FLAGGED" }), THEM)).toContain(
      "Nothing was credited",
    );
  });
});

describe("byNewestFirst", () => {
  it("sorts the newest transaction first", () => {
    const older = txn({ id: "old", createdAt: "2026-11-20T09:00:00" });
    const newer = txn({ id: "new", createdAt: "2026-11-24T09:00:00" });
    expect([older, newer].sort(byNewestFirst).map((t) => t.id)).toEqual([
      "new",
      "old",
    ]);
  });
});
