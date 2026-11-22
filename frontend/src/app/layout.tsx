import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";

/*
 * The one root layout. It only sets up <html>/<body> and fonts; each area brings its own styles:
 *   (site)/layout.tsx           customer site  -> styles/site.css (strict design tokens)
 *   v1/admin/docs-ui/layout.tsx docs UI        -> styles/docs.css (tokens + Fumadocs)
 */
export const metadata: Metadata = {
  title: { default: "AegisBank", template: "%s · AegisBank" },
  description:
    "Digital banking with real-time fraud screening on every transfer.",
  applicationName: "AegisBank",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
