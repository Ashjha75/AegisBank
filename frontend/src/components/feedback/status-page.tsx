import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

/** Full-page state used by not-found, error and global-error. Calm, centred, one clear action. */
export function StatusPage({
  Icon,
  code,
  title,
  description,
  actions,
  footnote,
}: {
  Icon: LucideIcon;
  code?: string;
  title: string;
  description: string;
  actions: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-background">
      <div className="mx-auto flex h-(--header-height) w-full max-w-(--container-max) items-center px-5 sm:px-8">
        <Link href="/" aria-label="AegisBank home" className="rounded-sm">
          <Logo />
        </Link>
      </div>
      <main className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="grid max-w-md justify-items-center gap-5 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-surface text-primary">
            <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="grid gap-2">
            {code && (
              <p className="font-mono text-caption text-subtle-foreground">
                {code}
              </p>
            )}
            <h1 className="text-h2 text-foreground">{title}</h1>
            <p className="text-body text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            {actions}
          </div>
          {footnote && (
            <p className="text-caption text-subtle-foreground">{footnote}</p>
          )}
        </div>
      </main>
    </div>
  );
}
