import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A live preview area in the docs. `site-theme` switches the tokens back to the real (white) site
 * surfaces, so components look exactly as they will in the app, not on the docs' paper.
 */
export function Preview({
  title,
  description,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className="not-prose my-6 grid gap-2.5 font-sans">
      {(title || description) && (
        <div className="grid gap-0.5">
          {title && (
            <h4 className="font-semibold text-[0.9375rem] text-foreground">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-[0.8125rem] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={cn(
          "site-theme relative overflow-hidden rounded-md border border-border",
          padded && "p-6",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function Row({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
    </div>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="font-medium text-[0.6875rem] text-subtle-foreground uppercase tracking-[0.08em]">
      {children}
    </p>
  );
}
