import {
  ArrowLeftRight,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import type { AppNavSection } from "./app-shell";

/**
 * The customer banking menu, used by <BankingShell> and by the docs gallery.
 *
 * Only pages that exist are listed. Cards, security and settings are not here because there are
 * no such screens - a menu entry that leads nowhere is worse than no entry. Add one when the
 * page lands, and AppShell highlights it automatically.
 */
export const BANKING_NAV: AppNavSection[] = [
  {
    items: [
      { label: "Overview", href: "/app", Icon: LayoutDashboard },
      { label: "Transfer money", href: "/app/transfers", Icon: ArrowLeftRight },
      { label: "Add money", href: "/app/add-money", Icon: Plus },
      { label: "Transactions", href: "/app/transactions", Icon: ReceiptText },
      { label: "Accounts", href: "/app/accounts", Icon: Wallet },
    ],
  },
];
