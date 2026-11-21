import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

const url = "http://localhost:3000/v1/admin/docs-ui";
const basic = (credentials: string) => ({
  authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
});

function setEnv(env: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}

describe("docs proxy", () => {
  it("is closed (503) in production when no credentials are configured", () => {
    setEnv({
      NODE_ENV: "production",
      DOCS_AUTH_USER: undefined,
      DOCS_AUTH_PASSWORD: undefined,
    });
    expect(proxy(new NextRequest(url)).status).toBe(503);
  });

  it("is closed in production when the password is too short", () => {
    setEnv({
      NODE_ENV: "production",
      DOCS_AUTH_USER: "ashish",
      DOCS_AUTH_PASSWORD: "short",
    });
    expect(proxy(new NextRequest(url)).status).toBe(503);
  });

  it("is open in development when no credentials are configured", () => {
    setEnv({
      NODE_ENV: "development",
      DOCS_AUTH_USER: undefined,
      DOCS_AUTH_PASSWORD: undefined,
    });
    expect(proxy(new NextRequest(url)).headers.get("x-middleware-next")).toBe(
      "1",
    );
  });

  it("accepts a short password in development (and still asks for it)", () => {
    setEnv({
      NODE_ENV: "development",
      DOCS_AUTH_USER: "admin",
      DOCS_AUTH_PASSWORD: "admin",
    });
    expect(proxy(new NextRequest(url)).status).toBe(401);
    const ok = proxy(new NextRequest(url, { headers: basic("admin:admin") }));
    expect(ok.headers.get("x-middleware-next")).toBe("1");
  });

  it("asks for credentials (401) when they are configured but missing", () => {
    setEnv({
      NODE_ENV: "production",
      DOCS_AUTH_USER: "ashish",
      DOCS_AUTH_PASSWORD: "correct-horse-battery",
    });
    const response = proxy(new NextRequest(url));
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("Basic");
  });

  it("lets the right credentials through", () => {
    setEnv({
      NODE_ENV: "production",
      DOCS_AUTH_USER: "ashish",
      DOCS_AUTH_PASSWORD: "correct-horse-battery",
    });
    const response = proxy(
      new NextRequest(url, { headers: basic("ashish:correct-horse-battery") }),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
