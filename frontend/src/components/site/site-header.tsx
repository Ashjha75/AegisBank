import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-(--z-sticky) border-border border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-(--header-height) max-w-(--container-max) items-center gap-8 px-5 sm:px-8">
        <Link href="/" aria-label="AegisBank home" className="rounded-sm">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-body-sm text-muted-foreground transition-colors duration-fast hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Badge tone="brand" dot className="hidden sm:inline-flex">
            In development
          </Badge>
          <Button asChild size="sm">
            <Link href="/app">Open the app</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
