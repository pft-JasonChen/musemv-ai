"use client";

import { useState } from "react";
import { MvSheet } from "./MvSheet";
import { DpIcon } from "@/components/ui/DpIcon";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { SubscribeModal } from "@/components/credits/SubscribeModal";
import { useAuth } from "@/components/providers/AuthProvider";
import type { MvSettings } from "@/lib/mv/types";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: MvSettings;
  onChange: (next: MvSettings) => void;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3g-2) ──────────────────
 *
 * DP source: `SettingsSheet` inside `MVCreatePage.tsx`. Classes from
 * `src/styles/designer/MVCreatePage.css` (`.mv-settings__*`), verbatim, on
 * `MvSheet`'s shared shell.
 *
 * ── TWO CONTROLS DP HAS NO SLOT FOR, AND BOTH HAD TO BE COMPOSED IN ─────────
 *
 * This is the A4 / G7 failure mode by the book: DP's sheet has strictly FEWER
 * controls than WA's, so "port DP verbatim" silently deletes behaviour while
 * every test stays green and the screenshot looks right.
 *
 * 1. `settings.title.on` / `settings.author.on`. DP has a bare text input for
 *    each; WA has an on/off switch that decides whether the caption is burned
 *    into the video at all, and `/mv/room`'s chip row renders "Title"/"Author"
 *    dimmed from exactly those flags. Both are fields on `MvSettings`, which is
 *    `MvSettingsSchema` — contract surface C2 — so they cannot be dropped.
 *    Composed from DP's own boxes rather than invented: `.mv-settings__row`
 *    (the flex row DP already uses for Subtitle/Watermark) wraps the group's
 *    `.mv-settings__label`, and the input keeps DP's `.mv-settings__input`.
 *    No new class — an unmatched class is the 0x0 trap, and adding one to the
 *    designer stylesheet is forbidden (it is gated byte-for-byte).
 *
 * 2. MV-04's Muse Pro gate on High quality. DP's segmented control has no
 *    locked state at all. The lock is carried by a crown in the option (a
 *    `currentColor` mask, so it inherits the segment's own dim white and
 *    brightens with it) and by BEHAVIOUR: a locked option routes to the
 *    upgrade dialog instead of changing the setting. Guarded by
 *    `e2e/behaviour-regressions.spec.ts` "G5-d#7 Pro gate".
 *
 * ── AND ONE THING DP HAS THAT WA DID NOT ────────────────────────────────────
 *
 * Icons on the segment options (`ic_rectangle_ver` / `ic_rectangle_hor`,
 * `ic_sd` / `ic_hd`). `.mv-settings__seg-icon` is `background-color:
 * currentColor` + `mask-*`, so these are `DpIcon`, not `<img>`.
 */
export function SettingsModal({ open, onClose, settings, onChange }: Props) {
  const set = (patch: Partial<MvSettings>) => onChange({ ...settings, ...patch });
  const { subscribed } = useAuth();
  const [subOpen, setSubOpen] = useState(false);
  // G7 finding 3g2-1. Every control here commits on touch, so the footer's
  // Cancel — which the MIGRATION introduced; the old `Modal` had none — was
  // wired to `onClose` and did precisely what Confirm did. Snapshot what the
  // sheet opened with and put it back, which is the only reading of "Cancel"
  // a user would expect next to "Confirm".
  const [opened, setOpened] = useState(settings);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOpened(settings);
  }
  const highLocked = !subscribed;

  return (
    <>
      <MvSheet
        open={open}
        onClose={onClose}
        onCancel={() => {
          onChange(opened);
          onClose();
        }}
        label="Settings"
        title="Settings"
        confirm={{ onConfirm: onClose, ariaLabel: "Apply" }}
      >
        <div className="mv-sheet__body">
          <div className="mv-settings__group">
            <p className="mv-settings__label">ASPECT RATIO</p>
            <div className="mv-settings__seg">
              {(["9:16", "16:9"] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  className={`mv-settings__seg-opt${
                    settings.ratio === ratio ? " mv-settings__seg-opt--active" : ""
                  }`}
                  onClick={() => set({ ratio })}
                  aria-pressed={settings.ratio === ratio}
                >
                  <DpIcon
                    name={ratio === "9:16" ? "ic_rectangle_ver" : "ic_rectangle_hor"}
                    className="mv-settings__seg-icon"
                  />
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="mv-settings__group">
            <p className="mv-settings__label">QUALITY</p>
            <div className="mv-settings__seg">
              {(["Standard", "High"] as const).map((resolution) => {
                const locked = resolution === "High" && highLocked;
                return (
                  <button
                    key={resolution}
                    type="button"
                    className={`mv-settings__seg-opt${
                      settings.resolution === resolution && !locked
                        ? " mv-settings__seg-opt--active"
                        : ""
                    }`}
                    // MV-04: a locked option sells rather than selects.
                    onClick={() => (locked ? setSubOpen(true) : set({ resolution }))}
                    aria-pressed={settings.resolution === resolution && !locked}
                  >
                    <DpIcon
                      name={resolution === "Standard" ? "ic_sd" : "ic_hd"}
                      className="mv-settings__seg-icon"
                    />
                    {resolution}
                    {locked && <DpIcon name="ic_crown" className="mv-settings__seg-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mv-settings__group">
            <div className="mv-settings__row">
              <div className="mv-settings__row-text">
                <p className="mv-settings__label">MV TITLE</p>
              </div>
              <ToggleSwitch
                checked={settings.title.on}
                ariaLabel="Show MV title"
                onChange={(on) => set({ title: { ...settings.title, on } })}
              />
            </div>
            {settings.title.on && (
              <input
                type="text"
                className="mv-settings__input"
                placeholder="Enter MV song name"
                value={settings.title.text}
                onChange={(e) => set({ title: { ...settings.title, text: e.target.value } })}
              />
            )}
          </div>

          <div className="mv-settings__group">
            <div className="mv-settings__row">
              <div className="mv-settings__row-text">
                <p className="mv-settings__label">AUTHOR NAME</p>
              </div>
              <ToggleSwitch
                checked={settings.author.on}
                ariaLabel="Show author name"
                onChange={(on) => set({ author: { ...settings.author, on } })}
              />
            </div>
            {settings.author.on && (
              <input
                type="text"
                className="mv-settings__input"
                placeholder="Enter author name"
                value={settings.author.text}
                onChange={(e) => set({ author: { ...settings.author, text: e.target.value } })}
              />
            )}
          </div>

          <div className="mv-settings__row">
            <div className="mv-settings__row-text">
              <p className="mv-settings__row-title">Show Subtitle</p>
              <p className="mv-settings__row-desc">Subtitles will appear in the video</p>
            </div>
            <ToggleSwitch
              checked={settings.showSubtitle}
              ariaLabel="Show Subtitle"
              onChange={(showSubtitle) => set({ showSubtitle })}
            />
          </div>

          <div className="mv-settings__row">
            <div className="mv-settings__row-text">
              <p className="mv-settings__row-title">Show Watermark</p>
              <p className="mv-settings__row-desc">The YouCam Muse logo will appear.</p>
            </div>
            <ToggleSwitch
              checked={settings.watermark}
              ariaLabel="Show Watermark"
              onChange={(watermark) => set({ watermark })}
            />
          </div>
        </div>
      </MvSheet>
      <SubscribeModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  );
}
