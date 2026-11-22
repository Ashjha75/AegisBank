"use client";

import { GalleryButtons, GalleryForms } from "./gallery/basics";
import { GalleryDataTable, GalleryDataTableStates } from "./gallery/data";
import {
  GalleryFeedback,
  GalleryLoaders,
  GalleryNavigation,
  GalleryOverlays,
} from "./gallery/overlays";
import {
  GalleryReusableBlocks,
  GallerySearchableSelect,
} from "./gallery/reusable";
import { GalleryAppShell, GalleryStatusPages } from "./gallery/screens";

/**
 * Live previews of the component kit, used by the docs pages under "Frontend".
 * Each section is also available on its own in MDX (<GalleryButtons />, <GalleryDataTable /> ...).
 */
export {
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
};

/** Everything at once. */
export function ComponentGallery() {
  return (
    <>
      <GalleryButtons />
      <GalleryForms />
      <GalleryDataTable />
      <GalleryOverlays />
      <GalleryFeedback />
      <GalleryLoaders />
      <GalleryNavigation />
    </>
  );
}
