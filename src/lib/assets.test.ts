import { describe, expect, it } from "vitest";
import { resolveAssetUrl } from "@/lib/assets";

// NEXT_PUBLIC_ASSET_BASE_URL is unset in tests, so bare paths resolve against
// /public (the default). The CDN-prefix branch is a thin string concat over the
// same normalization exercised here.

describe("resolveAssetUrl", () => {
  it("returns undefined for empty refs", () => {
    expect(resolveAssetUrl(undefined)).toBeUndefined();
    expect(resolveAssetUrl(null)).toBeUndefined();
    expect(resolveAssetUrl("")).toBeUndefined();
  });

  it("passes absolute and data URLs through untouched", () => {
    expect(resolveAssetUrl("https://cdn.example.com/x.png")).toBe("https://cdn.example.com/x.png");
    expect(resolveAssetUrl("http://cdn.example.com/x.png")).toBe("http://cdn.example.com/x.png");
    expect(resolveAssetUrl("//cdn.example.com/x.png")).toBe("//cdn.example.com/x.png");
    expect(resolveAssetUrl("data:image/svg+xml,<svg/>")).toBe("data:image/svg+xml,<svg/>");
  });

  it("normalizes bare paths to a leading slash (served from /public)", () => {
    expect(resolveAssetUrl("/assets/x.svg")).toBe("/assets/x.svg");
    expect(resolveAssetUrl("assets/x.svg")).toBe("/assets/x.svg");
  });
});
