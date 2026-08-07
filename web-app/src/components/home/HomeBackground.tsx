"use client";

import { useEffect, useRef, useState } from "react";

/**
 * DP's looping "colorflow" background (`AppLayout`'s `showBackground` prop) —
 * Home-only, every other page keeps a plain dark background. The CSS
 * (`.app-layout__background` / `--fading` / `-scrim`, including the
 * `<768px` hide rule) is already in `src/styles/designer/AppLayout.css` — it
 * came across untouched with that file, the video element just never got
 * rendered from the WA side, so the rules had nothing to paint.
 *
 * DP name-imports these 5 files (`import bgAnimation01 from '...mp4?url'`) —
 * fine for Vite, but Next has no equivalent, and the hero videos already
 * proved that pattern doesn't survive the port (`DESIGNER-TODO` A12). Same
 * fix as `home/heroItems.ts`: copied into `public/assets/backgrounds/` and
 * referenced by path string instead. Only 2.1 MB total for all five, so
 * there's no `covers/`/`storyboard-clips/`-style size question here.
 */
const BACKGROUND_VIDEOS = [
  "/assets/backgrounds/colorflow-animation-tmp.mp4",
  "/assets/backgrounds/colorflow-animation-01-tmp.mp4",
  "/assets/backgrounds/colorflow-animation-02_converted.mp4",
  "/assets/backgrounds/colorflow-animation-03-tmp.mp4",
  "/assets/backgrounds/colorflow-animation-04-tmp.mp4",
];
const ROTATE_MS = 60000;
const FADE_MS = 800;

export function HomeBackground() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const activeIndexRef = useRef(activeIndex);
  const fadeTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = (activeIndexRef.current + 1) % BACKGROUND_VIDEOS.length;
      setActiveIndex(next);
      setIsFading(true);
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = window.setTimeout(() => {
        setDisplayedIndex(next);
        setIsFading(false);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => window.clearTimeout(fadeTimeoutRef.current), []);

  return (
    <>
      <video
        key={BACKGROUND_VIDEOS[displayedIndex]}
        className={`app-layout__background${isFading ? " app-layout__background--fading" : ""}`}
        src={BACKGROUND_VIDEOS[displayedIndex]}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="app-layout__background-scrim" aria-hidden="true" />
    </>
  );
}
