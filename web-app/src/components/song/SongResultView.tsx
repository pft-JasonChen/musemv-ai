"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { ListItem } from "@/components/ui/ListItem";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { LyricsSheet } from "@/components/ui/LyricsSheet";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { COST_SONG_RECREATE } from "@/lib/mv/types";
import { buildShareUrl } from "@/lib/share";
import { downloadFile } from "@/lib/download";
import {
  NEW_SONGS,
  getCommunitySong,
  songAudioUrl,
  songResultFromCommunity,
} from "@/lib/mv/community";

const FALLBACK_LYRICS = ["♪ No lyrics available for this one yet ♪"];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3j) ────────────────────
 *
 * DP source: `SongResult` inside `SongCreatePage.tsx` — the third of that
 * file's three stages (Figma "Song Result" node 50:84 mobile / "Song Result_L"
 * node 1614:76597 desktop). Classes from
 * `src/styles/designer/SongCreatePage.css`, verbatim.
 *
 * **`@needs-figma-recheck`** — the plan's route table flags this stage
 * specifically, and DP's own header note flags its "My Creations" section as an
 * unconfirmed default on mobile. Both are carried forward, not resolved here.
 *
 * ── WHY THIS STOPPED USING `SongDetail` ─────────────────────────────────────
 *
 * `SongDetail` is shared with `CreationDialog`, History's row dialog, which is
 * not in this slice — restyling it would have redesigned a screen nobody looked
 * at. So this route gets DP's markup and `SongDetail` keeps its Tailwind.
 *
 * **That drops `SongDetail`'s 30-second preview cap on this screen, and that is
 * the decision, not an oversight.** §1.4 cancelled SONG-02's free-preview gate
 * (S3); slice 3b already inverted the gate test for `/song/play` and asserts
 * playback runs past 30s there. Keeping the cap here would have left the two
 * player screens disagreeing about a rule the plan has already settled. The cap
 * still exists inside `SongDetail` for its remaining, unmigrated consumer.
 *
 * ── WHAT DP DOES NOT HAVE, AND IS KEPT ──────────────────────────────────────
 *
 * · SONG-03 + GL-01: Recreate is a paid re-roll (`COST_SONG_RECREATE`) that
 *   keeps the current take in History, and routes to IAP when the balance
 *   cannot cover it. DP's Recreate just goes back to the form for free.
 * · "Use in Music Video" actually carries the song into the MV compose state
 *   before navigating. DP's is a bare link to its MV detail page.
 * · A real share URL from the History entry.
 *
 * ── WHAT DP HAS THAT WA DID NOT, AND IS PORTED ──────────────────────────────
 *
 * The playlist. DP's result screen is a small player over "My Creations": the
 * generated song plus the user's earlier ones, with prev/next transport and a
 * grid that swaps the active track. WA's result was a single song with no way
 * out. `history` supplies the earlier songs, so nothing is fabricated — and
 * when there is only the new song, transport is disabled at both ends rather
 * than hidden, which is DP's own treatment.
 *
 * ── COMMUNITY ORIGIN (`?from=song-detail`, drop 2 `2670ed2`) ────────────────
 *
 * Drop 2 made a desktop row click on `/explore/songs` navigate HERE instead of
 * swapping an in-page column, so this screen now renders songs the signed-in
 * user did not create. Three consequences, none of them cosmetic:
 *
 * 1. **It resolves a community id with no flow state**, seeding SongFlow from
 *    the seed catalog rather than `router.replace`ing to `/song/create`. That
 *    is what makes the link real on a cold load; a History row still cannot do
 *    this, because its id names an in-memory job and nothing can resurrect it.
 * 2. **The rail becomes "Newly Released Songs"** over `NEW_SONGS`, which is
 *    DP's own `fromSongDetail` behaviour — the one thing DP does vary by origin.
 * 3. **Recreate and Publish are dropped**, which DP does NOT do. Following DP
 *    exactly would have offered a paid `COST_SONG_RECREATE` re-roll and a
 *    publish toggle on someone else's track. Product owner decided 2026-08-07;
 *    Download and "Use in Music Video" stay.
 *
 * Every icon on this screen is a mask (`.song-result__icon`,
 * `__play-icon`, `__transport-icon`, `__publish-icon`, `__cta-primary-icon` all
 * set `background-color: currentColor`), so they are all `DpIcon`. The one
 * `<img>`-shaped rule on this stage is `.song-create__cta-credit-icon`, which
 * belongs to the form.
 */
