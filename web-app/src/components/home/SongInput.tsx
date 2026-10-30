"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useSubscribe } from "@/components/providers/SubscribeProvider";
import { DpIcon } from "@/components/ui/DpIcon";
import { EnhanceButton, type EnhanceDirection } from "@/components/ui/EnhanceButton";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { localePath } from "@/lib/i18n/config";
import { SONG_IDEA_PROMPTS, pickIdea } from "@/lib/mv/songIdeas";
import { DESCRIPTION_MAX, isSongReady, songCost, type SongMode } from "@/lib/mv/types";
import { SongStyleSheet } from "./SongStyleSheet";

/** Custom-mode Enhance asks first when the box may hold lyrics — same two
 *  directions as `/song/create` (SongCompose.tsx, AC-SONG-14). */
const DIRECTIONS: EnhanceDirection[] = [
  { kind: "song", label: "Refine Idea", sub: "Sharpen the mood, tone, and detail" },
  { kind: "lyrics", label: "Refine Lyrics", sub: "Polish wording, rhythm, and flow" },
];

/**
 * The Song tab of Home's composer (product owner, 2026-10-30; Figma
 * Guideline_YCM 4829:43216, filled state 4092:162157). The `/song/create`
 * form folded into one card:
 *
 * · Custom / Simple tabs and the Instrumental toggle on top, no `+`.
 * · Custom only: "Song Style" opens `SongStyleSheet`; once picked, the button
 *   reads the picks instead ("Jazz / Calm / Male").
 * · Idea writes a prompt; Enhance appears once there is text, left of Create
 *   (Figma 5543:192609), and behaves as on `/song/create` (the Refine Idea / Refine Lyrics chooser in Custom with
 *   vocals, a single-shot refine otherwise).
 * · Create shows the credit cost and starts the real generation: the same
 *   sign-in gate, GL-01 credit check and `/song/creating` hand-off as
 *   `/song/create`'s "Create Song".
 *
 * State is `SongFlowProvider`'s `songCompose` — the one `/song/create` and the
 * generating screen read — so nothing is copied between the two screens.
 */
export function SongInput({ inputRef }: { inputRef: RefObject<HTMLTextAreaElement | null> }) {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const { credits } = useCredits();
  const { openBuyCredits } = useSubscribe();
  const { songCompose: s, patchSongCompose: patch, resetForNewSong } = useSongFlow();
  const [styleOpen, setStyleOpen] = useState(false);

  const custom = s.mode === "custom";
  const field = custom ? "lyrics" : "describe";
  const text = s[field];
  const cost = songCost(s.instrumental);
  const ready = isSongReady(s);
  const picks = [s.genre, s.mood, s.instrumental ? null : s.vocal].filter((p): p is string => !!p);

  /** Instrumental clears `vocal` — the same rule as `/song/create`. */
  const setInstrumental = (instrumental: boolean) =>
    patch(instrumental ? { instrumental, vocal: null } : { instrumental });

  const create = () =>
    requireLogin(() => {
      if (credits < cost) {
        openBuyCredits();
        return;
      }
      resetForNewSong();
      router.push(localePath(locale, "/song/creating"));
    });

  // Custom can Create with an empty box (`isSongReady`: Song Style alone is
  // enough), so its hint says so (product owner, 2026-10-30); Simple cannot.
  const placeholder = custom
    ? s.instrumental
      ? "Describe the mood or vibe of your instrumental, or leave it blank..."
      : "Describe your lyrics or song idea here, or leave it blank to let AI write it..."
    : "Describe the song you want to create...";

  return (
    <>
      <div className="agent-song__head">
        <div className="tabs agent-song__tabs" role="tablist" aria-label="Song mode">
          {(["custom", "simple"] as SongMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={s.mode === m}
              className={`tabs__tab${s.mode === m ? " tabs__tab--active" : ""}`}
              onClick={() => patch({ mode: m })}
            >
              {m === "custom" ? "Custom" : "Simple"}
            </button>
          ))}
        </div>
        <ToggleSwitch label="Instrumental" checked={s.instrumental} onChange={setInstrumental} />
      </div>

      <textarea
        ref={inputRef}
        className="agent-composer__input agent-song__input"
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={DESCRIPTION_MAX}
        value={text}
        onChange={(e) => patch({ [field]: e.target.value })}
        rows={3}
      />

      {/* One grid for the controls under the prompt. Phones (Figma
          5543:192609): Song Style on its own row, then Idea … Enhance + Create.
          Desktop / tablet (2026-10-30): Song Style moves up beside Idea, one
          row shorter. Song Style exists in Custom only. */}
      <div
        className={`agent-composer__bar agent-song__bar${custom ? " agent-song__bar--style" : ""}`}
      >
        {custom && (
          <button
            type="button"
            className="agent-song__style"
            aria-haspopup="dialog"
            onClick={() => setStyleOpen(true)}
          >
            <DpIcon name="ic_song" className="agent-song__style-icon" />
            <span className="agent-song__style-label">
              {picks.length === 0
                ? "Song Style"
                : picks.map((p, i) => (
                    <span key={p}>
                      {i > 0 && <span className="agent-song__style-sep"> / </span>}
                      {p}
                    </span>
                  ))}
            </span>
            <DpIcon name="ic_chevron-right" className="agent-song__style-chevron" />
          </button>
        )}
        <button
          type="button"
          className="agent-song__idea"
          onClick={() => patch({ [field]: pickIdea(SONG_IDEA_PROMPTS, text) })}
        >
          <DpIcon name="ic_lightbulb" className="agent-song__idea-icon" />
          Idea
        </button>
        {/* Enhance sits left of Create (Figma 5543:192609, 2026-10-30) and
            shows once there is text; the three bar buttons share one height. */}
        <div className="agent-song__cta">
          <EnhanceButton
            value={text}
            kind="song"
            onEnhanced={(t) => patch({ [field]: t })}
            bem="agent-song"
            directions={custom && !s.instrumental ? DIRECTIONS : undefined}
          />
          <button
            type="button"
            className={`agent-composer__create agent-composer__create--song${ready ? " agent-composer__create--on" : ""}`}
            disabled={!ready}
            onClick={create}
            aria-label={`Create, ${cost} credits`}
          >
            Create
            <span className="agent-composer__credit" aria-hidden="true">
              <img src="/assets/icons/ui/ic_credit.svg" alt="" />
              {cost}
            </span>
          </button>
        </div>
      </div>

      <SongStyleSheet
        open={styleOpen}
        value={{ genre: s.genre, mood: s.mood, vocal: s.vocal }}
        instrumental={s.instrumental}
        onApply={(st) => {
          patch(st);
          setStyleOpen(false);
        }}
        onClose={() => setStyleOpen(false)}
      />
    </>
  );
}
