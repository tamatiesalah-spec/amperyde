// Source-agnostic asset resolution.
//
// layerAsset / closeupAsset on a component are OPAQUE references. The renderer
// resolves them to a URL and draws them; it never knows or cares whether a
// reference points at staged photography, a rendered turntable frame, or a CDN
// (Cloudinary/Mux) object. This is the seam that makes migrating assets
// category-by-category — or per option — a data-only change:
//
//   * absolute URLs (https://…, data:…) pass through untouched
//     (use these for CDN objects or externally-hosted renders)
//   * bare paths resolve against NEXT_PUBLIC_ASSET_BASE_URL if set, else are
//     served from /public as-is (staged photography today)
//
// Nothing else in the app should special-case an asset's origin.

const BASE = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "") ?? "";

function isAbsolute(ref: string): boolean {
  return /^(https?:)?\/\//.test(ref) || ref.startsWith("data:");
}

/** Resolve an opaque asset reference to a concrete URL, or undefined if unset. */
export function resolveAssetUrl(ref: string | undefined | null): string | undefined {
  if (!ref) return undefined;
  if (isAbsolute(ref)) return ref;
  const path = ref.startsWith("/") ? ref : `/${ref}`;
  return BASE ? `${BASE}${path}` : path;
}
