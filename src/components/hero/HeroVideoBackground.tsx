"use client";

// Landing-hero background video. TEMPORARY placeholder treatment — the planned
// canvas scroll-scrub hero (ScrollScrubHero) stays in the codebase, dormant,
// until real turntable/render frames exist.
//
// Behaviour:
//  - autoplay + muted + loop + playsInline, no controls, object-cover
//  - a poster still renders immediately underneath, so there's never a blank
//    frame while the video loads
//  - mobile (coarse pointer / small viewport) and reduced-motion users get the
//    poster only — many mobile browsers block muted autoplay for data/battery,
//    so we don't risk a frozen/broken player
//  - if autoplay is rejected on desktop anyway, we drop back to the poster

import { useEffect, useRef, useState } from "react";

const POSTER = "/img/hero-poster.jpg";

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(false);

  // Decide whether to even attempt video (client-only; SSR shows poster).
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia(
      "(max-width: 767px), (hover: none) and (pointer: coarse)",
    ).matches;
    setUseVideo(!reduced && !mobile);
  }, []);

  // Force muted before play() (autoplay policies) and fall back on rejection.
  useEffect(() => {
    if (!useVideo) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const attempt = v.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => setUseVideo(false));
    }
  }, [useVideo]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-bg">
      {/* Poster always underneath — no flash-of-nothing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER}
        alt=""
        aria-hidden
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {useVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={POSTER}
          aria-hidden
          tabIndex={-1}
          onError={() => setUseVideo(false)}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/video/hero-background.webm" type="video/webm" />
          <source src="/video/hero-background.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
