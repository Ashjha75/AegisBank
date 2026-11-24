/**
 * Which accounts this browser knows about, and which one the app is currently showing.
 *
 * There is no authentication yet (see ../../../PENDING.md item 3), so the UI cannot ask
 * "whose accounts are these?". Instead the customer adds an account number once and it is
 * remembered in localStorage - exactly like a demo wallet, and honest about what it is.
 * Nothing secret is stored: an account number is all the backend asks for today.
 *
 * Everything here is pure except `readStored` / `writeStored`, so the rules are unit-tested.
 */

export const ACCOUNT_NUMBER_PATTERN = /^[1-9]\d{11}$/;
export const STORAGE_KEY = "aegisbank.accounts.v1";
/** Keeping the switcher usable, and the dashboard honest about being a demo. */
export const MAX_ACCOUNTS = 10;

export interface KnownAccounts {
  /** 12-digit account numbers, most recently added first. */
  accounts: string[];
  /** The account every screen is about. Always one of `accounts`, or null when empty. */
  active: string | null;
}

export const EMPTY_ACCOUNTS: KnownAccounts = { accounts: [], active: null };

/** Digits only - people paste "7588 8571 7853" or "7588-8571-7853". */
export function normalizeAccountNumber(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export function isValidAccountNumber(value: string): boolean {
  return ACCOUNT_NUMBER_PATTERN.test(normalizeAccountNumber(value));
}

/**
 * Adds an account and makes it active. Already-known numbers are not duplicated, they are
 * just selected again. Invalid numbers are refused (the caller validates before calling).
 */
export function addAccount(
  state: KnownAccounts,
  accountNumber: string,
): KnownAccounts {
  const number = normalizeAccountNumber(accountNumber);
  if (!isValidAccountNumber(number)) return state;
  if (state.accounts.includes(number))
    return { accounts: state.accounts, active: number };
  return {
    accounts: [number, ...state.accounts].slice(0, MAX_ACCOUNTS),
    active: number,
  };
}

/** Removes an account; if it was the active one, the next account takes over. */
export function removeAccount(
  state: KnownAccounts,
  accountNumber: string,
): KnownAccounts {
  const number = normalizeAccountNumber(accountNumber);
  const accounts = state.accounts.filter((a) => a !== number);
  if (accounts.length === state.accounts.length) return state;
  return {
    accounts,
    active: state.active === number ? (accounts[0] ?? null) : state.active,
  };
}

/** Switching to an account the browser doesn't know about is ignored. */
export function setActiveAccount(
  state: KnownAccounts,
  accountNumber: string,
): KnownAccounts {
  const number = normalizeAccountNumber(accountNumber);
  if (!state.accounts.includes(number)) return state;
  return { accounts: state.accounts, active: number };
}

/**
 * Reads whatever is in storage and returns something usable. Anything unexpected - old format,
 * hand-edited JSON, an active account that is not in the list - is repaired, never thrown.
 */
export function parseStored(raw: string | null): KnownAccounts {
  if (!raw) return EMPTY_ACCOUNTS;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return EMPTY_ACCOUNTS;
  }
  if (typeof value !== "object" || value === null) return EMPTY_ACCOUNTS;

  const { accounts, active } = value as Record<string, unknown>;
  const cleaned = Array.isArray(accounts)
    ? Array.from(
        new Set(
          accounts
            .filter((a): a is string => typeof a === "string")
            .map(normalizeAccountNumber)
            .filter(isValidAccountNumber),
        ),
      ).slice(0, MAX_ACCOUNTS)
    : [];

  const activeNumber =
    typeof active === "string" ? normalizeAccountNumber(active) : null;
  return {
    accounts: cleaned,
    active:
      activeNumber && cleaned.includes(activeNumber)
        ? activeNumber
        : (cleaned[0] ?? null),
  };
}

export function serialize(state: KnownAccounts): string {
  return JSON.stringify(state);
}

/** localStorage is unavailable in private mode and during SSR - never let that break a render. */
export function readStored(): KnownAccounts {
  if (typeof window === "undefined") return EMPTY_ACCOUNTS;
  try {
    return parseStored(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_ACCOUNTS;
  }
}

export function writeStored(state: KnownAccounts): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(state));
  } catch {
    // Storage full or blocked: the app still works for this session.
  }
}
