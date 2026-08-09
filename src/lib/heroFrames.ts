// Hero frame-sequence references. Placeholder SVG frames today; repoint to a
// real turntable/render sequence or a CDN (Cloudinary/Mux) later exactly like
// the layer assets — the scrub mechanism only consumes resolved URLs.
//
// HERO_FRAME_COUNT is duplicated in scripts/generate-hero-frames.mts (which
// can't import this aliased module under Node's type-stripping); keep in sync.

import { resolveAssetUrl } from "@/lib/assets";

export const HERO_FRAME_COUNT = 40;

/** Opaque reference for frame i (0-based). */
export function heroFrameRef(i: number): string {
  return `/assets/hero/frame-${String(i).padStart(4, "0")}.svg`;
}

/** Resolved URL for frame i (honors NEXT_PUBLIC_ASSET_BASE_URL / CDN). */
export function heroFrameUrl(i: number): string {
  return resolveAssetUrl(heroFrameRef(i))!;
}