export function SongResultView() {
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  /**
   * DP's own param, and it carries two decisions rather than one piece of
   * styling. See the "COMMUNITY ORIGIN" block in this file's header.
   */
  const fromSongDetail = params.get("from") === "song-detail";
  const { locale } = useLocale();
  const { songResult, setSongResult, resetForRecreate, patchSongCompose } = useSongFlow();
  const { patchCompose } = useMvFlow();
  const { history } = useHistory();
  const { credits } = useCredits();
  const { requireLogin } = useAuth();

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [shareOpen, setShareOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  /**
   * A community song resolves from the seed catalog with NO flow state at all,
   * which is what makes `/song/result?id=…` a real deep link for one — unlike a
   * History row, whose id names an in-memory job that a reload genuinely
   * destroys. Resolved on the id alone rather than on `from=song-detail`, so a
   * link that loses the param still lands on the song instead of bouncing out.
   */
  const communitySong = getCommunitySong(idParam);
  const communityOrigin = fromSongDetail || communitySong != null;

  // The song first, then the rail behind it: the user's earlier creations
  // normally, or DP's "Newly Released" catalog when the origin is community —
  // showing a stranger's song above the signed-in user's own work reads as if
  // they made it.
  const playlist = useMemo(() => {
    if (!songResult) return [];
    const head = {
      id: songResult.id,
      title: songResult.title,
      cover: songResult.cover,
      audioUrl: songResult.audioUrl,
    };
    if (communityOrigin) {
      return [
        head,
        ...NEW_SONGS.filter((s) => s.id !== songResult.id).map((s) => ({
          id: s.id,
          title: s.title,
          cover: s.cover,
          audioUrl: songAudioUrl(s.id),
        })),
      ];
    }
    const earlier = history
      .filter(
        (h) => h.kind === "song" && h.status === "completed" && h.resultUrl !== songResult.audioUrl,
      )
      .map((h) => ({ id: h.id, title: h.title, cover: h.thumb, audioUrl: h.resultUrl }));
    return [head, ...earlier];
  }, [songResult, history, communityOrigin]);

  const active = playlist[activeIndex] ?? playlist[0];

  /**
   * The self-guard, with the community escape hatch in front of it. Without the
   * first branch a community id bounces straight back to `/song/create`, which
   * is exactly what made "adopt DP's routing" look bigger than it is.
   */
  useEffect(() => {
    if (songResult) return;
    if (communitySong) {
      setSongResult(songResultFromCommunity(communitySong));
      return;
    }
    router.replace(localePath(locale, "/song/create"));
  }, [songResult, communitySong, setSongResult, router, locale]);

  // Load and start whichever track is active. The play() rejection has to be
  // caught: with no user activation it rejects with NotAllowedError, and an
  // unhandled rejection prints to the console, which the R-2 specs assert is empty.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    audio.currentTime = 0;
    audio.load();
    void audio.play().catch(() => {});
  }, [active?.id]);

  const lyricLines = useMemo(() => {
    const raw = (songResult?.lyrics ?? "").split("\n").filter((l) => l.trim().length > 0);
    return raw.length ? raw : FALLBACK_LYRICS;
  }, [songResult?.lyrics]);

  const activeLine = Math.min(
    lyricLines.length - 1,
    Math.floor((duration ? currentTime / duration : 0) * lyricLines.length),
  );

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLine]);

  if (!songResult || !active) return null;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }

  function setVol(next: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = next;
    audio.muted = next === 0;
    setVolume(next);
    setMuted(next === 0);
  }

  function seekFromClientX(clientX: number) {
    const track = progressRef.current;
    const audio = audioRef.current;
    if (!track || !audio || !audio.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  }

  function onProgressPointerDown(event: ReactPointerEvent) {
    seekFromClientX(event.clientX);
    const onMove = (e: PointerEvent) => seekFromClientX(e.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function useInMv() {
    if (!songResult) return;
    patchCompose({
      song: {
        id: songResult.id,
        source: "library",
        title: songResult.title,
        durationSec: songResult.durationSec,
        art: songResult.cover,
        lyrics: songResult.lyrics,
      },
    });
    router.push(localePath(locale, "/mv/room"));
  }

  // SONG-03: Recreate re-rolls for COST_SONG_RECREATE and keeps the current take
  // in History. Insufficient balance routes to IAP (GL-01).
  function recreate() {
    if (credits < COST_SONG_RECREATE) {
      setBuyOpen(true);
      return;
    }
    resetForRecreate();
    router.push(localePath(locale, "/song/creating"));
  }

  const progressRatio = duration ? currentTime / duration : 0;
  // Opened from a `/history` row the id is in the URL and there is no live
  // History job to match on (seed rows are fixtures, not jobs) — without it
  // Share would build `/share?id=`, which resolves to the expired state.
  const shareId =
    idParam ??
    history.find((h) => h.kind === "song" && h.resultUrl === songResult.audioUrl)?.id ??
    "";

  return (
    <>
      {/*
        DP switches this stage's chrome from RoomNavbar to
        `<DetailNavbar title="AI Song" backHref="/history" />` — the result stage
        is the one stage of `SongCreatePage` that gets a back control, and it
        points at History. WA keeps Q6's `router.back()` and uses `/history` as
        the fallback for a cold entry.
      */}
      <DetailNavbar title="AI Song" fallbackPath="/history" />

      <div className="song-create">
        <div className="song-create__panel song-create__panel--full">
          <div className="song-result-page">
            <div className="song-result">
              <img src={active.cover} alt="" className="song-result__bg" aria-hidden="true" />
              <div className="song-result__bg-overlay" aria-hidden="true" />

              <div className="song-result__content">
                <audio
                  ref={audioRef}
                  src={active.audioUrl}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                />

                <div className="song-result__player">
                  <div className={`song-result__art${playing ? " song-result__art--playing" : ""}`}>
                    <img src={active.cover} alt="" />
                  </div>

                  <div className="song-result__controller">
                    <div className="song-result__meta-row">
                      <div className="song-result__meta">
                        <p className="song-result__title">{active.title}</p>
                        {/* DP fills `.song-result__meta` with the title alone,
                            even though the box is a 2px-gap flex COLUMN. WA's
                            result line named the genre and mood, which is the
                            only place this screen says anything about what was
                            generated — dropping it is the A14 information loss.
                            Typography borrowed from the same stylesheet rather
                            than a class no rule defines. */}
                        {activeIndex === 0 && songResult.genre && songResult.mood && (
                          <p className="song-create__title-hint">
                            {songResult.genre} · {songResult.mood}
                            {songResult.instrumental ? " · Instrumental" : ""}
                          </p>
                        )}
                      </div>

                      <div className="song-result__actions">
                        <button
                          type="button"
                          className={`song-result__icon-btn${liked ? " song-result__icon-btn--active" : ""}`}
                          onClick={() => setLiked((l) => !l)}
                          aria-label={liked ? "Unlike" : "Like"}
                          aria-pressed={liked}
                        >
                          <DpIcon
                            name={liked ? "ic_favorite_on" : "ic_favorite_off"}
                            className="song-result__icon"
                          />
                        </button>
                        <button
                          type="button"
                          className="song-result__icon-btn"
                          onClick={() => setShareOpen(true)}
                          aria-label="Share"
                        >
                          <DpIcon name="ic_share" className="song-result__icon" />
                        </button>
                        <button
                          type="button"
                          className="song-result__icon-btn song-result__icon-btn--desktop"
                          onClick={() =>
                            active.audioUrl && downloadFile(active.audioUrl, `${active.title}.mp3`)
                          }
                          aria-label="Download"
                        >
                          <DpIcon name="ic_download" className="song-result__icon" />
                        </button>
                        <div className="song-result__volume song-result__icon-btn--desktop">
                          <div className="song-result__volume-slider">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={muted ? 0 : volume}
                              onChange={(e) => setVol(Number(e.target.value))}
                              aria-label="Volume"
                            />
                          </div>
                          <button
                            type="button"
                            className="song-result__icon-btn"
                            onClick={() => setVol(muted ? 1 : 0)}
                            aria-label={muted ? "Unmute" : "Mute"}
                          >
                            <DpIcon
                              name={muted || volume === 0 ? "ic_speaker_off" : "ic_speaker_on"}
                              className="song-result__icon"
                            />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="song-result__icon-btn song-result__icon-btn--lyrics"
                          onClick={() => setLyricsOpen(true)}
                          aria-label="Lyrics"
                        >
                          <DpIcon name="ic_singing_mic" className="song-result__icon" />
                        </button>
                      </div>
                    </div>

                    <div
                      className="song-result__progress"
                      ref={progressRef}
                      onPointerDown={onProgressPointerDown}
                    >
                      <div className="song-result__progress-track" />
                      <div
                        className="song-result__progress-fill"
                        style={{ width: `${progressRatio * 100}%` }}
                      />
                      <div
                        className="song-result__progress-thumb"
                        style={{ left: `${progressRatio * 100}%` }}
                      />
                    </div>
                    <div className="song-result__time">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>

                    <div className="song-result__transport">
                      <button
                        type="button"
                        className="song-result__transport-btn"
                        disabled={activeIndex === 0}
                        onClick={() => setActiveIndex((i) => i - 1)}
                        aria-label="Previous"
                      >
                        <DpIcon name="ic_skip_back" className="song-result__transport-icon" />
                      </button>
                      <button
                        type="button"
                        className="song-result__play"
                        onClick={togglePlay}
                        aria-label={playing ? "Pause" : "Play"}
                      >
                        <DpIcon
                          name={playing ? "ic_pause" : "ic_play"}
                          className="song-result__play-icon"
                        />
                      </button>
                      <button
                        type="button"
                        className="song-result__transport-btn"
                        disabled={activeIndex === playlist.length - 1}
                        onClick={() => setActiveIndex((i) => i + 1)}
                        aria-label="Next"
                      >
                        <DpIcon name="ic_skip_forward" className="song-result__transport-icon" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="song-result__side-panel">
                  <div className="song-result__lyrics-inline">
                    <div className="song-result__lyrics-inline-lines">
                      {lyricLines.map((line, i) => (
                        <p
                          key={i}
                          ref={i === activeLine ? activeLineRef : undefined}
                          className={`song-result__lyrics-inline-line${
                            i === activeLine ? " song-result__lyrics-inline-line--active" : ""
                          }`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="song-result__lyrics-inline-fade" aria-hidden="true" />
                  </div>

                  <div className="song-result__ctas">
                    {/* A <button>, not DP's anchor: R-9 (locale prefix) and this
                        one has to seed the MV compose state before navigating. */}
                    <button type="button" className="song-result__cta-primary" onClick={useInMv}>
                      Use in Music Video
                      <DpIcon name="ic_arrow_right" className="song-result__cta-primary-icon" />
                    </button>
                    {/* OWNER-ONLY, so absent on a community song. DP varies
                        nothing but the rail here, and following it exactly would
                        have offered a paid SONG-03 re-roll of a track the user
                        does not own — charging COST_SONG_RECREATE to fork a
                        stranger's song into their History. Product owner decided
                        2026-08-07 to drop the two rather than port them. Download
                        and "Use in Music Video" deliberately STAY: both are what
                        a community song is for. */}
                    {!communityOrigin && (
                      <button
                        type="button"
                        className="song-result__cta-secondary"
                        onClick={recreate}
                      >
                        Recreate · {COST_SONG_RECREATE} Credits
                      </button>
                    )}
                  </div>

                  {!communityOrigin && (
                    <div className="song-result__publish">
                      <DpIcon name="ic_publish" className="song-result__publish-icon" />
                      <div className="song-result__publish-text">
                        <p className="song-result__publish-title">Publish</p>
                        <p className="song-result__publish-state">{published ? "On" : "Off"}</p>
                      </div>
                      {/* GL-02: publishing to the community is gated at the action.
                          Unlike MV, Song does NOT confirm first — DP's own split. */}
                      <ToggleSwitch
                        checked={published}
                        ariaLabel="Publish to community"
                        onChange={(next) =>
                          next ? requireLogin(() => setPublished(true)) : setPublished(false)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="song-result__creations">
              <p className="song-result__creations-title">
                {communityOrigin ? "Newly Released Songs" : "My Creations"}
              </p>
              <div className="song-result__creations-grid">
                {playlist.map((item, i) => {
                  // Designer request, 2026-08-11: this rail should look like
                  // Home's "Newly Released Songs" (avatar/username/stats/
                  // like-share-Create), not the bare title+thumbnail row it
                  // had before. `playlist` itself only carries
                  // {id,title,cover,audioUrl} (it also covers the "My
                  // Creations" case, which has no creator/stats to show), so
                  // the real community data is looked up by id here rather
                  // than widening that shape — items with no catalog match
                  // (the user's own history entries) naturally fall back to
                  // the plain variant instead of showing fabricated stats.
                  const meta = getCommunitySong(item.id);
                  const isActive = i === activeIndex;
                  const select = () => setActiveIndex(i);
                  return (
                    // Designer follow-up, 2026-08-11: "same list component as
                    // Home's Newly Released Songs" means the BORDERED version
                    // — `.new-songs__item` (Figma node 1330:21011) is the
                    // per-row bordered-card wrapper Home uses there, reused
                    // verbatim here rather than leaving these rows borderless.
                    //
                    // `.song-result__creations-item` carries DP's own button
                    // reset (border/background/padding/cursor) — only
                    // meaningful on the fallback's real `<button>` below, but
                    // harmless as a no-op on this wrapping `<div>` too, so it
                    // stays on whichever element is actually rendered rather
                    // than duplicating those declarations under a new class.
                    <div
                      key={item.id}
                      className={`new-songs__item${isActive ? " song-result__creations-item--active" : ""}`}
                    >
                      {meta ? (
                        <ListItem
                          variant="community"
                          title={item.title}
                          coverImage={item.cover}
                          username={meta.creator}
                          plays={meta.plays}
                          likes={meta.likes}
                          shares={meta.shares}
                          shareUrl={buildShareUrl(item.id)}
                          cta
                          isPlaying={isActive && playing}
                          onSelect={select}
                          onPlay={select}
                          onCreate={() =>
                            requireLogin(() => {
                              patchSongCompose({
                                genre: meta.genre,
                                mood: meta.mood,
                                title: meta.title,
                                lyrics: meta.lyrics ?? "",
                              });
                              router.push(localePath(locale, "/song/create"));
                            })
                          }
                        />
                      ) : (
                        <button type="button" className="song-result__creations-item" onClick={select}>
                          <ListItem title={item.title} coverImage={item.cover} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LyricsSheet
        isOpen={lyricsOpen}
        title={active.title}
        cover={active.cover}
        lyricLines={lyricLines}
        currentTime={currentTime}
        duration={duration}
        playing={playing}
        onTogglePlay={togglePlay}
        onClose={() => setLyricsOpen(false)}
      />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={songResult.title}
        url={buildShareUrl(shareId)}
      />
      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </>
  );
}
