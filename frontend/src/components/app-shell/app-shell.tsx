"use client";

import { LogOut, type LucideIcon, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input, InputGroup } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { PageHeader } from "@/components/ui/page-header";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

/**
 * Reusable layout for any signed-in area: left sidebar + slim top bar, drawer on mobile.
 * Everything is passed in - the menu, the user, extra top-bar buttons, the user-menu items.
 *
 *   <AppShell nav={BANKING_NAV} user={{ name, email }} title="Transactions" actions={<Button>Export</Button>}>
 *     ...page...
 *   </AppShell>
 *
 * The active menu item is found from the URL (exact match or a child route); pass `active`
 * (an item's href) to override it.
 */
export type AppNavItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  /** Small count or label on the right, e.g. a <Badge>. */
  badge?: React.ReactNode;
};

export type AppNavSection = {
  /** Optional heading above the group ("Account"). */
  label?: string;
  items: AppNavItem[];
};

export interface AppShellProps {
  nav: AppNavSection[];
  user: { name: string; email?: string; avatarUrl?: string };
  /** href of the active item. Default: matched against the current URL. */
  active?: string;
  /** Top-left brand. Default: the AegisBank logo linking to "/". */
  brand?: React.ReactNode;
  /** Search box in the top bar. `false` hides it; a node replaces it. */
  search?: React.ReactNode | false;
  /** Extra top-bar buttons (help, notifications), shown before the avatar. */
  topbarActions?: React.ReactNode;
  /** Items in the account menu above "Sign out" (DropdownMenuItem elements). */
  userMenu?: React.ReactNode;
  onSignOut?: () => void;
  /** Bottom of the sidebar (a notice, a plan card). */
  sidebarFooter?: React.ReactNode;
  /** Page heading inside the content area. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function isActive(href: string, active: string | undefined, pathname: string) {
  if (active !== undefined) return href === active;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function SidebarNav({
  nav,
  active,
  pathname,
}: {
  nav: AppNavSection[];
  active?: string;
  pathname: string;
}) {
  return (
    <nav aria-label="Main" className="grid gap-6">
      {nav.map((section, index) => (
        <div key={section.label ?? index} className="grid gap-1.5">
          {section.label && (
            <p className="px-2.5 font-medium text-overline text-subtle-foreground uppercase">
              {section.label}
            </p>
          )}
          <ul className="grid gap-0.5">
            {section.items.map(({ label, href, Icon, badge }) => {
              const current = isActive(href, active, pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-2.5 rounded-md border px-2.5 font-medium text-body-sm transition-colors duration-fast",
                      current
                        ? "border-border bg-surface text-foreground shadow-xs"
                        : "border-transparent text-muted-foreground hover:bg-secondary-hover hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn("size-4", current && "text-brand")}
                      strokeWidth={1.85}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {badge}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  nav,
  user,
  active,
  brand,
  search,
  topbarActions,
  userMenu,
  onSignOut,
  sidebarFooter,
  title,
  description,
  actions,
  children,
  className,
}: AppShellProps) {
  const pathname = usePathname() ?? "";

  const sidebar = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-4">
      <div className="px-2">
        {brand ?? (
          <Link
            href="/"
            aria-label="AegisBank home"
            className="w-fit rounded-sm"
          >
            <Logo />
          </Link>
        )}
      </div>
      <SidebarNav nav={nav} active={active} pathname={pathname} />
      {sidebarFooter && <div className="mt-auto">{sidebarFooter}</div>}
    </div>
  );

  return (
    <div
      className={cn(
        "grid min-h-dvh bg-background lg:grid-cols-[var(--sidebar-width)_1fr]",
        className,
      )}
    >
      <aside className="hidden border-border border-r bg-sidebar lg:block">
        <div className="sticky top-0 h-dvh max-h-full">{sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-(--z-sticky) flex h-14 items-center gap-3 border-border border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>

          {search === false
            ? null
            : (search ?? (
                <InputGroup
                  start={<Search aria-hidden="true" />}
                  end={
                    <span className="hidden gap-0.5 sm:flex">
                      <Kbd>⌘</Kbd>
                      <Kbd>K</Kbd>
                    </span>
                  }
                  className="max-w-sm"
                >
                  <Input
                    type="search"
                    placeholder="Search"
                    aria-label="Search"
                    className="h-8 bg-surface-subtle shadow-none"
                  />
                </InputGroup>
              ))}

          <div className="ml-auto flex items-center gap-1">
            {topbarActions}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1 cursor-pointer rounded-full"
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} src={user.avatarUrl} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="grid gap-0.5 px-2.5 py-2">
                  <span className="font-medium text-body-sm text-foreground">
                    {user.name}
                  </span>
                  {user.email && (
                    <span className="truncate text-caption text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </div>
                {userMenu && (
                  <>
                    <DropdownMenuSeparator />
                    {userMenu}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem tone="danger" onSelect={onSignOut}>
                  <LogOut aria-hidden="true" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {(title || actions) && (
            <PageHeader
              title={title}
              description={description}
              actions={actions}
              className="mb-6"
            />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
