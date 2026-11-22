import { cn } from "@/lib/cn";

/** AegisBank mark: an ink shield holding an "A" with a green crossbar. Sized via className. */
export function LogoMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M12 1.75 20.25 4.8v6.2c0 5.05-3.42 9.06-8.25 11.25C7.17 20.06 3.75 16.05 3.75 11V4.8L12 1.75Z"
        fill="var(--primary)"
      />
      <path
        d="m8.4 15.6 3.6-8.2 3.6 8.2"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12.6h4"
        stroke="var(--brand-mark-accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  /** Light wordmark for dark panels. */
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark
        className={cn(
          inverted &&
            "[&_path:first-child]:fill-primary-foreground [&_path:nth-child(2)]:stroke-primary",
        )}
      />
      <span
        className={cn(
          "font-display font-semibold text-[1.0625rem] tracking-[-0.02em]",
          inverted ? "text-primary-foreground" : "text-foreground",
        )}
      >
        AegisBank
      </span>
    </span>
  );
}
