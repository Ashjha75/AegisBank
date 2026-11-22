import "@/styles/docs.css";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { LogoMark } from "@/components/brand/logo";
import { DOCS_BASE_URL, source } from "@/lib/docs/source";

export const metadata = {
  title: { default: "Engineering notes", template: "%s · AegisBank notes" },
  robots: { index: false, follow: false },
};

/**
 * Private docs UI (password-protected by src/proxy.ts). Light only: the warm paper reading theme
 * (styles/docs-theme.css), so the theme switch is hidden and the theme is forced.
 */
export default function DocsUiLayout({
  children,
}: LayoutProps<"/v1/admin/docs-ui">) {
  return (
    <RootProvider
      search={{ options: { api: `${DOCS_BASE_URL}/api/search` } }}
      theme={{
        forcedTheme: "light",
        defaultTheme: "light",
        enableSystem: false,
      }}
    >
      <DocsLayout
        tree={source.getPageTree()}
        themeSwitch={{ enabled: false }}
        nav={{
          title: (
            <span className="inline-flex items-center gap-2">
              <LogoMark className="size-5" />
              <span className="font-display font-semibold tracking-[-0.02em]">
                AegisBank
              </span>
              <span className="font-normal text-fd-muted-foreground">
                notes
              </span>
            </span>
          ),
          url: DOCS_BASE_URL,
        }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
