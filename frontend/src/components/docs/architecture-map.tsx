"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useTheme } from "next-themes";

/**
 * Interactive map of the AegisBank system (pan with drag, zoom with the controls).
 * Update `nodes` / `edges` below when a service or connection changes - it is the single picture
 * of the architecture used across the docs.
 */
type Status = "built" | "in-progress" | "planned";
type ServiceData = {
  title: string;
  detail: string;
  meta?: string;
  status: Status;
};
type ServiceNode = Node<ServiceData, "service">;

const statusStyles: Record<Status, { label: string; className: string }> = {
  built: {
    label: "Built",
    className:
      "border-success-border bg-success-subtle text-success-foreground",
  },
  "in-progress": {
    label: "In progress",
    className:
      "border-warning-border bg-warning-subtle text-warning-foreground",
  },
  planned: {
    label: "Planned",
    className: "border-border bg-surface-subtle text-muted-foreground",
  },
};

/** Connection points. Only the ones an edge names are used; all are invisible (arrows show the flow). */
const handles: { id: string; type: "source" | "target"; position: Position }[] =
  [
    { id: "top", type: "target", position: Position.Top },
    { id: "bottom", type: "source", position: Position.Bottom },
    { id: "bottom-in", type: "target", position: Position.Bottom },
    { id: "left", type: "source", position: Position.Left },
    { id: "left-in", type: "target", position: Position.Left },
    { id: "right", type: "source", position: Position.Right },
    { id: "right-in", type: "target", position: Position.Right },
  ];

function ServiceNodeView({ data }: NodeProps<ServiceNode>) {
  const status = statusStyles[data.status];
  return (
    <div className="w-[11.5rem] rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-left shadow-xs">
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={handle.position}
          isConnectable={false}
          className="size-1! border-0! bg-transparent! opacity-0!"
        />
      ))}
      <div className="flex items-start justify-between gap-2">
        <span className="font-display font-semibold text-[13px] text-foreground leading-tight">
          {data.title}
        </span>
        <span
          className={`shrink-0 rounded-sm border px-1.5 py-px font-medium text-[10px] ${status.className}`}
        >
          {status.label}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground leading-snug">
        {data.detail}
      </div>
      {data.meta && (
        <div className="mt-1 font-mono text-[10px] text-subtle-foreground">
          {data.meta}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { service: ServiceNodeView };

const service = (
  id: string,
  x: number,
  y: number,
  data: ServiceData,
): ServiceNode => ({
  id,
  type: "service",
  position: { x, y },
  data,
});

// Grid: columns at x = 0 / 300 / 600 (nodes are 184 px wide), rows 140-170 px apart so labels fit.
const nodes: ServiceNode[] = [
  service("browser", 300, 0, {
    title: "Browser",
    detail: "Customer or you (docs)",
    status: "built",
  }),
  service("frontend", 300, 140, {
    title: "Frontend",
    detail: "Next.js · BFF proxy · docs UI",
    meta: ":3000",
    status: "built",
  }),
  service("gateway", 300, 280, {
    title: "API Gateway",
    detail: "Routing · rate limit per IP",
    meta: ":8080",
    status: "built",
  }),
  service("redis", 600, 280, {
    title: "Redis",
    detail: "Rate-limit buckets · fraud counters",
    meta: ":6379",
    status: "built",
  }),
  service("account", 0, 440, {
    title: "account-service",
    detail: "Accounts, balances",
    meta: ":8081 · account_db",
    status: "built",
  }),
  service("transaction", 300, 440, {
    title: "transaction-service",
    detail: "Transfer SAGA · OTP",
    meta: ":8082 · transaction_db",
    status: "built",
  }),
  service("payment", 600, 440, {
    title: "payment-service",
    detail: "Razorpay top-ups",
    meta: ":8083 · payment_db",
    status: "planned",
  }),
  service("kafka", 300, 610, {
    title: "Kafka",
    detail: "Domain events between services",
    meta: ":9092",
    status: "built",
  }),
  service("fraud", 120, 780, {
    title: "fraud-detection",
    detail: "Velocity · amount · balance rules",
    meta: ":8084",
    status: "planned",
  }),
  service("notification", 480, 780, {
    title: "notification-service",
    detail: "Email / SMS alerts, OTPs",
    meta: ":8085",
    status: "planned",
  }),
];

type Side =
  | "top"
  | "bottom"
  | "bottom-in"
  | "left"
  | "left-in"
  | "right"
  | "right-in";

const edge = (
  source: string,
  target: string,
  label: string,
  {
    dashed = false,
    from = "bottom",
    to = "top",
  }: { dashed?: boolean; from?: Side; to?: Side } = {},
): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle: from,
  targetHandle: to,
  label,
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
  style: dashed ? { strokeDasharray: "5 4" } : undefined,
  labelBgPadding: [6, 3],
  labelBgBorderRadius: 4,
});

const edges: Edge[] = [
  edge("browser", "frontend", "HTTPS"),
  edge("frontend", "gateway", "/api/v1/** (server side)"),
  edge("gateway", "redis", "rate limit", {
    dashed: true,
    from: "right",
    to: "left-in",
  }),
  edge("gateway", "account", "REST"),
  edge("gateway", "transaction", "REST"),
  edge("gateway", "payment", "REST", { dashed: true }),
  edge("transaction", "account", "Feign /internal", {
    from: "left",
    to: "right-in",
  }),
  edge("transaction", "kafka", "events", { dashed: true }),
  edge("kafka", "account", "transaction.completed, fraud.detected", {
    from: "left",
    to: "bottom-in",
  }),
  edge("kafka", "fraud", "transfers", { dashed: true }),
  edge("kafka", "notification", "alerts", { dashed: true }),
];

export function ArchitectureMap({ height = 640 }: { height?: number }) {
  const { resolvedTheme } = useTheme();
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-lg border border-border bg-surface-subtle">
      <div
        style={{ height }}
        className="[&_.react-flow__edge-text]:fill-muted-foreground [&_.react-flow__edge-text]:text-[10px] [&_.react-flow__edge-textbg]:fill-surface"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          forceColorMode={resolvedTheme === "dark" ? "dark" : "light"}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.08 }}
          minZoom={0.4}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <figcaption className="border-border border-t bg-surface px-4 py-2 text-muted-foreground text-xs">
        Solid lines exist today, dashed lines are planned. Drag to pan, use the
        controls to zoom.
      </figcaption>
    </figure>
  );
}
