// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  accountsStore,
  resetAccountsStoreForTests,
  useKnownAccounts,
} from "./accounts-store";
import { STORAGE_KEY } from "./known-accounts";

const A = "758885717853";
const B = "279012587051";

beforeEach(() => {
  window.localStorage.clear();
  resetAccountsStoreForTests();
});

describe("useKnownAccounts", () => {
  it("reads what is already in storage and reports ready", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accounts: [A, B], active: B }),
    );
    const { result } = renderHook(() => useKnownAccounts());
    expect(result.current.ready).toBe(true);
    expect(result.current.accounts).toEqual([A, B]);
    expect(result.current.active).toBe(B);
  });

  it("starts empty when nothing is stored", () => {
    const { result } = renderHook(() => useKnownAccounts());
    expect(result.current.accounts).toEqual([]);
    expect(result.current.active).toBeNull();
  });

  it("adds an account, makes it active and persists it", () => {
    const { result } = renderHook(() => useKnownAccounts());
    act(() => result.current.add(A));

    expect(result.current.accounts).toEqual([A]);
    expect(result.current.active).toBe(A);
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
    ).toEqual({ accounts: [A], active: A });
  });

  it("switches between accounts", () => {
    const { result } = renderHook(() => useKnownAccounts());
    act(() => result.current.add(A));
    act(() => result.current.add(B));
    act(() => result.current.select(A));
    expect(result.current.active).toBe(A);
  });

  it("removes an account and hands the active slot on", () => {
    const { result } = renderHook(() => useKnownAccounts());
    act(() => result.current.add(A));
    act(() => result.current.add(B)); // B is active
    act(() => result.current.remove(B));
    expect(result.current.accounts).toEqual([A]);
    expect(result.current.active).toBe(A);
  });

  it("keeps two components in step", () => {
    const first = renderHook(() => useKnownAccounts());
    const second = renderHook(() => useKnownAccounts());
    act(() => first.result.current.add(A));
    expect(second.result.current.active).toBe(A);
  });

  it("returns the same snapshot when nothing changed", () => {
    const { result, rerender } = renderHook(() => useKnownAccounts());
    act(() => result.current.add(A));
    const accounts = result.current.accounts;
    // Selecting an account the store does not know is a no-op, so no re-render storm.
    act(() => result.current.select("411122223333"));
    rerender();
    expect(result.current.accounts).toBe(accounts);
  });

  it("ignores an invalid account number", () => {
    const { result } = renderHook(() => useKnownAccounts());
    act(() => result.current.add("nope"));
    expect(result.current.accounts).toEqual([]);
  });

  it("can be driven without a component", () => {
    const { result } = renderHook(() => useKnownAccounts());
    act(() => accountsStore.add(A));
    expect(result.current.active).toBe(A);
  });
});
