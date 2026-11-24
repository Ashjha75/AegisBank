import type { Metadata } from "next";

/**
 * The signed-in-style banking area. It sits inside the (site) group, so it already has
 * styles/site.css and AppProviders (TanStack Query, toasts) from the layout above, and the
 * accounts this browser knows about come from a store rather than a provider
 * (see lib/accounts/accounts-store.ts).
 *
 * There is no authentication yet, so nothing here is indexed: the pages are about whichever
 * account number the browser has stored, and that is not public content.
 */
export const metadata: Metadata = {
  title: { default: "Your account", template: "%s · AegisBank" },
  robots: { index: false, follow: false },
};

export default function BankingAreaLayout({ children }: LayoutProps<"/app">) {
  return children;
}
