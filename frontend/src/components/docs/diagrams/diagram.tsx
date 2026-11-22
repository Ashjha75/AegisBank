"use client";

import { createContext, type ReactNode, useContext, useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Hand-drawn system diagrams for the docs: pure SVG + CSS, no diagram library (Mermaid is not used -
 * see AGENTS.md). Framed card with a mono header, rounded boxes, orthogonal arrows; the primary path
 * pulses with a slow dash drift (off under prefers-reduced-motion).
 *
 *   <Diagram title="Request path" tag="frontend → gateway" width={640} height={140}>
 *     <Box x={10} y={50} w={100} h={36} label="Browser" />
 *     <Box x={160} y={50} w={130} h={36} label="Next.js" sub="BFF proxy" tone="accent" />
 *     <Arrow d="M110 68 H154" flow label="HTTPS" at={[132, 60]} />
 *   </Diagram>
 *
 * Coordinates are in the viewBox (width × height). On narrow screens the diagram keeps a readable
 * minimum width and scrolls sideways instead of shrinking the text.
 */

const MarkerContext = createContext<string>("dg");

export function Diagram({
  title,
  tag,
  caption,
  width,
  height,
  minWidth = 560,
  children,
  className,
}: {
  title: string;
  tag?: string;
  caption?: ReactNode;
  width: number;
  height: number;
  /** Below this many CSS pixels the diagram scrolls horizontally. */
  minWidth?: number;
  children: ReactNode;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <figure className={cn("dg not-prose", className)}>
      <div className="dg-head">
        <span>{title}</span>
        {tag && <span className="dg-tag">{tag}</span>}
      </div>
      <div className="dg-body">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={typeof caption === "string" ? caption : title}
          style={{ width: `max(100%, ${minWidth}px)` }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id={`${id}-arrow`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0 L7 3.5 L0 7 z" className="dg-arrowhead" />
            </marker>
            <marker
              id={`${id}-arrow-flow`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0 L7 3.5 L0 7 z" className="dg-arrowhead-flow" />
            </marker>
          </defs>
          <MarkerContext.Provider value={id}>{children}</MarkerContext.Provider>
        </svg>
      </div>
      {caption && <figcaption className="dg-caption">{caption}</figcaption>}
    </figure>
  );
}

export type BoxTone =
  | "default"
  | "accent"
  | "success"
  | "danger"
  | "warning"
  | "muted";

/** A component, service or state. `label` is shown uppercase; `sub` is a quieter second line. */
export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  tone = "default",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  tone?: BoxTone;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g className={cn("dg-box", `dg-${tone}`)}>
      <rect x={x} y={y} width={w} height={h} rx={7} />
      <text className="dg-label" x={cx} y={sub ? cy - 3 : cy + 3.5}>
        {label}
      </text>
      {sub && (
        <text className="dg-sub" x={cx} y={cy + 10}>
          {sub}
        </text>
      )}
    </g>
  );
}

/**
 * A connection. `d` is an SVG path (use H/V segments for right angles). `flow` = the primary path
 * (accent colour, animated); `dashed` = optional / async / planned; `cut` = a failure branch.
 * `label` is drawn at `at` ([x, y], text centre).
 */
export function Arrow({
  d,
  flow = false,
  dashed = false,
  cut = false,
  label,
  at,
  anchor = "middle",
  head = true,
}: {
  d: string;
  flow?: boolean;
  dashed?: boolean;
  cut?: boolean;
  label?: string;
  at?: [number, number];
  anchor?: "start" | "middle" | "end";
  head?: boolean;
}) {
  const id = useContext(MarkerContext);
  return (
    <g>
      <path
        d={d}
        className={cn(
          "dg-edge",
          flow && "dg-flow",
          dashed && "dg-dashed",
          cut && "dg-cut",
        )}
        markerEnd={head ? `url(#${id}-arrow${flow ? "-flow" : ""})` : undefined}
      />
      {label && at && (
        <text
          className={cn("dg-edge-label", cut && "dg-edge-label-cut")}
          x={at[0]}
          y={at[1]}
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** A free text note inside a diagram (mono, small). */
export function Note({
  x,
  y,
  children,
  anchor = "start",
}: {
  x: number;
  y: number;
  children: string;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text className="dg-note" x={x} y={y} textAnchor={anchor}>
      {children}
    </text>
  );
}
