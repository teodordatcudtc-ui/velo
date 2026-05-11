"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hero demo: poster ca prim cadru, overlay la pauză — click oriunde pe zonă pornește redarea.
 */
export function HeroDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);

  const syncOverlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setOverlayVisible(v.paused);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    syncOverlay();
    v.addEventListener("play", syncOverlay);
    v.addEventListener("pause", syncOverlay);
    return () => {
      v.removeEventListener("play", syncOverlay);
      v.removeEventListener("pause", syncOverlay);
    };
  }, [syncOverlay]);

  const handleOverlayClick = () => {
    void videoRef.current?.play();
  };

  return (
    <div className="hero-demo hero-demo-video-wrap">
      {overlayVisible && (
        <button
          type="button"
          className="hero-demo-play-overlay"
          onClick={handleOverlayClick}
          aria-label="Redă demo video"
        >
          <span className="hero-demo-play-badge" aria-hidden>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
      <video
        ref={videoRef}
        className="hero-demo-video"
        poster="/hero-demo-poster.jpg"
        muted
        loop
        playsInline
        controls
        preload="none"
        aria-label="Demo video Vello"
      >
        <source src="/demo2.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
