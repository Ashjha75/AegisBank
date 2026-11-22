import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/notebook/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMDXComponents } from "@/components/docs/mdx-components";
import { source } from "@/lib/docs/source";

type Props = PageProps<"/v1/admin/docs-ui/[[...slug]]">;

/**
 * Reading `params` happens inside <Suspense> so the docs shell (top bar, sidebar) renders instantly on
 * client navigation and the page streams in (Next.js instant navigation). Every page is still
 * prerendered at build time through generateStaticParams.
 */
export default function DocsPageRoute(props: Props) {
  return (
    <Suspense fallback={<DocsPageFallback />}>
      <DocsPageContent params={props.params} />
    </Suspense>
  );
}

async function DocsPageContent({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {/* createRelativeLink: link between pages with relative file paths, e.g. [SAGA](./transaction-service.mdx) */}
        <MDX
          components={getMDXComponents({ a: createRelativeLink(source, page) })}
        />
      </DocsBody>
    </DocsPage>
  );
}

function DocsPageFallback() {
  return (
    <div className="docs-page-fallback" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <div className="h-9 w-2/5 rounded-full" />
      <div className="h-4 w-3/5 rounded-full" />
      <div className="mt-6 h-40 w-full rounded-[var(--radius-card)]" />
    </div>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
