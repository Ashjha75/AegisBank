import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

/*
 * The AegisBank typefaces. next/font downloads them at build time and serves them from our own
 * origin (no request to Google at runtime). Each is exposed as a CSS variable that
 * src/styles/theme.css turns into a Tailwind family:
 *
 *   font-sans / font-display  IBM Plex Sans  everything: headings (500), UI (400/500/600), money (`numeric`)
 *   font-mono                 IBM Plex Mono  technical identifiers and code: references, IDs, snippets
 *
 * Don't add fonts or swap them per page. See docs/plan.md > Typography.
 */

export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

/** Put on <html> in every root layout. */
export const fontVariables = `${plexSans.variable} ${plexMono.variable}`;
