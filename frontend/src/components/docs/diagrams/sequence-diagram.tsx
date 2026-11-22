"use client";

import { cn } from "@/lib/cn";
import { Arrow, Box, Diagram } from "./diagram";

/**
 * Request/response sequence, laid out automatically: participants across the top, one row per step.
 * Calls are solid and animated; replies are dashed; notes span the participants they mention.
 *
 *   <SequenceDiagram
 *     title="Read an account" tag="account-service"
 *     participants={[{ id: "b", label: "Browser" }, { id: "g", label: "Gateway", accent: true }]}
 *     steps={[
 *       { from: "b", to: "g", label: "GET /api/v1/accounts/{n}" },
 *       { note: "rate limit per IP (Redis)", over: ["g"] },
 *       { from: "g", to: "b", label: "200 AccountResponse", reply: true },
 *     ]}
 *   />
 *
 * A step with from === to is an internal action of that participant ("save PENDING").
 * Keep labels short (about 40 characters); they are not wrapped.
 */
export type SequenceParticipant = {
  id: string;
  label: string;
  sub?: string;
  accent?: boolean;
};

export type SequenceStep =
  | { from: string; to: string; label: string; reply?: boolean; fail?: boolean }
  | { note: string; over: string[] };

const CHAR = 5.7; // approx. width of one 9.5px mono character
const BOX_W = 128;
const BOX_H = 40;
const TOP = 14;
const ROW = 34;
const PAD = 16;

export function SequenceDiagram({
  title,
  tag,
  caption,
  participants,
  steps,
  numbered = true,
}: {
  title: string;
  tag?: string;
  caption?: string;
  participants: SequenceParticipant[];
  steps: SequenceStep[];
  numbered?: boolean;
}) {
  const index = new Map(participants.map((p, i) => [p.id, i]));
  const col = (id: string) => {
    const i = index.get(id);
    if (i === undefined)
      throw new Error(`SequenceDiagram: unknown participant "${id}"`);
    return i;
  };

  // Column spacing: wide enough for the longest label between two neighbouring columns.
  let gap = BOX_W + 24;
  let selfWidth = 0;
  let n = 0;
  for (const step of steps) {
    if ("note" in step) continue;
    n++;
    const text = numbered ? `${n}  ${step.label}` : step.label;
    const span = Math.abs(col(step.from) - col(step.to));
    // Internal steps on the last column need room to the right; others fit between columns.
    if (span === 0) {
      if (col(step.from) === participants.length - 1)
        selfWidth = Math.max(selfWidth, text.length * CHAR + 40);
    } else {
      gap = Math.max(gap, (text.length * CHAR + 28) / span);
    }
  }

  const centre = (id: string) => PAD + BOX_W / 2 + col(id) * gap;
  const width =
    PAD * 2 +
    BOX_W +
    gap * (participants.length - 1) +
    Math.max(0, selfWidth - BOX_W / 2);
  const firstRow = TOP + BOX_H + 30;
  const height = firstRow + steps.length * ROW + 6;

  let number = 0;
  return (
    <Diagram
      title={title}
      tag={tag}
      caption={caption}
      width={Math.round(width)}
      height={height}
      minWidth={Math.min(820, Math.round(width * 0.9))}
    >
      {participants.map((p) => {
        const x = centre(p.id);
        return (
          <g key={p.id}>
            <line
              className="dg-lifeline"
              x1={x}
              y1={TOP + BOX_H}
              x2={x}
              y2={height - 4}
            />
            <Box
              x={x - BOX_W / 2}
              y={TOP}
              w={BOX_W}
              h={BOX_H}
              label={p.label}
              sub={p.sub}
              tone={p.accent ? "accent" : "default"}
            />
          </g>
        );
      })}

      {steps.map((step, i) => {
        const y = firstRow + i * ROW;
        if ("note" in step) {
          const xs = step.over.map(centre);
          const left = Math.min(...xs) - BOX_W / 2 + 6;
          const right = Math.max(...xs) + BOX_W / 2 - 6;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: steps are a static list
            <g key={i} className="dg-seq-note">
              <rect
                x={left}
                y={y - 13}
                width={right - left}
                height={22}
                rx={5}
              />
              <text x={(left + right) / 2} y={y + 2}>
                {step.note}
              </text>
            </g>
          );
        }
        number++;
        const text = numbered ? `${number}  ${step.label}` : step.label;
        const x1 = centre(step.from);
        const x2 = centre(step.to);
        if (x1 === x2) {
          return (
            <Arrow
              // biome-ignore lint/suspicious/noArrayIndexKey: steps are a static list
              key={i}
              d={`M${x1} ${y - 8} H${x1 + 22} V${y + 6} H${x1 + 4}`}
              cut={step.fail}
              label={text}
              at={[x1 + 30, y + 2]}
              anchor="start"
            />
          );
        }
        const dir = x2 > x1 ? 1 : -1;
        return (
          <Arrow
            // biome-ignore lint/suspicious/noArrayIndexKey: steps are a static list
            key={i}
            d={`M${x1 + dir * 4} ${y} H${x2 - dir * 5}`}
            flow={!step.reply && !step.fail}
            dashed={step.reply}
            cut={step.fail}
            label={text}
            at={[(x1 + x2) / 2, y - 7]}
          />
        );
      })}
    </Diagram>
  );
}

/** Legend chips shown under system diagrams. */
export function DiagramLegend({
  items,
}: {
  items: { label: string; kind: "flow" | "link" | "dashed" | "planned" }[];
}) {
  return (
    <div className="dg-legend not-prose">
      {items.map((item) => (
        <span key={item.label} className="dg-legend-item">
          <span
            className={cn("dg-legend-swatch", `dg-legend-${item.kind}`)}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
