import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { STATUS_PRESETS, type StatusCode } from "./status-presets";

/**
 * Full-page state: 404, 500, maintenance, sign-in required ... Calm, centred, one clear action.
 *
 *   <StatusPage status="404" actions={<Button asChild><Link href="/">Back to home</Link></Button>} />
 *
 * `status` fills icon, title and description from status-presets.ts; any prop overrides it.
 * `embedded` drops the full-viewport height and header (for previews inside other pages).
 */
export function StatusPage({
  status,
  Icon,
  title,
  description,
  actions,
  footnote,
  embedded = false,
}: {
  status?: StatusCode;
  Icon?: LucideIcon;
  title?: string;
  description?: string;
  actions?: ReactNode;
  footnote?: ReactNode;
  embedded?: boolean;
}) {
  const preset = status ? STATUS_PRESETS[status] : undefined;
  const StatusIcon = Icon ?? preset?.Icon;
  const Main = embedded ? "div" : "main";
  return (
    <div
      className={cn(
        "relative isolate flex flex-1 flex-col overflow-hidden bg-background",
        !embedded && "min-h-dvh",
      )}
    >
      {/* Hairline grid, fading out towards the edges. Decorative. */}
      <div
        className="bg-grid -z-10 pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]"
        aria-hidden="true"
      />
      {!embedded && (
        <div className="mx-auto flex h-(--header-height) w-full max-w-(--container-max) items-center px-5 sm:px-8">
          <Link href="/" aria-label="AegisBank home" className="rounded-sm">
            <Logo />
          </Link>
        </div>
      )}
      <Main
        className={cn(
          "flex flex-1 items-center justify-center px-5",
          embedded ? "py-14" : "pb-24",
        )}
      >
        <div className="grid max-w-md justify-items-center gap-6 text-center">
          {status && (
            <p className="numeric font-medium font-mono text-[4.5rem] text-foreground leading-none tracking-[-0.06em]">
              {status}
            </p>
          )}
          {!status && StatusIcon && (
            <span className="flex size-12 items-center justify-center rounded-md border border-border bg-surface text-foreground shadow-xs">
              <StatusIcon
                className="size-6"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
          )}
          <div className="grid gap-2">
            {preset && (
              <p className="inline-flex items-center justify-center gap-1.5 font-medium text-overline text-subtle-foreground uppercase">
                {StatusIcon && (
                  <StatusIcon className="size-3.5" aria-hidden="true" />
                )}
                {preset.label}
              </p>
            )}
            <h1 className="text-h2 text-foreground">
              {title ?? preset?.title}
            </h1>
            <p className="text-body text-muted-foreground">
              {description ?? preset?.description}
            </p>
          </div>
          {actions && (
            <div className="flex flex-wrap justify-center gap-2.5">
              {actions}
            </div>
          )}
          {footnote && (
            <p className="font-mono text-caption text-subtle-foreground">
              {footnote}
            </p>
          )}
        </div>
      </Main>
    </div>
  );
}
