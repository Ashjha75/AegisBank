"use client";

import { useSyncExternalStore } from "react";
import {
  addAccount,
  EMPTY_ACCOUNTS,
  type KnownAccounts,
  readStored,
  removeAccount,
  setActiveAccount,
  writeStored,
} from "./known-accounts";

/**
 * The accounts this browser knows about, as a store every screen under /app can read.
 *
 * Why a store and not useState + useEffect: the value comes from localStorage, which does not
 * exist on the server. `useSyncExternalStore` is the one way to read such a value safely -
 * React uses `getServerSnapshot` while rendering on the server AND while hydrating, then
 * re-renders with the real value. A plain effect breaks on the routes that stream (an account
 * page, a transaction page): their content hydrates after this store has already loaded, so the
 * first client render no longer matches the HTML and React throws a hydration mismatch.
 *
 * `ready` is false until the browser value has been read, so a screen can show a loader instead
 * of flashing "no accounts yet" at someone who has one.
 */
export interface AccountsSnapshot extends KnownAccounts {
  ready: boolean;
}

/** What the server renders, and what hydration starts from: nothing read yet. */
const SERVER_SNAPSHOT: AccountsSnapshot = { ...EMPTY_ACCOUNTS, ready: false };

/**
 * Cached so getSnapshot() returns the same object until something actually changes -
 * useSyncExternalStore compares by identity and would loop forever on a fresh object.
 */
let snapshot: AccountsSnapshot | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): AccountsSnapshot {
  if (!snapshot) snapshot = { ...readStored(), ready: true };
  return snapshot;
}

function getServerSnapshot(): AccountsSnapshot {
  return SERVER_SNAPSHOT;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab of the app changed the list - keep both in step.
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function onStorage() {
  snapshot = { ...readStored(), ready: true };
  emit();
}

/** Applies a change, persists it and tells every subscriber. */
function update(change: (current: KnownAccounts) => KnownAccounts): void {
  const current = getSnapshot();
  const next = change({ accounts: current.accounts, active: current.active });
  if (next.accounts === current.accounts && next.active === current.active) {
    return;
  }
  snapshot = { ...next, ready: true };
  writeStored(next);
  emit();
}

export const accountsStore = {
  add: (accountNumber: string) =>
    update((current) => addAccount(current, accountNumber)),
  remove: (accountNumber: string) =>
    update((current) => removeAccount(current, accountNumber)),
  select: (accountNumber: string) =>
    update((current) => setActiveAccount(current, accountNumber)),
};

export interface UseKnownAccounts extends AccountsSnapshot {
  add: (accountNumber: string) => void;
  remove: (accountNumber: string) => void;
  select: (accountNumber: string) => void;
}

export function useKnownAccounts(): UseKnownAccounts {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...state, ...accountsStore };
}

/** Only used by tests, so one test's accounts cannot leak into the next. */
export function resetAccountsStoreForTests(): void {
  snapshot = null;
}
