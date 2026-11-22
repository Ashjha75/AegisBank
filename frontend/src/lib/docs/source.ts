import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins";
import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { applyMdxPreset } from "fumadocs-mdx/config";
import { defineDocs } from "fumadocs-mdx/macro";

/** URL the docs UI lives under. Also used by src/proxy.ts for password protection. */
export const DOCS_BASE_URL = "/v1/admin/docs-ui";

/**
 * MDX pages in content/docs, compiled at build time by fumadocs-mdx (see next.config.ts).
 * Each folder can have a meta.json that orders its pages in the sidebar.
 *
 * Markdown features (all standard Fumadocs):
 *   ```ts title="file.ts" lineNumbers      code block with a title bar and line numbers
 *   ```bash tab="cURL"  / ```ts tab="fetch"   consecutive blocks with `tab` become tabs
 *   ```npm                                 npm command shown as npm / pnpm / yarn / bun tabs
 *   ```mermaid                             rendered as a <Mermaid> diagram
 * Code is highlighted with Shiki in one dark theme (navy blocks, see docs.css).
 */
const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    // Collection-level options replace the default preset, so apply it explicitly.
    mdxOptions: applyMdxPreset({
      rehypeCodeOptions: {
        themes: { light: "tokyo-night", dark: "tokyo-night" },
      },
      remarkPlugins: [remarkMdxMermaid],
    }),
  },
  meta: { schema: metaSchema },
});

export const source = loader({
  baseUrl: DOCS_BASE_URL,
  source: docs.toFumadocsSource(),
  // lets frontmatter `icon: Workflow` (any lucide icon name) show in the sidebar
  plugins: [lucideIconsPlugin()],
});
