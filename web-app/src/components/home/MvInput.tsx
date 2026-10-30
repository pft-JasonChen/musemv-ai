"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { ChooseSongModal } from "@/components/mv/ChooseSongModal";
import { TemplateSheet } from "@/components/mv/TemplateSheet";
import { TrimAudioModal } from "@/components/mv/TrimAudioModal";
import { importAudioFile } from "@/components/mv/importAudio";
import { useToastTimer } from "@/components/ui/useToastTimer";
import { DpIcon } from "@/components/ui/DpIcon";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { localePath } from "@/lib/i18n/config";
import { TEMPLATES } from "@/lib/mv/mock";
import { MV_IDEA_PROMPTS } from "@/lib/mv/mvIdeas";
import { pickIdea } from "@/lib/mv/songIdeas";
import { DESCRIPTION_MAX, type Song } from "@/lib/mv/types";

/** What the Templates button shows once something is applied: a template from
 *  the sheet, or a hero card's style ("Use Style"). */
export interface MvPick {
  cover: string;
  name: string;
}

/**
 * The Music Video tab of Home's composer (product owner, 2026-10-30; Figma
 * Guideline_YCM 4584:69040 empty, 5555:193768 filled). The start of
 * `/mv/room`, folded into one card:
 *
 * · Song slot (top left): a menu first (product owner, 2026-10-30) — Choose
 *   from Song Library (sign-in, then the room's Choose Song sheet) or Import
 *   Audio (a local file, `/mv/room`'s rules via `importAudioFile`); either ends
 *   in the room's Trim dialog. Once picked the slot shows the cover with a ✕.
 * · Templates: the room's Template picker; applying one fills the prompt and
 *   the button then shows its cover + name. A hero card's "Use Style" lands
 *   here too.
 * · Idea writes a prompt; Enhance appears once there is text (`kind: "mv"`, as
 *   on `/mv/room`).
 * · Create carries it all to `/mv/room`, where the user adds characters and
 *   settings and generates.
 *
 * Song and prompt are `MvFlowProvider`'s `compose` — the state `/mv/room`
 * reads — so nothing is copied across. The room picks the template back up
 * from the prompt it filled (see `MvRoom.tsx`).
 */
export function MvInput({
  inputRef,
  pick,
  onPick,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  pick: MvPick | null;
  onPick: (pick: MvPick | null) => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const { compose, patchCompose } = useMvFlow();
  const [songOpen, setSongOpen] = useState(false);
  const [pendingSong, setPendingSong] = useState<Song | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast, show: showToast, hold: toastHold } = useToastTimer(2600);

  // The menu closes on an outside press or Esc, like any dropdown.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const text = compose.description;
  const song = compose.song;
  const canCreate = !!song || text.trim().length > 0;

  return (
    <>
      <div className="agent-mv__top">
        <div className="agent-mv__song" ref={menuRef}>
          {song ? (
            <div className="agent-mv__song-slot agent-mv__song-slot--on">
              <button
                type="button"
                className="agent-mv__song-art"
                onClick={() => {
                  setPendingSong(song);
                }}
                aria-label={`Song: ${song.title}. Change trim`}
              >
                {song.art ? (
                  <img src={song.art} alt="" />
                ) : (
                  <DpIcon name="ic_song" className="agent-mv__song-glyph" />
                )}
              </button>
              <button
                type="button"
                className="agent-mv__song-x"
                onClick={() => patchCompose({ song: null })}
                aria-label="Remove song"
              >
                <DpIcon name="ic_close" className="agent-mv__song-x-icon" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="agent-mv__song-slot"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Add music"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <DpIcon name="ic_add" className="agent-mv__song-add" />
            </button>
          )}
          {menuOpen && (
            <div className="agent-mv__menu" role="menu" aria-label="Add music">
              <button
                type="button"
                role="menuitem"
                className="agent-mv__menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  requireLogin(() => setSongOpen(true));
                }}
              >
                <DpIcon name="ic_song_list" className="agent-mv__menu-icon" />
                Choose from Song Library
              </button>
              <button
                type="button"
                role="menuitem"
                className="agent-mv__menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  fileRef.current?.click();
                }}
              >
                <DpIcon name="ic_upload" className="agent-mv__menu-icon" />
                Import Audio
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="agent-mv__file"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importAudioFile(f, setPendingSong, showToast);
              e.target.value = "";
            }}
          />
          <span className="agent-mv__song-label" aria-hidden="true">
            Song
          </span>
        </div>
        <textarea
          ref={inputRef}
          className="agent-composer__input agent-mv__input"
          placeholder="Describe the mood, story, characters, or visuals you want for your MV..."
          aria-label="Describe your MV"
          maxLength={DESCRIPTION_MAX}
          value={text}
          onChange={(e) => patchCompose({ description: e.target.value })}
          rows={3}
        />
      </div>

      {/* Same grid as the Song tab (`.agent-song__bar`): Templates beside Idea
          on desktop / tablet, on its own row above on phones (Figma). */}
      <div className="agent-composer__bar agent-song__bar agent-song__bar--style">
        <button
          type="button"
          className="agent-song__idea"
          onClick={() => patchCompose({ description: pickIdea(MV_IDEA_PROMPTS, text) })}
        >
          <DpIcon name="ic_lightbulb" className="agent-song__idea-icon" />
          Idea
        </button>
        <button
          type="button"
          className="agent-song__style agent-mv__templates"
          aria-haspopup="dialog"
          onClick={() => setTemplatesOpen(true)}
        >
          <span className="agent-mv__thumbs" aria-hidden="true">
            {pick ? (
              <img src={pick.cover} alt="" />
            ) : (
              TEMPLATES.slice(0, 3).map((t) => <img key={t.id} src={t.cover} alt="" />)
            )}
          </span>
          <span className="agent-mv__templates-label">{pick ? pick.name : "Templates"}</span>
          <DpIcon name="ic_chevron-right" className="agent-song__style-chevron" />
        </button>
        <div className="agent-song__cta">
          <EnhanceButton
            value={text}
            kind="mv"
            onEnhanced={(t) => patchCompose({ description: t })}
            bem="agent-song"
          />
          <button
            type="button"
            className={`agent-composer__create${canCreate ? " agent-composer__create--on" : ""}`}
            disabled={!canCreate}
            // Sign-in first, as the composer's Create always required (AC-EXP-02).
            onClick={() => requireLogin(() => router.push(localePath(locale, "/mv/room")))}
          >
            Create
            <DpIcon name="ic_arrow_right" className="agent-composer__create-icon" />
          </button>
        </div>
      </div>

      <ChooseSongModal
        open={songOpen}
        onClose={() => setSongOpen(false)}
        onPick={(s) => {
          setSongOpen(false);
          setPendingSong(s);
        }}
      />
      <TrimAudioModal
        open={pendingSong !== null}
        song={pendingSong}
        onClose={() => setPendingSong(null)}
        onConfirm={(s) => {
          patchCompose({ song: s });
          setPendingSong(null);
        }}
      />
      {toast && (
        <div role="alert" {...toastHold} className="popup-toast popup-toast--error">
          {toast}
        </div>
      )}
      <TemplateSheet
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onApply={(t) => {
          patchCompose({ description: t.prompt });
          onPick({ cover: t.cover, name: t.name });
          setTemplatesOpen(false);
        }}
      />
    </>
  );
}
