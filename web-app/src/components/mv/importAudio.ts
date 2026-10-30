import type { Song } from "@/lib/mv/types";
import { MIN_TRIM_SEC } from "./TrimAudioModal";

/**
 * Import a local audio file as a `Song`, applying `/mv/room`'s rules. Moved
 * out of `MvRoom` on 2026-10-30 so Home's MV input ("Import Audio") applies
 * the very same rules; both call it with their own trim-dialog opener and
 * error toast.
 *
 * · MV-02: MP3 / AAC / WAV / M4A only, up to 50MB.
 * · MV-01 / S2 (product owner, 2026-09-01): an MV needs at least 30s of audio.
 *   `TrimAudioModal` enforces that on the SELECTION, but a track that is itself
 *   shorter cannot be trimmed UP to it — letting it through opened the trim
 *   dialog on a dead end (Confirm permanently disabled). So it is rejected
 *   here. `durationSec === 0` is the probe's FAILURE fallback (metadata never
 *   loaded), not a zero-length file — it is NOT rejected, or an unreadable-
 *   but-valid track would become unusable; it goes on to the trim dialog.
 * · A local file has no album art this app can read (no ID3 extraction, no
 *   backend), so `art` is empty and every `song.art && <img/>` consumer falls
 *   back to its placeholder background instead of a fake cover.
 */
export function importAudioFile(
  file: File,
  onSong: (song: Song) => void,
  onError: (message: string) => void,
) {
  const name = file.name.toLowerCase();
  const okExt = [".mp3", ".aac", ".wav", ".m4a"].some((ext) => name.endsWith(ext));
  const okType = /audio\/(mpeg|mp3|aac|wav|x-wav|wave|mp4|x-m4a)/.test(file.type);
  if (!okExt && !okType) {
    onError("Unsupported format. Use MP3, AAC, WAV, or M4A.");
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    onError("File too large. Maximum size is 50MB.");
    return;
  }
  const url = URL.createObjectURL(file);
  const title = file.name.replace(/\.[^/.]+$/, "").trim() || "Imported audio";
  const open = (durationSec: number) => {
    if (durationSec > 0 && durationSec < MIN_TRIM_SEC) {
      onError(`Audio must be at least ${MIN_TRIM_SEC} seconds.`);
      URL.revokeObjectURL(url);
      return;
    }
    onSong({ id: crypto.randomUUID(), source: "import", title, durationSec, art: "", url });
  };
  const probe = new Audio();
  probe.preload = "metadata";
  probe.src = url;
  probe.addEventListener(
    "loadedmetadata",
    () => open(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0),
    { once: true },
  );
  probe.addEventListener("error", () => open(0), { once: true });
}
