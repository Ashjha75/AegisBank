"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A live example with its source: pill tabs "Live example" / "Code" (the reference docs pattern).
 *
 *   <Example code={`<Button>Send money</Button>`}>
 *     <Button>Send money</Button>
 *   </Example>
 *
 * The preview renders on the real white site theme. `lang` defaults to tsx.
 */
export function Example({
  code,
  lang = "tsx",
  title,
  children,
  defaultTab = "preview",
}: {
  code: string;
  lang?: string;
  title?: string;
  children: ReactNode;
  defaultTab?: "preview" | "code";
}) {
  const [tab, setTab] = useState(defaultTab);
  const tabs = [
    { id: "preview", label: "Live example" },
    { id: "code", label: "Code" },
  ] as const;
  return (
    <div className="not-prose my-7 grid gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={title ? `${title} example` : "Example"}
          className="inline-flex overflow-hidden rounded-full border border-[var(--border-strong)]"
        >
          {tabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              data-state={tab === t.id ? "active" : "inactive"}
              onClick={() => setTab(t.id)}
              className={cn(
                "cursor-pointer px-[1.125rem] py-2 font-medium text-[0.9375rem] text-[var(--foreground)] transition-colors",
                i > 0 && "border-[var(--border-strong)] border-l",
                tab === t.id
                  ? "bg-[var(--surface-sunken)]"
                  : "hover:bg-[var(--surface)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {title && (
          <span className="text-[0.875rem] text-[var(--muted-foreground)]">
            {title}
          </span>
        )}
      </div>
      {tab === "preview" ? (
        <div
          role="tabpanel"
          className="site-theme flex min-h-32 flex-wrap items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] p-8"
        >
          {children}
        </div>
      ) : (
        <div role="tabpanel" className="docs-example-code">
          <DynamicCodeBlock
            lang={lang}
            code={code.trim()}
            options={{ themes: { light: "tokyo-night", dark: "tokyo-night" } }}
          />
        </div>
      )}
    </div>
  );
}
