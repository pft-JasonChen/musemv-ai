"use client";

import { createPortal } from "react-dom";
import { useIsMounted } from "@/lib/ssr";
import { setHomeLayout, useHomeLayout, type HomeLayout } from "@/lib/homeLayout";

/**
 * A/B switch for the Home composer layout (see `lib/homeLayout`). A small
 * fixed segmented control, top-left on the navbar row; temporary, for UX testing.
 * Portalled to <body>: the sticky navbar (z-index 20) lives in a stacking
 * context that sits above the page content's, so from inside the page the
 * toggle would be drawn under it and unclickable whatever its own z-index.
 */
const OPTIONS: { id: HomeLayout; hint: string }[] = [
  { id: "A", hint: "Music Video and Song as pills below the composer" },
  { id: "B", hint: "Tab bar above the composer" },
];

export function HomeLayoutToggle() {
  const layout = useHomeLayout();
  const mounted = useIsMounted();
  if (!mounted) return null;
  return createPortal(
    <div className="home-layout-toggle" role="group" aria-label="Home layout">
      <span className="home-layout-toggle__label" aria-hidden="true">
        Layout
      </span>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`home-layout-toggle__opt${layout === o.id ? " home-layout-toggle__opt--on" : ""}`}
          aria-pressed={layout === o.id}
          title={o.hint}
          onClick={() => setHomeLayout(o.id)}
        >
          {o.id}
        </button>
      ))}
    </div>,
    document.body,
  );
}
