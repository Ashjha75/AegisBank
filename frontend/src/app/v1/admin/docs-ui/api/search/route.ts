import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/docs/source";

/** Full-text search for the docs UI (Ctrl/⌘ K). Behind the same password as the docs. */
export const { GET } = createFromSource(source);
