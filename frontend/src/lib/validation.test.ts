import { describe, expect, it } from "vitest";
import {
  accountNumberField,
  amountField,
  descriptionField,
  isValidAmount,
  normalizeAmount,
  normalizePhone,
  phoneField,
} from "./validation";

describe("normalizeAmount", () => {
  it("drops the things people type around a number", () => {
    expect(normalizeAmount(" ₹1,500.50 ")).toBe("1500.50");
    expect(normalizeAmount("1 500")).toBe("1500");
  });

  it("keeps the digits exactly - money is never parsed to a float", () => {
    expect(normalizeAmount("1234.55")).toBe("1234.55");
    expect(normalizeAmount("0.01")).toBe("0.01");
  });
});

describe("isValidAmount", () => {
  it("accepts amounts the backend accepts", () => {
    expect(isValidAmount("1500")).toBe(true);
    expect(isValidAmount("1500.5")).toBe(true);
    expect(isValidAmount("1500.50")).toBe(true);
    expect(isValidAmount("₹1,500.50")).toBe(true);
    expect(isValidAmount("0.01")).toBe(true);
  });

  it("rejects what the backend rejects", () => {
    expect(isValidAmount("")).toBe(false);
    expect(isValidAmount("0")).toBe(false);
    expect(isValidAmount("-5")).toBe(false);
    expect(isValidAmount("1500.555")).toBe(false); // 3 decimals
    expect(isValidAmount("12345678901234")).toBe(false); // 14 integer digits
    expect(isValidAmount("abc")).toBe(false);
  });
});

describe("accountNumberField", () => {
  it("accepts a 12-digit number, spaced or not", () => {
    expect(accountNumberField.safeParse("758885717853").success).toBe(true);
    expect(accountNumberField.safeParse("7588 8571 7853").success).toBe(true);
  });

  it("rejects the wrong length or a leading zero", () => {
    expect(accountNumberField.safeParse("").success).toBe(false);
    expect(accountNumberField.safeParse("12345678901").success).toBe(false);
    expect(accountNumberField.safeParse("058885717853").success).toBe(false);
  });
});

describe("amountField", () => {
  it("explains what is wrong", () => {
    const tooPrecise = amountField.safeParse("10.999");
    expect(tooPrecise.success).toBe(false);
    expect(tooPrecise.error?.issues[0]?.message).toContain("1500.50");

    const zero = amountField.safeParse("0");
    expect(zero.success).toBe(false);
    expect(zero.error?.issues[0]?.message).toContain("more than zero");
  });

  it("accepts a good amount", () => {
    expect(amountField.safeParse("2500.75").success).toBe(true);
  });
});

describe("descriptionField", () => {
  it("allows an empty note and refuses an over-long one", () => {
    expect(descriptionField.safeParse(undefined).success).toBe(true);
    expect(descriptionField.safeParse("Rent").success).toBe(true);
    expect(descriptionField.safeParse("x".repeat(256)).success).toBe(false);
  });
});

describe("phoneField", () => {
  it("accepts Indian mobile numbers with or without +91", () => {
    expect(phoneField.safeParse("9876543210").success).toBe(true);
    expect(phoneField.safeParse("+919876543210").success).toBe(true);
    expect(normalizePhone("98765 43210")).toBe("9876543210");
    expect(phoneField.safeParse("98765 43210").success).toBe(true);
  });

  it("rejects numbers the backend would reject", () => {
    expect(phoneField.safeParse("1234567890").success).toBe(false); // must start 6-9
    expect(phoneField.safeParse("98765").success).toBe(false);
  });
});
