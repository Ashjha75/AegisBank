// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";

/**
 * `asChild` on a menu item used to crash: the item always rendered a second child for the
 * shortcut, and a Radix Slot accepts exactly one element child
 * ("Primitive.div failed to slot onto its children"). Every item that is a link hits this.
 */
function openMenu(children: React.ReactNode) {
  return render(
    <DropdownMenu open modal={false}>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe("DropdownMenuItem", () => {
  it("renders a link item with asChild", () => {
    openMenu(
      <DropdownMenuItem asChild>
        <a href="/app/accounts">Your accounts</a>
      </DropdownMenuItem>,
    );
    const link = screen.getByRole("menuitem", { name: "Your accounts" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/app/accounts");
  });

  it("keeps the shortcut inside the slotted child", () => {
    openMenu(
      <DropdownMenuItem asChild shortcut="⌘K">
        <a href="/search">Search</a>
      </DropdownMenuItem>,
    );
    const link = screen.getByRole("menuitem", { name: /Search/ });
    expect(link.tagName).toBe("A");
    expect(link).toHaveTextContent("⌘K");
  });

  it("still renders a plain item with a shortcut", () => {
    openMenu(<DropdownMenuItem shortcut="⌘K">Search</DropdownMenuItem>);
    const item = screen.getByRole("menuitem", { name: /Search/ });
    expect(item.tagName).not.toBe("A");
    expect(item).toHaveTextContent("⌘K");
  });

  it("renders a plain item without a shortcut", () => {
    openMenu(<DropdownMenuItem>Sign out</DropdownMenuItem>);
    expect(
      screen.getByRole("menuitem", { name: "Sign out" }),
    ).toBeInTheDocument();
  });
});
