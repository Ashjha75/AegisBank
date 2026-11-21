/**
 * Display formatting for money, dates and identifiers. Pure functions - safe on server and client.
 *
 * Money arrives from the backend as a decimal (Java BigDecimal serialised as a JSON number or string).
 * We never do arithmetic on it in the browser; we only format it.
 */

export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_LOCALE = "en-IN";

const moneyFormatters = new Map<string, Intl.NumberFormat>();

function moneyFormatter(currency: string, locale: string): Intl.NumberFormat {
  const key = `${locale}|${currency}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    moneyFormatters.set(key, formatter);
  }
  return formatter;
}

export type MoneyInput = number | string;

/** "₹1,25,000.00". Strings are parsed without losing the two decimals the backend sends. */
export function formatMoney(
  amount: MoneyInput,
  {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
  }: { currency?: string; locale?: string } = {},
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";
  return moneyFormatter(currency, locale).format(value);
}

/** Splits a formatted amount so the UI can style the minor units (".00") quieter than the major. */
export function splitMoney(
  amount: MoneyInput,
  options?: { currency?: string; locale?: string },
): { major: string; minor: string } {
  const formatted = formatMoney(amount, options);
  const index = formatted.lastIndexOf(".");
  if (index < 0) return { major: formatted, minor: "" };
  return { major: formatted.slice(0, index), minor: formatted.slice(index) };
}

/** 21 Nov 2026, 14:05 - in the user's time zone. */
export function formatDateTime(
  value: string | Date,
  locale = DEFAULT_LOCALE,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** "1234 5678 9012" - groups of four, easier to read aloud and compare. */
export function formatAccountNumber(accountNumber: string): string {
  return accountNumber.replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 ");
}

/** "•••• 9012" - for lists where the full number is not needed. */
export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\s+/g, "");
  return digits.length <= 4 ? digits : `•••• ${digits.slice(-4)}`;
}
