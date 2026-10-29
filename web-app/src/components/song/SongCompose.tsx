"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoomNavbar } from "@/components/shell/RoomNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import { ListItem } from "@/components/ui/ListItem";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { useToastTimer } from "@/components/ui/useToastTimer";
import { useDemoFlag } from "@/components/demo/useDemo";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { creationHref, useOpenCreation } from "@/components/history/useOpenCreation";
import { useMyCreations } from "@/components/history/useMyCreations";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { GENRES, MOODS, VOCALS } from "@/lib/mv/mock";
import { SONG_IDEA_PROMPTS, LYRIC_PRESETS, pickIdea } from "@/lib/mv/songIdeas";
import { TOP_PICKS_SONGS } from "@/lib/mv/community";
import { SUPPORTED_SONG_LANGUAGES, UNSUPPORTED_LANGUAGE_MESSAGE } from "@/lib/mv/songLanguage";
import {
  DESCRIPTION_MAX,
  SONG_TITLE_MAX,
  isSongReady,
  songCost,
  type SongMode,
} from "@/lib/mv/types";

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
 * turning Instrumental on and off never discards what was typed.
 *
 * ── ENHANCE IS TWO CONTROLS WEARING ONE PILL (product owner, 2026-08-26) ────
 *
 * The box holds a lyric sheet OR a brief, and Instrumental is what says which:
 *
 * · Instrumental OFF — the box may hold either, so Enhance cannot know what the
 *   user meant. It opens the two-mode chooser (Refine Idea / Refine Lyrics) and
 *   calls `enhancePrompt` only after a pick. See `EnhanceButton`'s `directions`.
 * · Instrumental ON — lyrics are not supported at all, so there is nothing to
 *   choose between. Enhance runs Refine Idea (`kind: "song"`) on the first tap.
 *
 * Which is why `directions` is passed CONDITIONALLY below: `EnhanceButton`
 * branches on its presence, so withholding it is what turns the chooser off.
 * Enhance itself renders in BOTH states — only the `Lyrics` fill hides under
 * Instrumental (`AC-SONG-02`, `AC-SONG-14`).
 */
