import type { TransactionStatus } from "@/components/ui/transaction-status";

/** Example rows for the docs previews. Static, clearly fake data. */
export type SampleTransaction = {
  id: string;
  date: string;
  counterparty: string;
  account: string;
  reference: string;
  direction: "credit" | "debit";
  amount: string;
  status: TransactionStatus;
};

const PEOPLE: [string, string, "credit" | "debit"][] = [
  ["Priya Sharma", "Rent", "debit"],
  ["Acme Payroll", "Salary", "credit"],
  ["Rahul Verma", "Laptop", "debit"],
  ["Electricity Board", "Bill", "debit"],
  ["Neha Gupta", "Dinner split", "credit"],
  ["Online merchant", "Card online", "debit"],
  ["Arjun Mehta", "Trip", "debit"],
  ["Mutual fund SIP", "SIP", "debit"],
  ["Savings interest", "Interest", "credit"],
  ["Kavya Iyer", "Gift", "credit"],
  ["Broadband Co", "Internet", "debit"],
  ["Vikram Singh", "Loan repayment", "credit"],
];

const STATUSES: TransactionStatus[] = [
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "PENDING_VERIFICATION",
  "PROCESSING",
  "FAILED",
  "FLAGGED",
  "PENDING",
];

const AMOUNTS = [
  "25000.00",
  "142500.00",
  "68000.00",
  "3240.50",
  "1850.00",
  "92000.00",
  "12000.00",
  "10000.00",
  "412.37",
  "5000.00",
  "999.00",
  "30000.00",
];

/** Item at position i, wrapping around (arrays here are never empty). */
function pick<T>(list: readonly T[], i: number): T {
  const item = list[i % list.length];
  if (item === undefined) throw new Error("empty sample list");
  return item;
}

/** 57 deterministic example transactions (enough to see paging at 10, 25 and 50 per page). */
export const SAMPLE_TRANSACTIONS: SampleTransaction[] = Array.from(
  { length: 57 },
  (_, i) => {
    const [counterparty, reference, direction] = pick(PEOPLE, i);
    const day = 28 - Math.floor(i / 2);
    const month = day > 0 ? 11 : 10;
    const dom = day > 0 ? day : 31 + day;
    const hex = ((i + 1) * 2654435761) % 0xffffffff;
    const id = hex.toString(16).toUpperCase().padStart(8, "0");
    return {
      id: `${id.slice(0, 4)}-${id.slice(4, 8)}`,
      date: `2026-${String(month).padStart(2, "0")}-${String(dom).padStart(2, "0")}`,
      counterparty,
      account: i % 3 === 0 ? "Current •••• 7710" : "Savings •••• 4821",
      reference: `${reference} ${String((i % 12) + 1).padStart(2, "0")}`,
      direction,
      amount: pick(AMOUNTS, i),
      status: pick(STATUSES, i),
    };
  },
);
