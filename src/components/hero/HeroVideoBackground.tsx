"use client";

// Landing-hero background video. TEMPORARY placeholder treatment — the planned
// canvas scroll-scrub hero (ScrollScrubHero) stays in the codebase, dormant,
// until real turntable/render frames exist.
//
// Behaviour:
//  - autoplay + muted + loop + playsInline, no controls, object-cover, centered
//  - a poster still renders immediately underneath, so there's never a blank
//    frame while the video loads
//  - we ATTEMPT autoplay on every device (muted + playsInline autoplay works on
//    modern mobile) and fall back to the poster only if autoplay is actually
//    rejected — detecting real failure rather than guessing by screen size
//  - reduced-motion users get the poster only and the video is never loaded

import { useEffect, useRef, useState } from "react";

const POSTER = "/img/hero-poster.jpg";

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(false);

  // Load the video unless the user prefers reduced motion. Not gated on screen
  // size — mobile gets the video too, with the autoplay-failure fallback below.
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setUseVideo(true);
    }
  }, []);

  // Force muted before play() (autoplay policy), fall back to poster on reject.
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
        className="absolute inset-0 h-full w-full object-cover object-center"
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
          className="absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src="/video/hero-background.webm" type="video/webm" />
          <source src="/video/hero-background.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
