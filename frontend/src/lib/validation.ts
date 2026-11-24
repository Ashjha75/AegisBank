import { z } from "zod";
import {
  isValidAccountNumber,
  normalizeAccountNumber,
} from "@/lib/accounts/known-accounts";

/**
 * Form rules that mirror the Bean Validation annotations on the backend records, so a value the
 * form accepts is a value the service accepts. The backend still validates everything - this
 * only saves the customer a round trip and a raw 400.
 *
 * Amounts stay strings from the input box all the way to the JSON body: parsing to a float and
 * back is how "1234.55" becomes "1234.5499999999999" (AGENTS.md: never do arithmetic on money
 * in the browser).
 */

/** Up to 13 digits before the point and 2 after - @Digits(integer = 13, fraction = 2). */
export const AMOUNT_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

/** "₹1,500.50" / " 1500 " / "1,500" as typed -> "1500.50". */
export function normalizeAmount(value: string): string {
  return value.replace(/[\s,₹]/g, "");
}

export function isValidAmount(value: string): boolean {
  const amount = normalizeAmount(value);
  return AMOUNT_PATTERN.test(amount) && Number(amount) > 0;
}

export const accountNumberField = z
  .string()
  .min(1, "Enter an account number")
  .refine(
    (value) => isValidAccountNumber(value),
    "An AegisBank account number is 12 digits",
  );

export const amountField = z
  .string()
  .min(1, "Enter an amount")
  .refine(
    (value) => AMOUNT_PATTERN.test(normalizeAmount(value)),
    "Enter an amount like 1500 or 1500.50",
  )
  .refine(
    (value) => Number(normalizeAmount(value)) > 0,
    "Amount must be more than zero",
  );

export const descriptionField = z
  .string()
  .max(255, "Keep the note under 255 characters")
  .optional();

/** @Pattern("^(\\+91)?[6-9]\\d{9}$") on CreateAccountRequest.phone. */
export const PHONE_PATTERN = /^(\+91)?[6-9]\d{9}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export const phoneField = z
  .string()
  .min(1, "Enter a phone number")
  .refine(
    (value) => PHONE_PATTERN.test(normalizePhone(value)),
    "Enter a 10-digit Indian mobile number",
  );

/** Account numbers are normalised only when they leave the form, so the typed value is kept. */
export { normalizeAccountNumber };
