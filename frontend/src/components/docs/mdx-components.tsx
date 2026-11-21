import { Callout } from "fumadocs-ui/components/callout";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ArchitectureMap } from "./architecture-map";
import { ComponentGallery } from "./component-gallery";
import { ColorTokens, TypeScale } from "./design-tokens";
import { Mermaid } from "./mermaid";

/**
 * Components available in every MDX page without importing them:
 *   <Mermaid chart={`...`} caption="..." />   any Mermaid diagram
 *   <ArchitectureMap />                       interactive system map
 *   <Callout type="info|warn|error">          highlighted note
 *   <Steps><Step>...</Step></Steps>           numbered walkthrough
 *   <Tabs items={["A","B"]}><Tab value="A">   tabbed content
 *   <ColorTokens /> <TypeScale /> <ComponentGallery />  design-system page
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Callout,
    Steps,
    Step,
    Tabs,
    Tab,
    Mermaid,
    ArchitectureMap,
    ColorTokens,
    TypeScale,
    ComponentGallery,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
