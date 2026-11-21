import { LogoMark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-border border-t bg-background">
      <div className="mx-auto flex max-w-(--container-max) flex-col gap-3 px-5 py-8 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="flex items-center gap-2">
          <LogoMark className="size-4" />© AegisBank
        </span>
        <span>
          A learning project. Not a real bank - no real money is held or moved.
        </span>
      </div>
    </footer>
  );
}
