"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useState } from "react";

/** Small icon button that copies a string (an endpoint path, an ID) and confirms with a tick. */
export function CopyText({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked - nothing to do */
        }
      }}
      className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--foreground)]"
    >
      {copied ? <Check size={15} weight="bold" /> : <Copy size={15} />}
    </button>
  );
}