export function SongCompose() {
  const router = useRouter();
  const { locale } = useLocale();
  const { songCompose: s, patchSongCompose: patch, resetForNewSong } = useSongFlow();
  const { requireLogin } = useAuth();
  const openCreation = useOpenCreation();
  const { credits } = useCredits();

  // Items 4/5 (2026-08-06) — see the rail's note in `MvRoom.tsx`.
  // YMW260902P0013 — this rail showed "Trending Songs" while `/mv/room` showed
  // "My Creations", which looked like the two screens disagreeing. They ran
  // identical code; what differed was the DATA, because both read only the
  // session-local History and the reporter had generated an MV and no song.
  // `useMyCreations` merges that with the same seeded creations `/history`
  // shows, so signed in ⇒ my creation songs, on both screens. Full reasoning
  // in that hook; `loggedIn` is folded into it.
  const mySongs = useMyCreations("song");
  const showMine = mySongs.length > 0;
  const [buyOpen, setBuyOpen] = useState(false);
  // 2026-10-22 — unsupported-language error. Stays while hovered (`useToastTimer`).
  // The value is a counter, used as the toast's `key`: a second click while it
  // is showing remounts it, so screen readers announce the alert again.
  const {
    toast: langError,
    show: showLangError,
    hold: langErrorHold,
  } = useToastTimer<number>(4000);
  const demoLangUnsupported = useDemoFlag("songLangUnsupported");
  const [langErrorBottom, setLangErrorBottom] = useState<number | undefined>();
  const ready = isSongReady(s);

  /**
   * Instrumental toggle — BOTH modes route through this, not through a bare
   * `patch({ instrumental })`.
   *
   * Turning it ON also CLEARS `vocal` (product owner, 2026-09-01: "If
   * Instrumental toggle on, hide the VOCAL field"). Hiding the control without
   * clearing the value would leave an instrumental job carrying
   * `vocal: "Female"` in its payload — and `vocal` is C2 contract surface RD
   * consumes, so that contradiction would become RD's problem to defend
   * against rather than ours to not create.
   *
   * This is deliberately NOT the treatment the lyrics box gets. Toggling
   * Instrumental never discards typed text because the two texts live in two
   * separate fields (`lyrics` / `instrumentalText`) — see this file's header.
   * There is no second vocal field to park a pick in, so "preserve it" and
   * "don't send a contradiction" cannot both be true here.
   */
  function setInstrumental(instrumental: boolean) {
    patch(instrumental ? { instrumental, vocal: null } : { instrumental });
  }
  // Spec 11 §3.1: vocal 6 / instrumental 12. One constant could not express this.
  const cost = songCost(s.instrumental);

  function generate() {
    // Unsupported-language error (2026-10-22). RD owns the detection, so the
    // front end does not inspect the text: only the `?demo=1` flag reaches
    // this today. RD replaces the flag with its own answer. It runs before
    // sign-in and credits because it is about what was typed.
    if (demoLangUnsupported) {
      setLangErrorBottom(bottomAboveCta());
      showLangError((langError ?? 0) + 1);
      return;
    }
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
      data-gtm="tool-song-generate"
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
      <RoomNavbar title="AI Song" mobileBackHref="/" className="room-navbar__top--tight" />

      <div className="song-create">
        <div className="song-create__panel">
          <div className="tabs">
            {/* YMW260910P0021 (product owner, 2026-09-11): Custom is now the
                first/default tab, Simple second — a straight swap of DP's
                order, not a rename. */}
            {(["custom", "simple"] as SongMode[]).map((m) => (
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
                  <span className="song-create__describe-label--phone">DESCRIBE YOUR SONG</span>
                  <span className="song-create__describe-label--wide">
                    DESCRIBE IDEA OF YOUR SONG
                  </span>
                </p>
                <ToggleSwitch
                  label="Instrumental"
                  checked={s.instrumental}
                  onChange={setInstrumental}
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
                  <SupportedLanguagesInfo />
                </div>
                <ToggleSwitch
                  label="Instrumental"
                  checked={s.instrumental}
                  onChange={setInstrumental}
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
                      for there — and `Lyrics` is the ONLY control that hides
                      there: a lyric sheet is the one thing an instrumental
                      track cannot use. Enhance stays (see the footer-right
                      note); the toggle does not touch the text either way. */}
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
                    {/* Enhance renders in BOTH toggle states; what changes is
                        whether it asks first. Instrumental OFF the box may hold
                        a lyric sheet or a brief, so `directions` opens the
                        chooser; Instrumental ON lyrics are not supported, so
                        the pill runs Refine Idea (`kind: "song"`) on the first
                        tap. Withholding `directions` is what disables the
                        chooser — see `EnhanceButton`. (AC-SONG-14.) */}
                    <EnhanceButton
                      value={s.lyrics}
                      kind="song"
                      onEnhanced={(t) => patch({ lyrics: t })}
                      bem="song-create"
                      directions={
                        s.instrumental
                          ? undefined
                          : [
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
                            ]
                      }
                    />
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

                {/* ── ALL THREE STYLE FIELDS ARE OPTIONAL, SINGLE-SELECT ──────────
                    Product owner, 2026-09-01. GENRE and MOOD were previously
                    single-select but STICKY — `onClick` set the value and
                    nothing could unset it, so the first chip a user touched
                    became permanent. That is why the toggle-off expression
                    below (`s.x === v ? null : v`) is the change, not the
                    `(Optional)` label: the label was already true of the CTA
                    (`isSongReady` has never looked at genre/mood), it just
                    was not true of the control.

                    VOCAL already behaved this way; it gains the Instrumental
                    rule instead. */}
                <div className="song-create__chip-group">
                  <p className="song-create__chip-label">
                    GENRE <span className="song-create__chip-label-optional">(Optional)</span>
                  </p>
                  <div className="song-create__chips">
                    {GENRES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`chip${s.genre === g ? " chip--selected" : ""}`}
                        aria-pressed={s.genre === g}
                        onClick={() => patch({ genre: s.genre === g ? "" : g })}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="song-create__chip-group">
                  <p className="song-create__chip-label">
                    MOOD <span className="song-create__chip-label-optional">(Optional)</span>
                  </p>
                  <div className="song-create__chips">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`chip${s.mood === m ? " chip--selected" : ""}`}
                        aria-pressed={s.mood === m}
                        onClick={() => patch({ mood: s.mood === m ? "" : m })}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* VOCAL is HIDDEN, not disabled, while Instrumental is on —
                    an instrumental track has no vocal to pick, so the field is
                    not applicable rather than temporarily unavailable. Unmounting
                    also keeps it out of the tab order and the a11y tree, which
                    `disabled`+`opacity` would not reliably do (this file's own
                    "`opacity: 0` is not hidden" lesson, `AGENTS.md`).
                    `setInstrumental` clears the stored value at the same time. */}
                {!s.instrumental && (
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
                )}
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
                    maxLength={SONG_TITLE_MAX}
                    onChange={(e) => patch({ title: e.target.value })}
                    aria-label="Song title"
                  />
                </div>
                {/* Layout-only flex wrapper (no DP class exists for a hint+counter
                    row here) — YMW260916P0022, product owner set the 120 cap. */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <p className="song-create__title-hint">
                    Leave blank — AI will suggest a title based on your lyrics and style.
                  </p>
                  <span className="song-create__char-count">
                    {s.title.length}/{SONG_TITLE_MAX}
                  </span>
                </div>
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
                        Trending Songs below. Stats come from
                        `useMyCreations`: real numbers for a seeded creation,
                        and genuinely 0 for a just-created unpublished one
                        (`HistoryItem` carries no stats, see
                        HistoryProvider.tsx) — not a fabricated stand-in. */}
                    <ListItem
                      variant="community"
                      title={song.title}
                      coverImage={song.thumb}
                      username={song.username}
                      plays={song.plays}
                      likes={song.likes}
                      shares={song.shares}
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

      {langError && (
        <div
          key={langError}
          role="alert"
          {...langErrorHold}
          className="popup-toast popup-toast--error"
          style={langErrorBottom ? { bottom: langErrorBottom } : undefined}
        >
          {UNSUPPORTED_LANGUAGE_MESSAGE} See supported{" "}
          <span className="popup-toast__nowrap">
            languages
            <SupportedLanguagesInfo above />
          </span>
        </div>
      )}
    </>
  );
}

