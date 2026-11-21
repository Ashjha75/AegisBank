import type * as React from "react";
import { cn } from "@/lib/cn";
import { type MoneyInput, splitMoney } from "@/lib/format";

/**
 * Money, always through this component.
 * - Tabular digits so columns align; paise slightly quieter than rupees.
 * - `direction` decides colour: credits green, debits NEUTRAL (a normal payment is not an error),
 *   pending amber, failed red with a strike-through.
 * - The sign is text ("+", "−"), never colour alone.
 */
export type AmountDirection =
  | "credit"
  | "debit"
  | "pending"
  | "failed"
  | "neutral";

const tones: Record<AmountDirection, string> = {
  credit: "text-money-credit",
  debit: "text-money-debit",
  pending: "text-money-pending",
  failed: "text-money-failed line-through decoration-1",
  neutral: "text-foreground",
};

const signs: Record<AmountDirection, string> = {
  credit: "+",
  debit: "−",
  pending: "",
  failed: "",
  neutral: "",
};

export interface AmountProps
  extends Omit<React.ComponentProps<"span">, "children"> {
  value: MoneyInput;
  currency?: string;
  direction?: AmountDirection;
  size?: "sm" | "md" | "xl";
}

const sizes = {
  sm: "text-body-sm",
  md: "text-amount font-medium",
  xl: "text-amount-xl font-semibold",
};

export function Amount({
  value,
  currency,
  direction = "neutral",
  size = "md",
  className,
  ...props
}: AmountProps) {
  const { major, minor } = splitMoney(
    typeof value === "string" ? value.replace(/^-/, "") : Math.abs(value),
    {
      currency,
    },
  );
  return (
    <span
      data-slot="amount"
      className={cn(
        "numeric whitespace-nowrap",
        sizes[size],
        tones[direction],
        className,
      )}
      {...props}
    >
      {signs[direction]}
      {major}
      <span
        className={cn(
          size === "xl" ? "text-[0.6em] align-[0.35em]" : "opacity-70",
        )}
      >
        {minor}
      </span>
    </span>
  );
}
