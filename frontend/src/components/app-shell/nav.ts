import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { AppNavSection } from "./app-shell";

/**
 * The customer banking menu. Routes don't exist yet (customer screens come after the backend);
 * when a page is built, it lives at the href below and AppShell highlights it automatically.
 */
export const BANKING_NAV: AppNavSection[] = [
  {
    items: [
      { label: "Overview", href: "/app", Icon: LayoutDashboard },
      { label: "Accounts", href: "/app/accounts", Icon: Wallet },
      { label: "Transfers", href: "/app/transfers", Icon: ArrowLeftRight },
      { label: "Transactions", href: "/app/transactions", Icon: ReceiptText },
      { label: "Cards", href: "/app/cards", Icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Security", href: "/app/security", Icon: ShieldCheck },
      { label: "Settings", href: "/app/settings", Icon: Settings },
    ],
  },
];
