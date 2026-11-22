import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Globe, LockKey, ShieldCheck } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CopyText } from "./copy-text";

/**
 * API reference blocks, in the shape most API docs use (Stripe, GitHub, Render):
 *
 *   <Endpoint method="POST" path="/api/v1/transactions/transfer" auth="bearer" status="201 Created"
 *             summary="Transfer money between two accounts.">
 *     ...body: <TypeTable>, ```bash tab="cURL" examples, <Responses>...
 *   </Endpoint>
 *
 * Paths are shown as the gateway serves them; `{param}` segments are highlighted.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-[var(--success-subtle)] text-[var(--success-foreground)] border-[var(--success-border)]",
  POST: "bg-[var(--info-subtle)] text-[var(--info-foreground)] border-[var(--info-border)]",
  PUT: "bg-[var(--warning-subtle)] text-[var(--warning-foreground)] border-[var(--warning-border)]",
  PATCH:
    "bg-[var(--warning-subtle)] text-[var(--warning-foreground)] border-[var(--warning-border)]",
  DELETE:
    "bg-[var(--danger-subtle)] text-[var(--danger-foreground)] border-[var(--danger-border)]",
};

const AUTH: Record<
  "public" | "bearer" | "internal",
  { label: string; Icon: PhosphorIcon }
> = {
  public: { label: "Public", Icon: Globe },
  bearer: { label: "Signed-in user", Icon: LockKey },
  internal: { label: "Internal only", Icon: ShieldCheck },
};

export function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-14 items-center justify-center rounded-full border px-2.5 font-mono font-semibold text-[0.75rem] tracking-wide",
        METHOD_STYLES[method],
      )}
    >
      {method}
    </span>
  );
}

function PathText({ path }: { path: string }) {
  return (
    <code className="break-all font-mono font-medium text-[0.95rem] text-[var(--foreground)]">
      {path.split(/(\{[^}]+\})/g).map((part, i) =>
        part.startsWith("{") ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: static split of a fixed string
          <span key={i} className="text-[var(--brand)]">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </code>
  );
}

export function Endpoint({
  method,
  path,
  summary,
  auth,
  status,
  children,
}: {
  method: HttpMethod;
  path: string;
  summary?: ReactNode;
  auth?: keyof typeof AUTH;
  /** Success status, e.g. "201 Created". */
  status?: string;
  children?: ReactNode;
}) {
  const authInfo = auth ? AUTH[auth] : undefined;
  return (
    <section className="my-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)]">
      <div className="not-prose grid gap-3 bg-[var(--surface)] px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <MethodBadge method={method} />
          <PathText path={path} />
          <CopyText text={path} label="Copy path" />
        </div>
        {(summary || authInfo || status) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem]">
            {summary && (
              <span className="text-[var(--foreground)]">{summary}</span>
            )}
            {authInfo && (
              <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--muted-foreground)]">
                <authInfo.Icon size={15} weight="duotone" aria-hidden />
                {authInfo.label}
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.8125rem] text-[var(--success-foreground)]">
                <span
                  className="size-1.5 rounded-full bg-[var(--success)]"
                  aria-hidden
                />
                {status}
              </span>
            )}
          </div>
        )}
      </div>
      {children && <div className="px-6 pt-1 pb-2">{children}</div>}
    </section>
  );
}

/**
 * Possible responses of an endpoint. `code` is the backend ErrorCode (problem+json `errorCode`).
 *
 *   <Responses items={[{ status: 201, description: "Transfer created" },
 *                      { status: 400, code: "VALIDATION_FAILED", description: "A field is invalid" }]} />
 */
export function Responses({
  items,
}: {
  items: { status: number; description: ReactNode; code?: string }[];
}) {
  const tone = (status: number) =>
    status < 300
      ? "bg-[var(--success)]"
      : status < 500
        ? "bg-[var(--warning)]"
        : "bg-[var(--danger)]";
  return (
    <div className="not-prose my-5 overflow-hidden rounded-2xl border border-[var(--border)]">
      <div className="grid grid-cols-[5.5rem_1fr] bg-[var(--surface)] px-5 py-2.5 font-semibold text-[0.8125rem] text-[var(--muted-foreground)] sm:grid-cols-[5.5rem_14rem_1fr]">
        <span>Status</span>
        <span className="max-sm:hidden">Error code</span>
        <span className="max-sm:hidden">Meaning</span>
      </div>
      {items.map((item) => (
        <div
          key={`${item.status}-${item.code ?? ""}`}
          className="grid grid-cols-[5.5rem_1fr] items-baseline gap-y-1 border-[var(--border)] border-t px-5 py-3 text-[0.9375rem] sm:grid-cols-[5.5rem_14rem_1fr]"
        >
          <span className="inline-flex items-center gap-2 font-mono font-semibold">
            <span
              className={cn("size-2 rounded-full", tone(item.status))}
              aria-hidden
            />
            {item.status}
          </span>
          <span className="font-mono text-[0.8125rem] text-[var(--muted-foreground)]">
            {item.code ?? "—"}
          </span>
          <span className="col-span-full text-[var(--foreground)] sm:col-span-1">
            {item.description}
          </span>
        </div>
      ))}
    </div>
  );
}
