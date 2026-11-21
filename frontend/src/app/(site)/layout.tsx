import "@/styles/site.css";
import { AppProviders } from "@/components/providers/app-providers";

/** Customer-facing site. Everything here uses only design-token classes (see styles/site.css). */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <AppProviders>{children}</AppProviders>;
}
