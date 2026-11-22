"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

const sizes = {
  sm: "size-6 text-[0.625rem]",
  md: "size-8 text-caption",
  lg: "size-10 text-body-sm",
} as const;

/** Person or payee. Falls back to initials when there is no image (or it fails to load). */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-surface-sunken font-medium text-foreground",
        sizes[size],
        className,
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback aria-label={name}>
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
