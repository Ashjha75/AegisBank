import { describe, expect, it } from "vitest";
import {
  formatAccountNumber,
  formatDate,
  formatMoney,
  maskAccountNumber,
  splitMoney,
} from "./format";

describe("formatMoney", () => {
  it("formats rupees with Indian digit grouping and two decimals", () => {
    expect(formatMoney(125000)).toBe("₹1,25,000.00");
    expect(formatMoney("1999.5")).toBe("₹1,999.50");
  });

  it("shows a dash for values that are not numbers", () => {
    expect(formatMoney("abc")).toBe("—");
  });
});

describe("splitMoney", () => {
  it("separates the paise", () => {
    expect(splitMoney("2500.75")).toEqual({ major: "₹2,500", minor: ".75" });
  });
});

describe("account numbers", () => {
  it("groups in fours", () => {
    expect(formatAccountNumber("123456789012")).toBe("1234 5678 9012");
  });

  it("masks all but the last four digits", () => {
    expect(maskAccountNumber("123456789012")).toBe("•••• 9012");
    expect(maskAccountNumber("123")).toBe("123");
  });
});

describe("formatDate", () => {
  it("formats a date-only string as that calendar day", () => {
    expect(formatDate("2026-11-21")).toBe("21 Nov 2026");
  });

  it("returns a dash for invalid input", () => {
    expect(formatDate("not a date")).toBe("—");
  });
});
