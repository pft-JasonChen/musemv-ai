"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoomNavbar } from "@/components/shell/RoomNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import { ListItem } from "@/components/ui/ListItem";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { creationHref, useOpenCreation } from "@/components/history/useOpenCreation";
import { MOCK_USER } from "@/lib/user";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { GENRES, MOODS, VOCALS, ENHANCE_SAMPLES } from "@/lib/mv/mock";
import { TOP_PICKS_SONGS } from "@/lib/mv/community";
import { COST_SONG, DESCRIPTION_MAX, isSongReady, type SongMode } from "@/lib/mv/types";

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3j) ────────────────────
 *
 * DP source: `SongCreatePage`'s `stage='form'` (Figma "AI Song — Feature Room",
 * node 1611:23710). Classes from `src/styles/designer/SongCreatePage.css` plus
 * `Chip.css`, `Tabs.css`, verbatim. The other two stages are
 * `SongGenerationScreen` and `SongResultView` — one DP file, three WA routes.
 *
 * ── S4: THE CONTROLS GO, THE FIELDS DO NOT ──────────────────────────────────
 *
 * The plan's route table says "S4 拿掉 BPM/Key" for this screen, and DP has
 * neither control. But §11's contract table is explicit that removing `bpm` /
 * `musicKey` is a **C8 change that must be its own PR and must not ride along
 * inside a UI slice**. Both are true and they are not in conflict: this slice
 * removes the Tempo slider and the Key chip row from the FORM, and leaves the
 * `bpm` / `key` fields on `SongCompose` exactly where they are, still carrying
 * `DEFAULT_SONG_COMPOSE`'s values into every request. Deleting the fields
 * remains the separate PR §11 asks for.
 *
 * DP's SONG LENGTH slider is not ported either — DP itself ships it behind
 * `SHOW_SONG_LENGTH = false`, and whether it is a temporary hide or a removal
 * is open question U1.
 *
 * ── WHAT DP DOES NOT HAVE, AND IS KEPT ──────────────────────────────────────
 *
 * · GL-01 credit gating: below `COST_SONG`, route to IAP instead of starting a
 *   job. DP's CTA only checks sign-in.
 * · `resetForNewSong()` before a new generation, so a previous result cannot
 *   leak into the next one.
 * · `EnhanceButton`'s real `api.enhancePrompt` round-trip and SONG-04's
 *   free-first-then-charge rule (G5-d #10). DP picks a random local string.
 *   DP-skinned via `bem="song-create"`, including the two-direction menu on the
 *   custom-lyrics box, which DP has no equivalent for.
 * · The disabled-CTA reason line. DP disables the button and says nothing.
 *
 * ── AND ONE THING WE DELIBERATELY DO NOT HAVE (2026-08-06) ──────────────────
 *
 * DP's "Idea" buttons — one on the describe box, one on the lyrics box — are
 * REMOVED. V1 ships no canned-sample fillers (product owner). This is the rare
 * case of diverging from DP by SUBTRACTION, so it will come back on every drop
 * and has to be re-removed; `Lyrics` and `/mv/room`'s `Templates` are different
 * controls and stay.
 *
 * ── ONE DP BEHAVIOUR THAT NEEDED A DECISION ─────────────────────────────────
 *
 * DP keeps the instrumental description in a THIRD text field
 * (`instrumentalText`), separate from lyrics, so toggling Instrumental swaps
 * which string the box holds. WA has one `lyrics` field on the contract, so the
 * toggle changes the box's placeholder and its footer, not its backing store —
 * turning Instrumental on and off no longer silently discards what was typed.
 */
export function SongCompose() {
  const router = useRouter();
  const { locale } = useLocale();
  const { songCompose: s, patchSongCompose: patch, resetForNewSong } = useSongFlow();
  const { loggedIn } = useAuth();
  const { history } = useHistory();
  const openCreation = useOpenCreation();
  const { credits } = useCredits();

  // Items 4/5 (2026-08-06) — see the rail's note in `MvRoom.tsx`.
  const mySongs = history.filter((h) => h.kind === "song" && h.status === "completed");
  const showMine = loggedIn && mySongs.length > 0;
  const [buyOpen, setBuyOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const ready = isSongReady(s);

  function generate() {
    // GL-01: insufficient balance routes to IAP instead of starting generation.
    if (credits < COST_SONG) {
      setBuyOpen(true);
      return;
    }
    resetForNewSong();
    router.push(localePath(locale, "/song/creating"));
  }

  const cta = (
    <button
      type="button"
      className={`song-create__cta${ready ? " song-create__cta--active" : ""}`}
      disabled={!ready}
      onClick={generate}
    >
      <span>Create Song</span>
      <span className="song-create__cta-credits">
        {/* Real <img>: `.song-create__cta-credit-icon` sets width/height only,
            so the coin keeps its own gold — a mask here paints nothing. */}
        <img src="/assets/icons/ui/ic_credit.svg" alt="" className="song-create__cta-credit-icon" />
        {COST_SONG}
      </span>
    </button>
  );

  return (
    <>
      <RoomNavbar title="AI Song" />

      <div className="song-create">
        <div className="song-create__panel">
          <div className="tabs">
            {(["simple", "custom"] as SongMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`tabs__tab${s.mode === m ? " tabs__tab--active" : ""}`}
                aria-pressed={s.mode === m}
                onClick={() => patch({ mode: m })}
              >
                {m === "simple" ? "Simple" : "Custom"}
              </button>
            ))}
          </div>

          {s.mode === "simple" ? (
            <div className="song-create__section song-create__section--grow">
              <div className="song-create__row-header">
                <p className="song-create__label">DESCRIBE YOUR SONG</p>
                <ToggleSwitch
                  label="Instrumental"
                  checked={s.instrumental}
                  onChange={(instrumental) => patch({ instrumental })}
                />
              </div>

              <div className="song-create__input-box">
                <textarea
                  className="song-create__textarea"
                  placeholder="e.g. A bittersweet love song about leaving a city you called home, with a melancholic yet hopeful vibe..."
                  maxLength={DESCRIPTION_MAX}
                  value={s.describe}
                  onChange={(e) => patch({ describe: e.target.value })}
                  aria-label="Describe your song"
                />
                <div className="song-create__input-footer">
                  {/* The "Idea" button was REMOVED 2026-08-06 — V1 ships no
                      canned-sample fillers (product owner). A deviation FROM
                      DP, which has `.song-create__idea-btn` here
                      (`SongCreatePage.tsx:598`), so the next drop brings it
                      back and the removal must be re-applied.

                      The empty left group is load-bearing, not leftover:
                      `.song-create__input-footer` is `justify-content:
                      space-between`, so with one child the Enhance/count group
                      would slide to the LEFT edge. DP's own class, no override. */}
                  <div className="song-create__input-actions" />
                  <div className="song-create__footer-right">
                    <EnhanceButton
                      value={s.describe}
                      kind="song"
                      onEnhanced={(t) => patch({ describe: t })}
                      bem="song-create"
                    />
                    <span className="song-create__char-count">
                      {s.describe.length}/{DESCRIPTION_MAX}
                    </span>
                    {s.describe.length > 0 && (
                      <button
                        type="button"
                        className="song-create__clear-btn"
                        onClick={() => patch({ describe: "" })}
                        aria-label="Clear"
                      >
                        <DpIcon name="ic_close" className="song-create__clear-icon" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="song-create__section">
              <div className="song-create__row-header">
                <div className="song-create__label-group">
                  <p className="song-create__label">LYRICS</p>
                  <button
                    type="button"
                    className="song-create__info-btn"
                    onClick={() => setTipOpen((open) => !open)}
                    aria-label="Supported languages"
                    aria-expanded={tipOpen}
                  >
                    <DpIcon name="ic_info" className="song-create__info-icon" />
                  </button>
                  {tipOpen && (
                    <div className="song-create__tooltip">
                      <p className="song-create__tooltip-title">Supported Languages</p>
                      <p className="song-create__tooltip-body">
                        English, Japanese, German, Portuguese, Italian, French, Spanish, Turkish,
                        Chinese, Korean, and Hindi
                      </p>
                    </div>
                  )}
                </div>
                <ToggleSwitch
                  label="Instrumental"
                  checked={s.instrumental}
                  onChange={(instrumental) => patch({ instrumental })}
                />
              </div>

              <div className="song-create__input-box">
                <textarea
                  className="song-create__textarea"
                  placeholder={
                    s.instrumental
                      ? "Describe the mood or vibe of your instrumental…\n\nNo lyrics needed — AI will create a pure instrumental track."
                      : "Write your lyrics here... Or leave blank — AI will generate them based on your chosen style and mood."
                  }
                  maxLength={DESCRIPTION_MAX}
                  value={s.lyrics}
                  onChange={(e) => patch({ lyrics: e.target.value })}
                  aria-label={s.instrumental ? "Describe your instrumental" : "Lyrics"}
                />
                <div className="song-create__input-footer">
                  {/* Same removal as the Simple box. `Lyrics` STAYS: it is a
                      different control with a different label, and it shows the
                      lyric FORMAT rather than filling in a prompt. */}
                  <div className="song-create__input-actions">
                    {!s.instrumental && (
                      <button
                        type="button"
                        className="song-create__idea-btn"
                        onClick={() => patch({ lyrics: pick(ENHANCE_SAMPLES.lyrics) })}
                      >
                        <DpIcon name="ic_singing_mic" className="song-create__idea-icon" />
                        Lyrics
                      </button>
                    )}
                  </div>
                  <div className="song-create__footer-right">
                    {!s.instrumental && (
                      <EnhanceButton
                        value={s.lyrics}
                        kind="lyrics"
                        onEnhanced={(t) => patch({ lyrics: t })}
                        bem="song-create"
                        directions={[
                          {
                            kind: "song",
                            label: "Refine Idea",
                            sub: "Sharpen the mood, tone, and detail",
                          },
                          {
                            kind: "lyrics",
                            label: "Refine Lyrics",
                            sub: "Polish wording, rhythm, and flow",
                          },
                        ]}
                      />
                    )}
                    <span className="song-create__char-count">
                      {s.lyrics.length}/{DESCRIPTION_MAX}
                    </span>
                    {s.lyrics.length > 0 && (
                      <button
                        type="button"
                        className="song-create__clear-btn"
                        onClick={() => patch({ lyrics: "" })}
                        aria-label="Clear"
                      >
                        <DpIcon name="ic_close" className="song-create__clear-icon" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="song-create__style">
                <p className="song-create__label">STYLE</p>

                <div className="song-create__chip-group">
                  <p className="song-create__chip-label">GENRE</p>
                  <div className="song-create__chips">
                    {GENRES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`chip${s.genre === g ? " chip--selected" : ""}`}
                        aria-pressed={s.genre === g}
                        onClick={() => patch({ genre: g })}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="song-create__chip-group">
                  <p className="song-create__chip-label">MOOD</p>
                  <div className="song-create__chips">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`chip${s.mood === m ? " chip--selected" : ""}`}
                        aria-pressed={s.mood === m}
                        onClick={() => patch({ mood: m })}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="song-create__chip-group">
                  <p className="song-create__chip-label">
                    VOCAL <span className="song-create__chip-label-optional">(Optional)</span>
                  </p>
                  <div className="song-create__chips">
                    {VOCALS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`chip${s.vocal === v ? " chip--selected" : ""}`}
                        aria-pressed={s.vocal === v}
                        onClick={() => patch({ vocal: s.vocal === v ? null : v })}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="song-create__title-field">
                <p className="song-create__label">
                  SONG TITLE <span className="song-create__chip-label-optional">(Optional)</span>
                </p>
                <div className="song-create__title-input-box">
                  <input
                    type="text"
                    className="song-create__title-input"
                    placeholder="e.g. Midnight Drive, Golden Hour..."
                    value={s.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    aria-label="Song title"
                  />
                </div>
                <p className="song-create__title-hint">
                  Leave blank — AI will suggest a title based on your lyrics and style.
                </p>
              </div>
            </div>
          )}

          {/* DP docks the CTA only in Custom mode — Simple's form is short
              enough that a fixed bar would sit over empty space. */}
          {s.mode === "simple" ? cta : <FloatingCTA alignToParent>{cta}</FloatingCTA>}
        </div>

        {/* Same two-mode rail as `/mv/room` — the reasoning is written up once,
            in `MvRoom.tsx`. DP: `{isSignedIn ? 'My Creations' : 'Trending Songs'}`
            with "See all" in the signed-out branch only. */}
        <div className="song-create__side">
          <div className="song-create__side-header">
            <p className="song-create__side-title">
              {showMine ? "My Creations" : "Trending Songs"}
            </p>
            {!showMine && (
              <Link
                href={localePath(locale, "/explore/songs")}
                className="song-create__side-see-all"
              >
                See all
                <DpIcon name="ic_chevron-right" className="song-create__side-see-all-icon" />
              </Link>
            )}
          </div>
          <div className="song-create__side-list">
            {showMine
              ? mySongs.slice(0, 7).map((song) => (
                  <Link
                    key={song.id}
                    href={localePath(locale, creationHref({ id: song.id, kind: "song" }))}
                    className="song-create__side-item"
                    onClick={(e) => {
                      e.preventDefault();
                      openCreation({
                        id: song.id,
                        kind: "song",
                        title: song.title,
                        thumb: song.thumb,
                        resultUrl: song.resultUrl,
                      });
                    }}
                  >
                    <ListItem
                      title={song.title}
                      coverImage={song.thumb}
                      subtitle={MOCK_USER.name}
                    />
                  </Link>
                ))
              : TOP_PICKS_SONGS.slice(0, 7).map((song) => (
                  <Link
                    key={song.id}
                    href={localePath(locale, `/song/play?id=${song.id}`)}
                    className="song-create__side-item"
                  >
                    <ListItem title={song.title} coverImage={song.cover} subtitle={song.creator} />
                  </Link>
                ))}
          </div>
        </div>
      </div>

      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </>
  );
}
