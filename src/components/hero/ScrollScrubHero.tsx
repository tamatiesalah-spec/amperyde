"use client";

// Cinematic scroll-scrub hero: a preloaded image SEQUENCE drawn to a <canvas>,
// where scroll position through a tall container maps to a frame index (the
// "Apple product page" technique) — not a video.
//
// Performance:
//  - frames preloaded once; nothing is fetched on scroll
//  - a redraw happens only when the target frame index CHANGES, inside a single
//    requestAnimationFrame (scroll listener is passive and does no drawing)
//  - the canvas backing store is sized to devicePixelRatio (capped at 2) and
//    only re-sized when the element's CSS size actually changes
//
// Frames come from heroFrameUrl() — placeholder SVGs today, repointable to real
// turntable frames or a CDN sequence later with no change here.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HERO_FRAME_COUNT, heroFrameUrl } from "@/lib/heroFrames";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export function ScrollScrubHero({
  children,
  heightVh = 340,
}: {
  children?: ReactNode;
  heightVh?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const desired = useRef(0);
  const drawn = useRef(-1);
  const raf = useRef(0);

  const [loadedCount, setLoadedCount] = useState(0);
  const ready = loadedCount >= HERO_FRAME_COUNT;

  // Draw a frame, cover-fit and DPR-aware.
  function drawFrame(index: number) {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const ir = img.naturalWidth / img.naturalHeight;
    const cr = w / h;
    let dw: number;
    let dh: number;
    if (cr > ir) {
      dw = w;
      dh = w / ir;
    } else {
      dh = h;
      dw = h * ir;
    }
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    drawn.current = index;
  }

  function render() {
    const i = desired.current;
    if (i !== drawn.current) drawFrame(i);
  }

  function schedule() {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(render);
  }

  // Preload the sequence.
  useEffect(() => {
    let cancelled = false;
    let count = 0;
    const imgs: HTMLImageElement[] = new Array(HERO_FRAME_COUNT);
    for (let i = 0; i < HERO_FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      const done = () => {
        if (cancelled) return;
        count += 1;
        setLoadedCount(count);
        // Paint as soon as the currently-needed frame is available.
        if (i === desired.current) schedule();
      };
      img.onload = done;
      img.onerror = done;
      img.src = heroFrameUrl(i);
      imgs[i] = img;
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map scroll → frame index; redraw on resize.
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const progress = total > 0 ? clamp(-el.getBoundingClientRect().top / total, 0, 1) : 0;
      const frame = Math.round(progress * (HERO_FRAME_COUNT - 1));
      if (frame !== desired.current) {
        desired.current = frame;
        schedule();
      }
    };
    const onResize = () => {
      drawn.current = -1; // force a redraw at the new size
      onScroll();
      schedule();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Overlay fades/lifts away as the sequence plays.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.28, 0.5], [1, 1, 0]);
  const overlayY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <section ref={containerRef} style={{ height: `${heightVh}vh` }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="h-full w-full" aria-hidden />

        {/* Vignette for text legibility over the sequence. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/70 via-transparent to-bg" />

        {/* Overlay content */}
        <motion.div
          style={{ opacity: overlayOpacity, y: overlayY }}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          {children}
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          style={{ opacity: cueOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-faint"
        >
          <span className="eyebrow">Scroll</span>
          <span className="h-8 w-px bg-gradient-to-b from-faint to-transparent" />
        </motion.div>

        {/* Preload progress */}
        {!ready && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-surface-2">
            <div
              className="h-full bg-brand transition-[width] duration-200"
              style={{ width: `${(loadedCount / HERO_FRAME_COUNT) * 100}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