/** `.popup-toast`'s shared offset from the bottom edge (designer-overrides.css). */
const TOAST_BOTTOM = 60;
const TOAST_CTA_GAP = 12;
/** Tallest the toast gets: two lines when it wraps on a phone (measured 70px). */
const TOAST_MAX_HEIGHT = 80;

/**
 * Where the language-error toast must sit to clear Create Song, or undefined
 * for the shared 60px. Product owner, 2026-10-24: at desktop widths the toast
 * landed directly ON the button and took its clicks. The button has no fixed
 * height — `FloatingCTA adaptive` floats it only when the page scrolls,
 * otherwise it is the panel's last row (measured: 60–106px up when floating at
 * 1403×697, 92–138px up inline at 1440×900) — so it is measured, not assumed.
 * Read once, in the click handler: the button does not move while the 4s toast
 * is up unless the user scrolls.
 */
function bottomAboveCta(): number | undefined {
  // `FloatingCTA` also renders a hidden measuring copy of the button.
  const cta = Array.from(document.querySelectorAll<HTMLElement>(".song-create__cta")).find(
    (el) => getComputedStyle(el).visibility !== "hidden",
  );
  if (!cta) return undefined;
  const { top, bottom } = cta.getBoundingClientRect();
  if (bottom <= 0 || top >= window.innerHeight) return undefined; // off-screen
  // Higher up the page than the toast's usual spot — no collision, no move.
  if (bottom < window.innerHeight - TOAST_BOTTOM - TOAST_MAX_HEIGHT) return undefined;
  const clear = Math.ceil(window.innerHeight - top + TOAST_CTA_GAP);
  return clear > TOAST_BOTTOM ? clear : undefined;
}

/**
 * The `( i )` + "Supported Languages" tooltip, used beside LYRICS / IDEA and
 * inside the unsupported-language error. Hover (or focus) shows it; a tap pins
 * it open, so it still works on touch screens with no hover. Escape closes it
 * (WCAG 1.4.13), and the 8px gap to the card is bridged in
 * `designer-overrides.css` so the pointer can move onto it.
 *
 * Inside the toast it opens directly ABOVE the ( i ), centred on it, and is
 * nudged back on-screen near an edge (`--above`, same file).
 */
function SupportedLanguagesInfo({ above = false }: { above?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const tipId = useId();
  const tipRef = useRef<HTMLDivElement>(null);

  // `--above` centres the card on the ( i ). Near a screen edge (the icon sits
  // at the left of a wrapped toast on a phone, or the right end on desktop)
  // that would cut it off, so shift it back inside a 16px gutter. Measured
  // after layout, before paint, so it never flashes at the wrong place.
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!open || !above || !el) return;
    el.style.removeProperty("--tip-shift");
    const { left, right } = el.getBoundingClientRect();
    const gutter = 16;
    const shift =
      left < gutter
        ? gutter - left
        : right > window.innerWidth - gutter
          ? window.innerWidth - gutter - right
          : 0;
    if (shift) el.style.setProperty("--tip-shift", `${shift}px`);
  }, [open, above]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setHovered(false);
      setPinned(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span
      // Beside the label the tooltip anchors to the whole label group (left
      // edge of "LYRICS / IDEA", as designed), so this wrapper takes no box
      // there. Inside the toast the wrapper IS the anchor, sitting inline after
      // the text so it follows the last word when the message wraps.
      className={above ? "song-create__info-inline" : "song-create__info-contents"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="song-create__info-btn"
        onClick={() => setPinned((p) => !p)}
        onFocus={() => setHovered(true)}
        onBlur={() => {
          setHovered(false);
          setPinned(false);
        }}
        aria-label="Supported languages"
        aria-describedby={open ? tipId : undefined}
      >
        <DpIcon name="ic_info" className="song-create__info-icon" />
      </button>
      {open && (
        <div
          ref={tipRef}
          id={tipId}
          role="tooltip"
          className={`song-create__tooltip${above ? " song-create__tooltip--above" : ""}`}
        >
          <p className="song-create__tooltip-title">Supported Languages</p>
          <p className="song-create__tooltip-body">{SUPPORTED_SONG_LANGUAGES}</p>
        </div>
      )}
    </span>
  );
}
