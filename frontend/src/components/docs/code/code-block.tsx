"use client";

import { ArrowsOutSimple, X } from "@phosphor-icons/react";
import {
  CodeBlock,
  type CodeBlockProps,
  Pre,
} from "fumadocs-ui/components/codeblock";
import { type ComponentProps, useEffect, useState } from "react";

/**
 * Every ``` code fence in the docs renders through this: Fumadocs' CodeBlock (Shiki highlighting,
 * copy button, title bar, tabs) plus line numbers by default and an expand-to-full-screen button.
 * Turn line numbers off for one block with ```bash noLineNumbers.
 */
export function DocsCodeBlock({
  children,
  ...props
}: ComponentProps<"pre"> &
  Partial<CodeBlockProps> & { noLineNumbers?: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const { noLineNumbers, ...rest } = props as typeof props & {
    noLineNumbers?: unknown;
  };

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  return (
    <>
      {expanded && (
        <div
          className="docs-code-backdrop"
          aria-hidden="true"
          onClick={() => setExpanded(false)}
        />
      )}
      <CodeBlock
        {...(rest as CodeBlockProps)}
        data-line-numbers={
          noLineNumbers ? undefined : (rest["data-line-numbers"] ?? true)
        }
        data-expanded={expanded ? "true" : undefined}
        Actions={({ className, children: copyButton }) => (
          <div className={`${className ?? ""} flex items-center gap-0.5`}>
            {copyButton}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={
                expanded ? "Exit full screen" : "Expand code to full screen"
              }
              className="inline-flex size-7 cursor-pointer items-center justify-center"
            >
              {expanded ? <X size={15} /> : <ArrowsOutSimple size={15} />}
            </button>
          </div>
        )}
      >
        <Pre>{children}</Pre>
      </CodeBlock>
    </>
  );
}
