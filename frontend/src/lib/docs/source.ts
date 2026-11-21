import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";

/** URL the docs UI lives under. Also used by src/proxy.ts for password protection. */
export const DOCS_BASE_URL = "/v1/admin/docs-ui";

/**
 * MDX pages in content/docs, compiled at build time by fumadocs-mdx (see next.config.ts).
 * Each folder can have a meta.json that orders its pages in the sidebar.
 */
const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: pageSchema },
  meta: { schema: metaSchema },
});

export const source = loader({
  baseUrl: DOCS_BASE_URL,
  source: docs.toFumadocsSource(),
  // lets frontmatter `icon: Workflow` (any lucide icon name) show in the sidebar
  plugins: [lucideIconsPlugin()],
});
