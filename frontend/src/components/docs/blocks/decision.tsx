import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Header of an Architecture Decision Record (ADR, Michael Nygard's format). Put it at the top of a
 * page in content/docs/decisions, then write the sections Context / Decision / Consequences.
 *
 *   <Decision id="ADR-001" status="accepted" date="2026-11-22" deciders="Backend team" />
 */
const STATUS: Record<
  "proposed" | "accepted" | "superseded" | "deprecated" | "rejected",
  string
> = {
  proposed: "bg-[var(--info-subtle)] text-[var(--info-foreground)]",
  accepted: "bg-[var(--success-subtle)] text-[var(--success-foreground)]",
  superseded: "bg-[var(--warning-subtle)] text-[var(--warning-foreground)]",
  deprecated: "bg-[var(--warning-subtle)] text-[var(--warning-foreground)]",
  rejected: "bg-[var(--danger-subtle)] text-[var(--danger-foreground)]",
};

export function Decision({
  id,
  status,
  date,
  deciders,
  supersededBy,
}: {
  id: string;
  status: keyof typeof STATUS;
  date: string;
  deciders?: ReactNode;
  supersededBy?: ReactNode;
}) {
  const rows: [string, ReactNode][] = [
    [
      "Record",
      <span key="id" className="font-mono">
        {id}
      </span>,
    ],
    [
      "Status",
      <span
        key="s"
        className={cn(
          "inline-flex rounded-full px-2.5 py-0.5 font-semibold text-[0.8125rem] capitalize",
          STATUS[status],
        )}
      >
        {status}
      </span>,
    ],
    [
      "Date",
      <span key="d" className="font-mono">
        {date}
      </span>,
    ],
  ];
  if (deciders) rows.push(["Deciders", deciders]);
  if (supersededBy) rows.push(["Superseded by", supersededBy]);
  return (
    <dl className="not-prose my-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-[var(--border)] sm:grid-cols-4">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 bg-[var(--surface)] px-5 py-4">
          <dt className="font-medium text-[0.75rem] text-[var(--muted-foreground)] uppercase tracking-[0.08em]">
            {label}
          </dt>
          <dd className="text-[0.9375rem] text-[var(--foreground)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
