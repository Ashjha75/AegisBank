import { Inter, JetBrains_Mono, Manrope } from "next/font/google";

/*
 * The three AegisBank fonts. next/font downloads them at build time and serves them from our own
 * origin (no request to Google at runtime). Each one is exposed as a CSS variable that
 * src/styles/theme.css turns into a Tailwind family:
 *
 *   font-display  Manrope         page titles, section headings, account overview headings (600/700)
 *   font-sans     Inter           everything else in the UI, including money (with `numeric`)
 *   font-mono     JetBrains Mono  technical identifiers only: transaction IDs, references
 *
 * Don't add fonts or swap them per page. See docs/plan.md > Typography.
 */

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** Put on <html> in every root layout. */
export const fontVariables = `${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`;
