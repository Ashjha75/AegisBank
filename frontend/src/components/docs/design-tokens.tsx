/**
 * Live views of the design tokens for the design-system docs page. They read the real CSS variables,
 * so the page can never drift from src/styles/tokens.css.
 */

type Swatch = { token: string; use: string; text?: string };

const groups: { title: string; swatches: Swatch[] }[] = [
  {
    title: "Surfaces",
    swatches: [
      { token: "background", use: "Page (white on the site, paper in docs)" },
      { token: "surface", use: "Cards, tables, inputs" },
      { token: "surface-subtle", use: "Table header, hover row" },
      { token: "surface-sunken", use: "Skeletons, wells" },
      { token: "border", use: "Dividers, card borders" },
      { token: "input", use: "Form field borders" },
    ],
  },
  {
    title: "Brand and interaction",
    swatches: [
      {
        token: "primary",
        use: "Ink: primary buttons, text",
        text: "primary-foreground",
      },
      {
        token: "brand",
        use: "Links, focus, selected (deep green)",
        text: "brand-foreground",
      },
      { token: "brand-subtle", use: "Selected background", text: "brand" },
      {
        token: "accent",
        use: "Hovered item (shadcn)",
        text: "accent-foreground",
      },
      {
        token: "secondary",
        use: "Secondary buttons",
        text: "secondary-foreground",
      },
    ],
  },
  {
    title: "Text",
    swatches: [
      { token: "foreground", use: "Body text, headings" },
      { token: "muted-foreground", use: "Secondary text" },
      { token: "subtle-foreground", use: "Captions, placeholders" },
    ],
  },
  {
    title: "Status",
    swatches: [
      {
        token: "success-subtle",
        use: "Success / positive",
        text: "success-foreground",
      },
      { token: "warning-subtle", use: "Pending", text: "warning-foreground" },
      {
        token: "danger-subtle",
        use: "Failure / error",
        text: "danger-foreground",
      },
      { token: "info-subtle", use: "Information", text: "info-foreground" },
    ],
  },
  {
    title: "Money",
    swatches: [
      { token: "money-credit", use: "Money in" },
      { token: "money-debit", use: "Money out - neutral on purpose" },
      { token: "money-pending", use: "Not settled yet" },
      { token: "money-failed", use: "Did not happen" },
    ],
  },
];

export function ColorTokens() {
  return (
    <div className="not-prose my-6 grid gap-8">
      {groups.map((group) => (
        <section key={group.title} className="grid gap-3">
          <h4 className="font-semibold text-foreground text-sm">
            {group.title}
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.swatches.map((swatch) => (
              <div
                key={swatch.token}
                className="overflow-hidden rounded-lg border border-border bg-surface"
              >
                <div
                  className="flex h-16 items-end border-border border-b p-2 font-medium text-xs"
                  style={{
                    background: `var(--${swatch.token})`,
                    color: swatch.text ? `var(--${swatch.text})` : undefined,
                  }}
                >
                  {swatch.text ? "Aa 1,250.00" : null}
                </div>
                <div className="grid gap-0.5 p-2.5">
                  <code className="font-mono text-[11px] text-foreground">
                    --{swatch.token}
                  </code>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {swatch.use}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const typeScale: {
  cls: string;
  name: string;
  spec: string;
  font: string;
  sample: string;
}[] = [
  {
    cls: "text-display",
    name: "display",
    spec: "48 / 1.08",
    font: "font-display font-medium",
    sample: "Banking that checks",
  },
  {
    cls: "text-h1",
    name: "h1",
    spec: "32 / 1.2",
    font: "font-display font-medium",
    sample: "Accounts overview",
  },
  {
    cls: "text-h2",
    name: "h2",
    spec: "24 / 1.3",
    font: "font-display font-medium",
    sample: "Recent transfers",
  },
  {
    cls: "text-h3",
    name: "h3",
    spec: "20 / 1.4",
    font: "font-display font-medium",
    sample: "Confirm transfer",
  },
  {
    cls: "text-h4",
    name: "h4",
    spec: "17 / 1.45",
    font: "font-display font-semibold",
    sample: "Savings account",
  },
  {
    cls: "text-body-lg",
    name: "body-lg",
    spec: "17 / 1.6",
    font: "font-sans",
    sample: "Lead paragraph text.",
  },
  {
    cls: "text-body",
    name: "body",
    spec: "15 / 1.6",
    font: "font-sans",
    sample: "Default interface and body text.",
  },
  {
    cls: "text-body-sm",
    name: "body-sm",
    spec: "14 / 1.5",
    font: "font-sans",
    sample: "Tables and dense lists.",
  },
  {
    cls: "text-label",
    name: "label",
    spec: "13 / 1.4",
    font: "font-sans font-medium",
    sample: "Account number",
  },
  {
    cls: "text-caption",
    name: "caption",
    spec: "12 / 1.4",
    font: "font-sans",
    sample: "Updated 2 minutes ago",
  },
  {
    cls: "text-overline uppercase",
    name: "overline",
    spec: "11 / 1.3 · +0.08em",
    font: "font-sans font-semibold",
    sample: "Available balance",
  },
  {
    cls: "text-amount-xl",
    name: "amount-xl",
    spec: "36 / 1.1 · tabular",
    font: "font-sans font-semibold numeric",
    sample: "₹1,25,000.00",
  },
  {
    cls: "text-amount",
    name: "amount",
    spec: "16 / 1.4 · tabular",
    font: "font-sans font-medium numeric",
    sample: "₹25,000.00",
  },
  {
    cls: "text-body-sm",
    name: "mono",
    spec: "14 · identifiers only",
    font: "font-mono",
    sample: "TXN 7F3A-92C1-0B4E",
  },
];

export function TypeScale() {
  return (
    <div className="not-prose my-6 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {typeScale.map((row) => (
        <div
          key={row.name}
          className="grid items-baseline gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4"
        >
          <div className="grid">
            <code className="font-mono text-[11px] text-foreground">
              {row.name}
            </code>
            <span className="text-[11px] text-muted-foreground">
              {row.spec}
            </span>
          </div>
          <span className={`${row.cls} ${row.font} truncate text-foreground`}>
            {row.sample}
          </span>
        </div>
      ))}
    </div>
  );
}
