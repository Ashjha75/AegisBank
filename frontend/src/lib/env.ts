import "server-only";
import { z } from "zod";

/**
 * Server-side configuration, read from the environment AT REQUEST TIME (not baked in at build).
 * One Docker image can therefore run in dev, staging and prod with different values.
 *
 * Never import this from a client component ("server-only" makes that a build error), and never
 * use NEXT_PUBLIC_* variables: those are frozen into the JS bundle during `next build`.
 * Template with every variable: .env.example
 */
const baseSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  /** Base URL of the Spring Cloud api-gateway, as reachable from this server/container. */
  API_GATEWAY_URL: z.url().default("http://localhost:8080"),
  /** Abort a gateway call after this many milliseconds. */
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  /** Basic-auth credentials for the docs UI. Required in production (see src/proxy.ts). */
  DOCS_AUTH_USER: z.string().min(1).optional(),
  /** At least 12 characters in production; any non-empty value in development. */
  DOCS_AUTH_PASSWORD: z.string().min(1).optional(),
});

const schema = baseSchema.superRefine((env, ctx) => {
  if (
    env.NODE_ENV === "production" &&
    env.DOCS_AUTH_PASSWORD !== undefined &&
    env.DOCS_AUTH_PASSWORD.length < 12
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["DOCS_AUTH_PASSWORD"],
      message: "DOCS_AUTH_PASSWORD must be at least 12 characters",
    });
  }
});

export type ServerEnv = z.infer<typeof schema>;

export function serverEnv(): ServerEnv {
  const parsed = schema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    API_GATEWAY_URL: process.env.API_GATEWAY_URL || undefined,
    API_TIMEOUT_MS: process.env.API_TIMEOUT_MS || undefined,
    DOCS_AUTH_USER: process.env.DOCS_AUTH_USER || undefined,
    DOCS_AUTH_PASSWORD: process.env.DOCS_AUTH_PASSWORD || undefined,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration:\n${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}
