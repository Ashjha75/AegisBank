import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Button } from "@/components/ui/button";
import { Endpoint, MethodBadge, Responses } from "./api/endpoint";
import { Callout } from "./blocks/callout";
import { Decision } from "./blocks/decision";
import { DocsCodeBlock } from "./code/code-block";
import { Example } from "./code/example";
import {
  ComponentGallery,
  GalleryAppShell,
  GalleryButtons,
  GalleryDataTable,
  GalleryDataTableStates,
  GalleryFeedback,
  GalleryForms,
  GalleryLoaders,
  GalleryNavigation,
  GalleryOverlays,
  GalleryReusableBlocks,
  GallerySearchableSelect,
  GalleryStatusPages,
} from "./component-gallery";
import { ColorTokens, TypeScale } from "./design-tokens";
import { Arrow, Box, Diagram, Note } from "./diagrams/diagram";
import { ProxyPath, SystemMap, TransferStates } from "./diagrams/library";
import { DiagramLegend, SequenceDiagram } from "./diagrams/sequence-diagram";
import { IconGallery, Ph } from "./icons";

/**
 * Components available in every MDX page without importing them (full guide: Frontend > Docs toolkit).
 *
 * Writing
 *   <Callout type="tip|info|warn|error|success" title="...">   highlighted note
 *   <Steps><Step>...</Step></Steps>                            numbered walkthrough
 *   <Tabs items={["A","B"]}><Tab value="A">                    tabbed content
 *   <Accordions><Accordion title="...">                         FAQ / collapsible detail
 *   <Ph name="Vault" />  <IconGallery />                        Phosphor icons
 * Code
 *   ```ts title="x.ts"  ```bash tab="cURL"  ```npm  fences (see lib/docs/source.ts)
 *   <Example code={`...`}>live preview</Example>              Live example / Code tabs
 *   <Files><Folder name="src"><File name="a.ts" /></Folder></Files>   file tree
 * API and architecture
 *   <Endpoint method="POST" path="/api/v1/..." auth status summary>  API operation
 *   <Responses items={[{ status, code, description }]} />       status codes / error codes
 *   <TypeTable type={{ field: { type, description, required } }} />  request / DTO fields
 *   <MethodBadge method="GET" />                                inline HTTP method
 *   <Decision id="ADR-001" status="accepted" date="..." />      ADR header
 *   <SequenceDiagram participants steps />                    auto-laid-out sequence
 *   <Diagram><Box /><Arrow /></Diagram>                        hand-drawn flow (never Mermaid)
 *   <SystemMap /> <TransferStates /> <ProxyPath />              named system diagrams
 * Design system
 *   <ColorTokens /> <TypeScale /> <Gallery... />                live component previews
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: DocsCodeBlock,
    Callout,
    Steps,
    Step,
    Tabs,
    Tab,
    Accordion,
    Accordions,
    Files,
    Folder,
    File,
    TypeTable,
    Endpoint,
    Responses,
    MethodBadge,
    Decision,
    Example,
    Button,
    Diagram,
    Box,
    Arrow,
    Note,
    DiagramLegend,
    SequenceDiagram,
    SystemMap,
    TransferStates,
    ProxyPath,
    ColorTokens,
    TypeScale,
    Ph,
    IconGallery,
    ComponentGallery,
    GalleryButtons,
    GalleryForms,
    GalleryDataTable,
    GalleryDataTableStates,
    GallerySearchableSelect,
    GalleryReusableBlocks,
    GalleryOverlays,
    GalleryFeedback,
    GalleryLoaders,
    GalleryNavigation,
    GalleryAppShell,
    GalleryStatusPages,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
