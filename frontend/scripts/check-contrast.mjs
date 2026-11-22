#!/usr/bin/env node
/**
 * WCAG contrast check for the design tokens.
 *
 * Reads src/styles/tokens.css (the site theme) and src/styles/docs-theme.css (the docs reading theme,
 * which overrides page surfaces and text), resolves every semantic token, and checks each
 * text/background pair below in both. Fails (exit 1) if any pair is under its minimum:
 *   4.5 = normal text (WCAG AA), 3.0 = large text, icons and UI boundaries (WCAG AA 1.4.11).
 *
 * Run: pnpm tokens:check
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TOKENS = fileURLToPath(
  new URL("../src/styles/tokens.css", import.meta.url),
);
const DOCS_THEME = fileURLToPath(
  new URL("../src/styles/docs-theme.css", import.meta.url),
);

/** [foreground, background, minimum ratio, what it is] */
const PAIRS = [
  ["foreground", "background", 4.5, "body text on page"],
  ["foreground", "surface", 4.5, "body text on card"],
  ["foreground", "surface-subtle", 4.5, "text in sidebar / table header"],
  ["muted-foreground", "background", 4.5, "secondary text on page"],
  ["muted-foreground", "surface", 4.5, "secondary text on card"],
  ["muted-foreground", "surface-subtle", 4.5, "secondary text on table header"],
  ["subtle-foreground", "surface", 3, "captions / placeholders"],
  ["subtle-foreground", "background", 3, "captions on page"],
  ["primary-foreground", "primary", 4.5, "primary button"],
  ["primary-foreground", "primary-hover", 4.5, "primary button hover"],
  ["brand", "surface", 4.5, "link on card"],
  ["brand", "background", 4.5, "link on page"],
  ["brand-foreground", "brand", 4.5, "brand button"],
  ["brand-foreground", "brand-hover", 4.5, "brand button hover"],
  ["brand", "brand-subtle", 4.5, "selected item text"],
  ["secondary-foreground", "secondary", 4.5, "secondary fill"],
  ["accent-foreground", "accent", 4.5, "hovered menu item"],
  ["success-foreground", "success-subtle", 4.5, "success badge / alert"],
  ["warning-foreground", "warning-subtle", 4.5, "warning badge / alert"],
  ["danger-foreground", "danger-subtle", 4.5, "error badge / alert"],
  ["info-foreground", "info-subtle", 4.5, "info badge / alert"],
  ["danger-on", "danger", 4.5, "destructive button"],
  ["money-credit", "surface", 4.5, "credit amount"],
  ["money-debit", "surface", 4.5, "debit amount"],
  ["money-pending", "surface", 4.5, "pending amount"],
  ["money-failed", "surface", 4.5, "failed amount"],
  ["ring", "background", 3, "focus ring on page"],
  ["ring", "surface", 3, "focus ring on card"],
  ["input", "surface", 3, "input border (non-text UI)"],
];

// ---------------------------------------------------------------- parse the CSS files

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");

function block(css, selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No "${selector} {" block found`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start, i);
  }
  throw new Error(`Unclosed block ${selector}`);
}

function declarations(text) {
  const vars = {};
  // Collapse whitespace: the formatter may wrap long values over several lines.
  for (const [, name, value] of text.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g))
    vars[name] = value
      .replace(/\s+/g, " ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .trim();
  return vars;
}

const rootOf = (file) =>
  declarations(block(stripComments(readFileSync(file, "utf8")), ":root"));

const site = rootOf(TOKENS);
const docs = { ...site, ...rootOf(DOCS_THEME) };

function resolve(vars, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Circular token: ${name}`);
  seen.add(name);
  const value = vars[name];
  if (value === undefined) throw new Error(`Unknown token: --${name}`);
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  return ref ? resolve(vars, ref[1], seen) : value;
}

// ---------------------------------------------------------------- colour maths (OKLCH -> sRGB -> luminance)

function oklchToLinearSrgb(value) {
  const m = value.match(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/,
  );
  if (!m) throw new Error(`Not an opaque oklch() colour: ${value}`);
  if (m[4] !== undefined && Number(m[4]) < 1)
    throw new Error(`Translucent colour cannot be checked: ${value}`);
  const [L, C, H] = [
    Number(m[1]),
    Number(m[2]),
    (Number(m[3]) * Math.PI) / 180,
  ];
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x) => Math.min(1, Math.max(0, x));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
  ];
}

function luminance(value) {
  const [r, g, b] = oklchToLinearSrgb(value);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------------------------------------------------------------- report

let failures = 0;
for (const [theme, vars] of [
  ["site", site],
  ["docs (paper)", docs],
]) {
  console.log(`\n${theme} theme`);
  for (const [fg, bg, min, label] of PAIRS) {
    const ratio = contrast(resolve(vars, fg), resolve(vars, bg));
    const ok = ratio >= min;
    if (!ok) failures++;
    console.log(
      `  ${ok ? "ok  " : "FAIL"} ${ratio.toFixed(2).padStart(5)} >= ${min.toFixed(1)}  ${`${fg} on ${bg}`.padEnd(44)} ${label}`,
    );
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} pair(s) below WCAG AA. Adjust src/styles/tokens.css or docs-theme.css.`,
  );
  process.exit(1);
}
console.log("\nAll pairs meet WCAG AA.");
