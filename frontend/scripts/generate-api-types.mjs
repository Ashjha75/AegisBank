#!/usr/bin/env node
/**
 * Generates TypeScript types for the backend APIs from the OpenAPI documents each Spring Boot
 * service publishes (springdoc), served through the api-gateway's /docs/<service>/v3/api-docs routes.
 *
 * Needs the backend running. Run:  pnpm api:types
 * Gateway URL: API_GATEWAY_URL (default http://localhost:8080).
 * Output: src/lib/api/generated/<service>.ts - commit these files; regenerate after a backend API change.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const gateway = (
  process.env.API_GATEWAY_URL || "http://localhost:8080"
).replace(/\/+$/, "");
const services = ["account", "transaction", "payment"];
const outDir = fileURLToPath(
  new URL("../src/lib/api/generated/", import.meta.url),
);
mkdirSync(outDir, { recursive: true });

let failed = 0;
for (const service of services) {
  const source = `${gateway}/docs/${service}/v3/api-docs`;
  const output = `${outDir}${service}.ts`;
  console.log(`\n${service}: ${source}`);
  const result = spawnSync(
    "pnpm",
    ["exec", "openapi-typescript", source, "--output", output],
    {
      stdio: "inherit",
    },
  );
  if (result.status !== 0) {
    failed++;
    console.error(
      `  could not generate ${service} - is ${service}-service running behind the gateway?`,
    );
  }
}

if (failed > 0) process.exit(1);
console.log(
  "\nDone. Import types like: import type { components } from '@/lib/api/generated/account';",
);
