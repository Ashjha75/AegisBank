import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  ChatsCircle,
  CheckCircle,
  Info,
  Warning,
  WarningOctagon,
} from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Highlighted note in a docs page. Same API as Fumadocs' Callout, so existing pages keep working.
 *
 *   <Callout type="tip" title="Tip">You can use <Ph name="Lightning" /> shortcuts here.</Callout>
 *
 * Types: tip (default) · info · warn · error · success  (aliases: idea = tip, warning = warn, danger = error)
 */
type CalloutType =
  | "tip"
  | "idea"
  | "info"
  | "warn"
  | "warning"
  | "error"
  | "danger"
  | "success";

const STYLES: Record<
  "tip" | "info" | "warn" | "error" | "success",
  { Icon: PhosphorIcon; label: string; box: string; accent: string }
> = {
  tip: {
    Icon: ChatsCircle,
    label: "Tip",
    box: "bg-[var(--surface)]",
    accent: "text-[var(--brand)]",
  },
  info: {
    Icon: Info,
    label: "Note",
    box: "bg-[var(--surface)]",
    accent: "text-[var(--info-foreground)]",
  },
  warn: {
    Icon: Warning,
    label: "Careful",
    box: "bg-[var(--warning-subtle)]",
    accent: "text-[var(--warning-foreground)]",
  },
  error: {
    Icon: WarningOctagon,
    label: "Important",
    box: "bg-[var(--danger-subtle)]",
    accent: "text-[var(--danger-foreground)]",
  },
  success: {
    Icon: CheckCircle,
    label: "Good to know",
    box: "bg-[var(--success-subtle)]",
    accent: "text-[var(--success-foreground)]",
  },
};

function normalise(type: CalloutType) {
  if (type === "idea") return "tip";
  if (type === "warning") return "warn";
  if (type === "danger") return "error";
  return type;
}

export function Callout({
  type = "tip",
  title,
  children,
  className,
}: {
  type?: CalloutType;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const style = STYLES[normalise(type)];
  const { Icon } = style;
  return (
    <aside
      className={cn(
        "not-prose my-6 grid gap-2.5 rounded-[var(--radius-card)] px-7 py-6",
        style.box,
        className,
      )}
    >
      <p
        className={cn(
          "flex items-center gap-3 font-medium text-[1.25rem] tracking-[-0.01em]",
          style.accent,
        )}
      >
        <Icon size={26} weight="duotone" aria-hidden />
        {title ?? style.label}
      </p>
      {children && (
        <div className="text-[1rem] text-[var(--foreground)] leading-relaxed [&_a]:font-semibold [&_a]:text-[var(--brand)] [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-4 [&_code]:rounded-md [&_code]:bg-[var(--background)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.86em] [&_p+p]:mt-2">
          {children}
        </div>
      )}
    </aside>
  );
}
