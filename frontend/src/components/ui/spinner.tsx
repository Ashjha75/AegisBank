import { cn } from "@/lib/cn";

/**
 * Loaders.
 *   <Spinner />       inline activity (buttons, small panels). Inherits text colour.
 *   <LoadingDots />   "typing"-style wait inside text, e.g. "Verifying<LoadingDots />".
 *   <PageLoader />    a whole region is loading and no skeleton fits.
 * Prefer <Skeleton> when the final layout is known.
 */
const spinnerSizes = { sm: "size-4", md: "size-5", lg: "size-7" } as const;

export function Spinner({
  size = "md",
  label = "Loading",
  className,
}: {
  size?: keyof typeof spinnerSizes;
  /** Read by screen readers. Pass "" when a visible label already says it. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      role={label ? "status" : undefined}
      className={cn("inline-flex", className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          "animate-spin motion-reduce:animate-[spin_2s_linear_infinite]",
          spinnerSizes[size],
        )}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="2.5"
        />
        <path
          d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-end gap-0.5 pl-0.5", className)}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 animate-dot-pulse rounded-full bg-current"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

export function PageLoader({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <Spinner size="lg" label="" className="text-foreground" />
      <output className="text-body-sm">
        {label}
        <LoadingDots />
      </output>
    </div>
  );
}
