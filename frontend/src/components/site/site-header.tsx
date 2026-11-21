import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";

const nav = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-(--z-sticky) border-border/80 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-(--header-height) max-w-(--container-max) items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="AegisBank home" className="rounded-sm">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-medium text-label text-muted-foreground transition-colors duration-fast hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Badge tone="accent" dot>
          In development
        </Badge>
      </div>
    </header>
  );
}
