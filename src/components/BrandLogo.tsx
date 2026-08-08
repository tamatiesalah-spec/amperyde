// The AMPERYDE lockup (transparent PNG derived from logo/main logo.png).
// Plain <img> — a brand mark from /public needs no image optimization.

export function BrandLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/amperyde-logo.png" alt="AMPERYDE" className={className} draggable={false} />
  );
}
