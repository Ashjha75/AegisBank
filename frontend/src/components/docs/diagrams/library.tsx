"use client";

import { Arrow, Box, Diagram } from "./diagram";
import { DiagramLegend } from "./sequence-diagram";

/*
 * The named diagrams used across the docs. Edit the one that changes when the system changes;
 * the MDX pages only reference them by name (<SystemMap />, <TransferStates />, <ProxyPath />).
 */

/** The whole system: request path, services, data stores and planned parts (dimmed). */
export function SystemMap() {
  return (
    <>
      <Diagram
        title="System map"
        tag="dev_v1 · built and planned"
        width={1030}
        height={300}
        minWidth={780}
        caption="Clients reach only the gateway (through the Next.js server). Money-moving calls stay on /internal."
      >
        <Box
          x={10}
          y={124}
          w={104}
          h={46}
          label="Browser"
          sub="customer · docs"
        />
        <Box
          x={170}
          y={120}
          w={140}
          h={54}
          label="Frontend"
          sub="Next.js BFF · :3000"
        />
        <Box
          x={366}
          y={120}
          w={140}
          h={54}
          label="API gateway"
          sub=":8080 · rate limit"
          tone="accent"
        />
        <Box
          x={366}
          y={18}
          w={140}
          h={44}
          label="Redis"
          sub=":6379 · buckets"
        />

        <Box
          x={556}
          y={30}
          w={170}
          h={50}
          label="account-service"
          sub=":8081 · account_db"
        />
        <Box
          x={556}
          y={122}
          w={170}
          h={50}
          label="transaction-service"
          sub=":8082 · transaction_db"
          tone="accent"
        />
        <Box
          x={556}
          y={214}
          w={170}
          h={50}
          label="payment-service"
          sub=":8083 · planned"
          tone="muted"
        />

        <Box
          x={776}
          y={122}
          w={110}
          h={50}
          label="Kafka"
          sub=":9092 · events"
        />
        <Box
          x={914}
          y={64}
          w={106}
          h={44}
          label="Fraud"
          sub=":8084 · planned"
          tone="muted"
        />
        <Box
          x={914}
          y={186}
          w={106}
          h={44}
          label="Notify"
          sub=":8085 · planned"
          tone="muted"
        />

        <Arrow d="M114 147 H164" flow label="HTTPS" at={[139, 139]} />
        <Arrow d="M310 147 H360" flow label="/api/v1/**" at={[335, 139]} />
        <Arrow
          d="M436 120 V68"
          dashed
          label="rate limit"
          at={[444, 98]}
          anchor="start"
        />
        <Arrow d="M506 147 H530 V55 H550" />
        <Arrow d="M506 147 H550" flow />
        <Arrow d="M506 147 H530 V239 H550" dashed />
        <Arrow
          d="M641 122 V86"
          label="Feign /internal"
          at={[649, 108]}
          anchor="start"
        />
        <Arrow d="M726 147 H770" dashed label="events" at={[748, 139]} />
        <Arrow d="M886 140 H900 V86 H908" dashed />
        <Arrow d="M886 154 H900 V208 H908" dashed />
      </Diagram>
      <DiagramLegend
        items={[
          { label: "Request path", kind: "flow" },
          { label: "Synchronous call", kind: "link" },
          { label: "Async / optional", kind: "dashed" },
          { label: "Planned", kind: "planned" },
        ]}
      />
    </>
  );
}

/** Lifecycle of a transfer in transaction-service (TransactionStatus). */
export function TransferStates() {
  return (
    <Diagram
      title="Transfer states"
      tag="TransactionStatus"
      width={800}
      height={250}
      minWidth={680}
      caption="Every status change is saved immediately; FAILED and FLAGGED always end with the sender refunded."
    >
      <circle className="dg-start" cx={16} cy={125} r={6} />
      <Box x={40} y={105} w={120} h={40} label="Pending" sub="transfer saved" />
      <Box
        x={238}
        y={105}
        w={130}
        h={40}
        label="Processing"
        sub="sender debited"
        tone="accent"
      />
      <Box
        x={450}
        y={20}
        w={190}
        h={40}
        label="Pending verification"
        sub="waits for OTP"
        tone="warning"
      />
      <Box
        x={450}
        y={190}
        w={120}
        h={40}
        label="Failed"
        sub="nothing lost"
        tone="danger"
      />
      <Box x={680} y={105} w={110} h={40} label="Completed" tone="success" />
      <Box
        x={680}
        y={20}
        w={110}
        h={40}
        label="Flagged"
        sub="refunded"
        tone="danger"
      />

      <Arrow d="M22 125 H34" flow head />
      <Arrow d="M160 125 H232" flow label="debit ok" at={[196, 117]} />
      <Arrow
        d="M100 145 V210 H444"
        cut
        label="deduct fails"
        at={[110, 202]}
        anchor="start"
      />
      <Arrow
        d="M368 117 H404 V40 H444"
        label="amount ≥ threshold"
        at={[412, 76]}
        anchor="start"
      />
      <Arrow d="M368 129 H674" flow label="receiver credited" at={[560, 121]} />
      <Arrow
        d="M368 137 H392 V210 H444"
        cut
        label="credit fails · refund"
        at={[400, 182]}
        anchor="start"
      />
      <Arrow d="M640 34 H674" cut label="expired / wrong OTP" at={[657, 14]} />
      <Arrow
        d="M640 48 H658 V113 H674"
        label="right OTP"
        at={[652, 92]}
        anchor="end"
      />
    </Diagram>
  );
}

/** Why the frontend has a server-side proxy to the gateway. */
export function ProxyPath() {
  return (
    <Diagram
      title="Request path"
      tag="frontend → gateway"
      width={860}
      height={170}
      minWidth={640}
      caption="One origin for the browser; the gateway address stays private and no CORS setup is needed."
    >
      <Box x={10} y={40} w={104} h={44} label="Browser" sub="apiFetch()" />
      <Box
        x={230}
        y={36}
        w={160}
        h={52}
        label="Next.js server"
        sub="src/app/api/gateway"
        tone="accent"
      />
      <Box x={540} y={36} w={140} h={52} label="API gateway" sub=":8080" />
      <Box x={740} y={40} w={110} h={44} label="Services" sub="Spring Boot" />
      <Box
        x={540}
        y={118}
        w={140}
        h={44}
        label="Problem details"
        sub="502 / 504"
        tone="danger"
      />

      <Arrow d="M114 62 H224" flow label="/api/gateway/v1/**" at={[169, 54]} />
      <Arrow
        d="M390 62 H534"
        flow
        label="/api/v1/** + x-request-id"
        at={[462, 54]}
      />
      <Arrow d="M680 62 H734" flow />
      <Arrow
        d="M310 88 V140 H534"
        cut
        label="gateway down / timeout"
        at={[318, 132]}
        anchor="start"
      />
    </Diagram>
  );
}
