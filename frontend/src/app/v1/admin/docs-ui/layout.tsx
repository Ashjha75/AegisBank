import "@/styles/docs.css";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { RootProvider } from "fumadocs-ui/provider/next";
import { LogoMark } from "@/components/brand/logo";
import { SidebarShortcuts } from "@/components/docs/shell/sidebar-shortcuts";
import { DOCS_BASE_URL, source } from "@/lib/docs/source";

export const metadata = {
  title: { default: "Engineering notes", template: "%s · AegisBank notes" },
  robots: { index: false, follow: false },
};

const page = (path: string) => `${DOCS_BASE_URL}/${path}`;

/**
 * Private docs UI (password-protected by src/proxy.ts). Notebook layout: a full-width top bar
 * (title, version, search, links) with the page tree below it. Light only - the "sage" reading theme
 * in styles/docs-theme.css.
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
          mode: "top",
          title: (
            <span className="inline-flex items-center gap-2.5">
              <LogoMark className="size-6" />
              <span className="font-semibold text-[1.0625rem] tracking-[-0.02em]">
                AegisBank
              </span>
              <span className="docs-version-pill">dev_v1</span>
            </span>
          ),
          url: DOCS_BASE_URL,
        }}
        links={[
          { text: "Architecture", url: page("architecture"), on: "nav" },
          { text: "API", url: page("services/transaction-api"), on: "nav" },
          { text: "Decisions", url: page("decisions"), on: "nav" },
          {
            text: "Design system",
            url: page("frontend/design-system"),
            on: "nav",
          },
        ]}
        sidebar={{ banner: <SidebarShortcuts />, collapsible: false }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
