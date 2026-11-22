import {
  BookOpenText,
  Cube,
  GitFork,
  Palette,
  PlugsConnected,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { DOCS_BASE_URL } from "@/lib/docs/source";

/**
 * Coloured shortcuts at the top of the docs sidebar (the big entry points), above the page tree.
 * Phosphor duotone icons, each with its own tint so they're easy to tell apart at a glance.
 */
const shortcuts = [
  {
    label: "Overview",
    href: "",
    Icon: BookOpenText,
    tint: "text-[oklch(0.55_0.12_250)]",
  },
  {
    label: "Architecture",
    href: "/architecture",
    Icon: GitFork,
    tint: "text-[oklch(0.55_0.13_300)]",
  },
  {
    label: "API reference",
    href: "/services/transaction-api",
    Icon: PlugsConnected,
    tint: "text-[oklch(0.58_0.13_40)]",
  },
  {
    label: "Decisions",
    href: "/decisions",
    Icon: Cube,
    tint: "text-[oklch(0.52_0.1_165)]",
  },
  {
    label: "Design system",
    href: "/frontend/design-system",
    Icon: Palette,
    tint: "text-[oklch(0.6_0.14_350)]",
  },
];

export function SidebarShortcuts() {
  return (
    <nav aria-label="Shortcuts" className="docs-shortcuts">
      {shortcuts.map(({ label, href, Icon, tint }) => (
        <Link
          key={label}
          href={`${DOCS_BASE_URL}${href}`}
          className="docs-shortcut"
        >
          <Icon size={20} weight="duotone" className={tint} aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
