import { useEffect, useState } from "react";

// YMW260907P0012: iOS Safari has no Fullscreen API for arbitrary elements —
// only `<video>` exposes the non-standard `webkitEnterFullscreen()`. Calling
// `container.requestFullscreen()` there either doesn't exist or rejects
// silently, so the button did nothing on iPhone. Shared by
// `CommunityMvPlayer` and `MvPreviewCard` (its second consumer).
type WebkitVideoElement = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export function toggleMvFullscreen(
  container: HTMLElement | null,
  video: HTMLVideoElement | null,
) {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  const fallbackToVideo = () => (video as WebkitVideoElement | null)?.webkitEnterFullscreen?.();
  if (container?.requestFullscreen) {
    void container.requestFullscreen().catch(fallbackToVideo);
  } else {
    fallbackToVideo();
  }
}

/**
 * Reported bug, 2026-09-22: every fullscreen button always showed `ic_expand`,
 * even while already fullscreen — so there was no way to tell it would
 * (should) exit, and every button rendered the SAME icon whether entering or
 * leaving. `document.fullscreenElement` doesn't re-render anything on its
 * own — the standard `fullscreenchange` event is the only way to know the
 * state changed, including changes this button didn't cause itself (Escape,
 * the browser's own "Exit full screen" control, another tab's element).
 * Shared here rather than duplicated per screen for the same reason
 * `toggleMvFullscreen` above is shared: identical behavior at every one of
 * its five call sites, not a per-screen layout difference.
 *
 * iOS Safari's `webkitEnterFullscreen()` fallback above is a DIFFERENT,
 * non-standard fullscreen mode (native OS video chrome, not a DOM element) —
 * it never sets `document.fullscreenElement` and fires no `fullscreenchange`
 * event, so this hook cannot see it. Out of scope here: the icon will simply
 * stay "expand" for that fallback path, same as before this fix.
 */
export function useIsFullscreen(): boolean {
  const [isFullscreen, setIsFullscreen] = useState(
    typeof document !== "undefined" && !!document.fullscreenElement,
  );
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);
  return isFullscreen;
}
