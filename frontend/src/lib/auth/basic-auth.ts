import { createHash, timingSafeEqual } from "node:crypto";

/**
 * HTTP Basic auth check for the private docs UI.
 * Compares SHA-256 digests with timingSafeEqual so the response time doesn't leak how much of the
 * username or password was right.
 */
export function isAuthorized(
  authorizationHeader: string | null,
  user: string,
  password: string,
): boolean {
  if (!authorizationHeader?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(
      authorizationHeader.slice(6).trim(),
      "base64",
    ).toString("utf8");
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;

  const userOk = safeEqual(decoded.slice(0, separator), user);
  const passwordOk = safeEqual(decoded.slice(separator + 1), password);
  return userOk && passwordOk;
}

function safeEqual(a: string, b: string): boolean {
  const digest = (value: string) =>
    createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(a), digest(b));
}

export const BASIC_AUTH_REALM = 'Basic realm="AegisBank docs", charset="UTF-8"';
