import { describe, expect, it } from "vitest";
import { isAuthorized } from "./basic-auth";

const header = (credentials: string) =>
  `Basic ${Buffer.from(credentials).toString("base64")}`;

describe("isAuthorized", () => {
  it("accepts the right user and password", () => {
    expect(
      isAuthorized(
        header("ashish:correct-horse-battery"),
        "ashish",
        "correct-horse-battery",
      ),
    ).toBe(true);
  });

  it("accepts a password that contains a colon", () => {
    expect(
      isAuthorized(
        header("ashish:a:b:c-long-enough"),
        "ashish",
        "a:b:c-long-enough",
      ),
    ).toBe(true);
  });

  it.each([
    ["wrong password", header("ashish:nope")],
    ["wrong user", header("someone:correct-horse-battery")],
    ["no colon", header("ashishcorrect-horse-battery")],
    ["bearer scheme", "Bearer abc"],
    ["missing header", null],
  ])("rejects %s", (_, value) => {
    expect(isAuthorized(value, "ashish", "correct-horse-battery")).toBe(false);
  });
});
