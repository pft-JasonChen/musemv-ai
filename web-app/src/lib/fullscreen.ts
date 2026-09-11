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
