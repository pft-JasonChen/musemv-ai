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
import { GENRES, MOODS, VOCALS } from "@/lib/mv/mock";
import { SONG_IDEA_PROMPTS, LYRIC_PRESETS, pickIdea } from "@/lib/mv/songIdeas";
import { TOP_PICKS_SONGS } from "@/lib/mv/community";
import { DESCRIPTION_MAX, isSongReady, songCost, type SongMode } from "@/lib/mv/types";

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
 * ── THE "IDEA" BUTTONS ARE BACK (2026-08-24) ────────────────────────────────
 *
 * They were removed on 2026-08-06 ("V1 ships no canned-sample fillers") and
 * RESTORED at the product owner's request, now backed by their own copy — see
 * `src/lib/mv/songIdeas.ts` for the provenance. Three consequences:
 *
 * · The standing "re-remove DP's Idea buttons on every drop" instruction is
 *   WITHDRAWN for this screen. DP's `.song-create__idea-btn` is wanted here;
 *   only `/mv/room`'s `Ideas` is still a deliberate subtraction.
 * · Simple gets one (fills `describe`), Custom gets one (fills `lyrics` — DP
 *   labels that box "LYRICS / IDEA" and it takes either). `Lyrics` keeps its
 *   own button beside it: same skin, different pool, and it hides under
 *   Instrumental where a lyric sheet makes no sense. Idea does not hide —
 *   an idea line is exactly what an instrumental brief wants, and it is what
 *   both DP and the app prototype do.
 * · The UI is DP's `.song-create__idea-btn` verbatim (lightbulb mask + label,
 *   the same pill the Lyrics button uses) and is EXPECTED to be adjusted by the
 *   designer later — the product owner asked for a working button first.
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
  const { loggedIn, requireLogin } = useAuth();
  const { history } = useHistory();
  const openCreation = useOpenCreation();
  const { credits } = useCredits();

  // Items 4/5 (2026-08-06) — see the rail's note in `MvRoom.tsx`.
  const mySongs = history.filter((h) => h.kind === "song" && h.status === "completed");
  const showMine = loggedIn && mySongs.length > 0;
  const [buyOpen, setBuyOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  /**
   * The OTHER mode's lyrics draft (product owner, 2026-08-25).
   *
   * Turning Instrumental on must NOT carry the lyrics across — the box is
   * cleared so its "describe the mood" placeholder shows — and turning it off
   * again must bring the original words back. Keeping the inactive draft here
   * satisfies both with one swap, and means a user who toggles on, writes a
   * mood brief, and toggles off does not silently lose either piece of text.
   *
   * Component state, not `songCompose`: it is an editing convenience, not part
   * of the request. It resets on leaving the screen, like the rest of the
   * in-memory flow.
   */
  const [otherModeLyrics, setOtherModeLyrics] = useState("");
  const ready = isSongReady(s);

  /** Swap the active and inactive lyric drafts as the mode flips. */
  function toggleInstrumental(instrumental: boolean) {
    setOtherModeLyrics(s.lyrics);
    patch({ instrumental, lyrics: otherModeLyrics });
  }
  // Spec 11 §3.1: vocal 6 / instrumental 12. One constant could not express this.
  const cost = songCost(s.instrumental);

  function generate() {
    // GL-02: this screen is open to guests (the route lost its AuthGuard on
    // 2026-08-12), so "Create Song" is where the sign-in gate lives — same
    // shape as `MvRoom`'s "Create Music Video". The credit check runs INSIDE
    // the callback on purpose: a guest must sign in before ever being shown
    // the IAP upsell, otherwise a logged-out user with a 0 balance would be
    // asked to buy credits for an account they do not have yet.
    requireLogin(() => {
      // GL-01: insufficient balance routes to IAP instead of starting generation.
      if (credits < cost) {
        setBuyOpen(true);
        return;
      }
      resetForNewSong();
      router.push(localePath(locale, "/song/creating"));
    });
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
        {cost}
      </span>
    </button>
  );

  return (
    <>
      <RoomNavbar title="AI Song" mobileBackHref="/" />

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
                <p className="song-create__label">
                  {/* Product owner request, 2026-08-13: the longer copy is
                      desktop/tablet only ("as the screens are wider" there)
                      — phones keep the shorter original. Both spans are
                      always in the DOM and toggled by CSS (see
                      designer-overrides.css), not a `useMediaQuery` read, so
                      there's no hydration-mismatch flash of the wrong text
                      on a phone's first paint. */}
                  <span className="song-create__describe-label--phone">
                    DESCRIBE YOUR SONG
                  </span>
                  <span className="song-create__describe-label--wide">
                    DESCRIBE IDEA OF YOUR SONG
                  </span>
                </p>
                <ToggleSwitch
                  label="Instrumental"
                  checked={s.instrumental}
                  onChange={toggleInstrumental}
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
                  {/* Restored 2026-08-24 (see the header note). The wrapper is
                      DP's own `.song-create__input-actions` rather than DP's
                      bare button, because `.song-create__input-footer` is
                      `justify-content: space-between` and the left group has to
                      exist for the Enhance/count group to stay right-aligned —
                      it used to be an empty div for exactly that reason. */}
                  <div className="song-create__input-actions">
                    <button
                      type="button"
                      className="song-create__idea-btn"
                      onClick={() => patch({ describe: pickIdea(SONG_IDEA_PROMPTS, s.describe) })}
                    >
                      {/* `background: currentColor` + `mask-*` on
                          `.song-create__idea-icon` ⇒ a mask, not an <img>. */}
                      <DpIcon name="ic_lightbulb" className="song-create__idea-icon" />
                      Idea
                    </button>
                  </div>
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
                  {/* "LYRICS / IDEA" — DP's own name for this box, and the
                      honest one: it takes either kind of input and has a fill
                      button for each (see the footer note below). It read just
                      "LYRICS" until 2026-08-25, which under-described a box that
                      also accepts a style/scene brief — and contradicted this
                      file's own comments, which had said DP calls it
                      "LYRICS / IDEA" all along. */}
                  <p className="song-create__label">LYRICS / IDEA</p>
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
                  onChange={toggleInstrumental}
                />
              </div>

              <div className="song-create__input-box">
                <textarea
                  className="song-create__textarea"
                  placeholder={
                    s.instrumental
                      ? "No lyrics needed - AI will create a pure instrumental track.\nDescribe the mood or vibe of your instrumental..."
                      : "Write your lyrics here... Or leave blank — AI will generate them based on your chosen style and mood."
                  }
                  maxLength={DESCRIPTION_MAX}
                  value={s.lyrics}
                  onChange={(e) => patch({ lyrics: e.target.value })}
                  aria-label={s.instrumental ? "Describe your instrumental" : "Lyrics"}
                />
                <div className="song-create__input-footer">
                  {/* Two fills, one box (DP calls it "LYRICS / IDEA"): Idea
                      writes a style/scene/tempo/mood brief, Lyrics writes a
                      whole lyric sheet. Same pill, different pool. Idea stays
                      visible under Instrumental — a brief is what that box asks
                      for there — while Lyrics hides with the rest of the
                      lyric-only controls. */}
                  <div className="song-create__input-actions">
                    <button
                      type="button"
                      className="song-create__idea-btn"
                      onClick={() => patch({ lyrics: pickIdea(SONG_IDEA_PROMPTS, s.lyrics) })}
                    >
                      <DpIcon name="ic_lightbulb" className="song-create__idea-icon" />
                      Idea
                    </button>
                    {!s.instrumental && (
                      <button
                        type="button"
                        className="song-create__idea-btn"
                        onClick={() => patch({ lyrics: pickIdea(LYRIC_PRESETS, s.lyrics) })}
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

          {/* Product owner request, 2026-08-13 — `adaptive` (Figma node
              1367:33182) now covers both modes: float only when the page
              actually needs scrolling to reach the CTA, otherwise render it
              as the panel's own last row. Was Simple = always inline,
              Custom = always floating, on the assumption that Simple's form
              is always short enough and Custom's never is — `adaptive`
              measures instead of assuming, for both. */}
          <FloatingCTA alignToParent adaptive>
            {cta}
          </FloatingCTA>
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
                    {/* Figma node 1351:28869 (1367:34073, reused for "My
                        Creations" too) — same community-style row as
                        Trending Songs below. `HistoryItem` has no
                        plays/likes/shares (see HistoryProvider.tsx), so
                        these are genuinely 0 for a just-created, unpublished
                        song — not a fabricated stand-in for real data. */}
                    <ListItem
                      variant="community"
                      title={song.title}
                      coverImage={song.thumb}
                      username={MOCK_USER.name}
                      plays={0}
                      likes={0}
                      shares={0}
                    />
                  </Link>
                ))
              : TOP_PICKS_SONGS.slice(0, 7).map((song) => (
                  <Link
                    key={song.id}
                    href={localePath(locale, `/song/play?id=${song.id}`)}
                    className="song-create__side-item"
                  >
                    {/* Figma node 1351:28869 (1367:34073) — this rail's rows
                        match the community-style item everywhere else in the
                        app (avatar + username + plays/likes/share), not the
                        plain title+creator-text row it had before. */}
                    <ListItem
                      variant="community"
                      title={song.title}
                      coverImage={song.cover}
                      username={song.creator}
                      plays={song.plays}
                      likes={song.likes}
                      shares={song.shares}
                    />
                  </Link>
                ))}
          </div>
        </div>
      </div>

      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </>
  );
}
