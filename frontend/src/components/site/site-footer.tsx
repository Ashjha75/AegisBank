import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Security", href: "/#security" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Learning project", href: "/#how-it-works" },
      { label: "No real money", href: "/#security" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-border border-t bg-background">
      <div className="mx-auto grid max-w-(--container-max) gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-xs text-body-sm text-muted-foreground">
            Digital banking that screens every transfer before money moves.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="grid content-start gap-3">
            <p className="font-medium text-label text-foreground">
              {column.title}
            </p>
            <ul className="grid gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-muted-foreground transition-colors duration-fast hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-border border-t">
        <div className="mx-auto flex max-w-(--container-max) flex-col gap-2 px-5 py-5 text-caption text-subtle-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="flex items-center gap-2">
            <span
              className="size-1.5 rounded-full bg-warning"
              aria-hidden="true"
            />
            In development - not yet live
          </span>
          <span>© AegisBank · A learning project, not a real bank.</span>
        </div>
      </div>
    </footer>
  );
}
