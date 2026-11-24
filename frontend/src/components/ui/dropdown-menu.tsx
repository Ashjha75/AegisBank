"use client";

import { Check } from "lucide-react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import type * as React from "react";
import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-(--z-popover) min-w-48 overflow-hidden rounded-md border border-border bg-surface p-1 shadow-md",
          "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

const itemClasses =
  "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2.5 py-1.5 text-body-sm outline-none transition-colors duration-fast data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4";

/**
 * A menu entry. `asChild` makes it a link:
 *
 *   <DropdownMenuItem asChild><Link href="/app/accounts">Your accounts</Link></DropdownMenuItem>
 *
 * With `asChild` the item is a Radix Slot, which takes exactly one element child - rendering the
 * shortcut next to `children` would be two and Radix throws ("Primitive.div failed to slot onto
 * its children"). So when both are used the shortcut is placed *inside* the child instead, which
 * is also where it belongs visually: inside the link, not beside it.
 */
export function DropdownMenuItem({
  className,
  tone = "default",
  shortcut,
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  tone?: "default" | "danger";
  /** Keyboard hint on the right, e.g. "⌘K". */
  shortcut?: string;
}) {
  const shortcutNode = shortcut ? (
    <span className="ml-auto pl-4 font-mono text-caption text-subtle-foreground">
      {shortcut}
    </span>
  ) : null;

  let content: React.ReactNode = children;
  if (shortcutNode) {
    content =
      asChild && isElementWithChildren(children) ? (
        cloneElement(children, undefined, children.props.children, shortcutNode)
      ) : (
        <>
          {children}
          {shortcutNode}
        </>
      );
  }

  return (
    <MenuPrimitive.Item
      asChild={asChild}
      className={cn(
        itemClasses,
        tone === "danger"
          ? "text-danger-foreground focus:bg-danger-subtle [&_svg]:text-danger-foreground"
          : "text-foreground focus:bg-accent [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {content}
    </MenuPrimitive.Item>
  );
}

function isElementWithChildren(
  node: React.ReactNode,
): node is React.ReactElement<{ children?: React.ReactNode }> {
  return isValidElement(node);
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem
      className={cn(
        itemClasses,
        "pl-8 text-foreground focus:bg-accent",
        className,
      )}
      {...props}
    >
      <MenuPrimitive.ItemIndicator className="absolute left-2.5 flex items-center">
        <Check className="text-brand" aria-hidden="true" />
      </MenuPrimitive.ItemIndicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label
      className={cn(
        "px-2.5 py-1.5 font-medium text-overline text-subtle-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}
