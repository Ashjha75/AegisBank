import { describe, expect, it } from "vitest";
import {
  addAccount,
  EMPTY_ACCOUNTS,
  isValidAccountNumber,
  type KnownAccounts,
  MAX_ACCOUNTS,
  normalizeAccountNumber,
  parseStored,
  removeAccount,
  serialize,
  setActiveAccount,
} from "./known-accounts";

const A = "758885717853";
const B = "279012587051";
const C = "411122223333";

describe("normalizeAccountNumber", () => {
  it("strips the spaces and dashes people paste", () => {
    expect(normalizeAccountNumber("7588 8571 7853")).toBe(A);
    expect(normalizeAccountNumber("7588-8571-7853")).toBe(A);
  });
});

describe("isValidAccountNumber", () => {
  it("accepts a 12-digit number that does not start with 0", () => {
    expect(isValidAccountNumber(A)).toBe(true);
    expect(isValidAccountNumber("7588 8571 7853")).toBe(true);
  });

  it("rejects anything the backend would reject", () => {
    expect(isValidAccountNumber("")).toBe(false);
    expect(isValidAccountNumber("12345678901")).toBe(false); // 11 digits
    expect(isValidAccountNumber("1234567890123")).toBe(false); // 13 digits
    expect(isValidAccountNumber("058885717853")).toBe(false); // leading zero
    expect(isValidAccountNumber("75888571785a")).toBe(false);
  });
});

describe("addAccount", () => {
  it("adds the account and makes it active", () => {
    expect(addAccount(EMPTY_ACCOUNTS, A)).toEqual({
      accounts: [A],
      active: A,
    });
  });

  it("puts the newest first", () => {
    const state = addAccount(addAccount(EMPTY_ACCOUNTS, A), B);
    expect(state).toEqual({ accounts: [B, A], active: B });
  });

  it("selects a known account again instead of duplicating it", () => {
    const state = addAccount(addAccount(EMPTY_ACCOUNTS, A), B);
    expect(addAccount(state, A)).toEqual({ accounts: [B, A], active: A });
  });

  it("normalises before storing", () => {
    expect(addAccount(EMPTY_ACCOUNTS, "7588 8571 7853").accounts).toEqual([A]);
  });

  it("ignores an invalid number", () => {
    expect(addAccount(EMPTY_ACCOUNTS, "nope")).toBe(EMPTY_ACCOUNTS);
  });

  it("keeps at most MAX_ACCOUNTS", () => {
    let state: KnownAccounts = EMPTY_ACCOUNTS;
    for (let i = 0; i < MAX_ACCOUNTS + 3; i++) {
      state = addAccount(state, `9${String(i).padStart(11, "0")}`);
    }
    expect(state.accounts).toHaveLength(MAX_ACCOUNTS);
  });
});

describe("removeAccount", () => {
  it("hands the active slot to the next account", () => {
    const state: KnownAccounts = { accounts: [A, B], active: A };
    expect(removeAccount(state, A)).toEqual({ accounts: [B], active: B });
  });

  it("leaves the active account alone when another one goes", () => {
    const state: KnownAccounts = { accounts: [A, B], active: A };
    expect(removeAccount(state, B)).toEqual({ accounts: [A], active: A });
  });

  it("clears the active account when the last one goes", () => {
    expect(removeAccount({ accounts: [A], active: A }, A)).toEqual({
      accounts: [],
      active: null,
    });
  });

  it("is a no-op for an unknown account", () => {
    const state: KnownAccounts = { accounts: [A], active: A };
    expect(removeAccount(state, C)).toBe(state);
  });
});

describe("setActiveAccount", () => {
  it("switches between known accounts", () => {
    const state: KnownAccounts = { accounts: [A, B], active: A };
    expect(setActiveAccount(state, B).active).toBe(B);
  });

  it("ignores an account the browser does not know", () => {
    const state: KnownAccounts = { accounts: [A], active: A };
    expect(setActiveAccount(state, C)).toBe(state);
  });
});

describe("parseStored", () => {
  it("round-trips a serialised state", () => {
    const state: KnownAccounts = { accounts: [A, B], active: B };
    expect(parseStored(serialize(state))).toEqual(state);
  });

  it("returns an empty state for missing or broken storage", () => {
    expect(parseStored(null)).toEqual(EMPTY_ACCOUNTS);
    expect(parseStored("not json")).toEqual(EMPTY_ACCOUNTS);
    expect(parseStored("null")).toEqual(EMPTY_ACCOUNTS);
    expect(parseStored('"a string"')).toEqual(EMPTY_ACCOUNTS);
    expect(parseStored("{}")).toEqual(EMPTY_ACCOUNTS);
  });

  it("drops entries that are not valid account numbers", () => {
    expect(parseStored(JSON.stringify({ accounts: [A, "bad", 42] }))).toEqual({
      accounts: [A],
      active: A,
    });
  });

  it("removes duplicates", () => {
    expect(
      parseStored(JSON.stringify({ accounts: [A, "7588 8571 7853"] })),
    ).toEqual({ accounts: [A], active: A });
  });

  it("repairs an active account that is not in the list", () => {
    expect(
      parseStored(JSON.stringify({ accounts: [A, B], active: C })),
    ).toEqual({ accounts: [A, B], active: A });
  });
});
