# Spec — AI MV Creation Flow

> **Status:** DRAFT for alignment. This is the spec we agree on *before* writing code.
> **Scope:** front-end UX flow only. No backend internals — async work is modelled as a
> `MvJob` state machine fed by a mock handler.
> **Source of truth:** `ycmuse-prototype/muse-prototype-v2.html` (screens `mv-*`).
> **Method:** spec-driven → each acceptance criterion (EARS) becomes a test (§5).

---

## 1. Flow overview

```
home ─┬─► mv-style (type intro carousel) ──"Try Now"──► mv-room
      ├─ template (auto-fills desc + locks song) ─────► mv-room
      └─ Recreate (from mv-result; auto-fills desc + photo) ─► mv-room
mv-room (compose) ──"Create Music Video"──► mode chooser (sheet→modal on web)
 mode ─┬─ "Storyboard First" (20 cr) ─► mv-thinking ─► mv-storyboard ─"Generate MV"(200 cr)─┐
       └─ "MV Directly"      (200 cr) ────────────────────────────────────────────────────┤
                                                                                            ▼
                                                                                       mv-creating
                                                                                            │
                                                    ┌──────"View Later"──► history (Generating)
                                                    ▼
                                                mv-result ──(Recreate / Home / Edit MV)──► …
```
> Auth: **no login gate** (user assumed logged-in). The prototype gates via `requireLogin`; the web build intentionally omits it (Decision 7).

## 1b. Web layout decisions (confirmed)

Adaptation philosophy: **desktop-native redesign** — real app shell, not a stretched phone.

| Area | Mobile | Web (≥768px) |
|---|---|---|
| App chrome | Bottom tab bar | **Left sidebar rail** + slim top bar (credits + account); collapses to bottom bar at 390px |
| `mv-room` | Single scroll column | **Two-pane:** controls left (scroll) + **sticky 9:16 live preview** right that updates with type/song/settings |
| Sheets (Choose Song, Settings, Trim, Templates) | Bottom sheets | **Modal dialogs / right-side panels** |
| `mv-mode` | Bottom sheet | **Centered modal**, two cards side-by-side |
| `mv-thinking` / `mv-creating` | Full screen | Centered full-width (unchanged) |
| `mv-storyboard` | Vertical scene list | **Horizontal scene timeline** with time ranges |
| `mv-result` | Full screen | Player centered/left + **action panel docked right** |

Breakpoints: 390 (mobile, parity) / 768 / 1024 / 1440.

## 2. Screens & responsibilities

| Screen | Purpose | Key elements |
|---|---|---|
| `mv-style` | Pick MV type, intro | Video carousel (Singing / Storytelling / Hybrid), dots, name+desc, **Try Now**. Selected type carries into `mv-room` (shared `styleIdx`) and is re-selectable there. |
| `mv-room` | Compose the MV | Type mini-cards · **Choose a Song (Required)** · **Describe (Required)** + Templates/Ideas shortcuts · Character photos (optional) · Settings · **Create Music Video** |
| mode chooser | Choose workflow | "Storyboard First" (Recommended · 20 cr · ~1 min) → `mv-thinking`; "MV Directly" (200 cr · ~2 min) → `mv-creating`. Prototype = bottom sheet `mv-mode-sheet`; web = centered modal. (`screen-mv-mode` exists but is legacy/unused.) |
| `mv-thinking` | Storyboard generation | Progress %, step label, est. time ("~1 minute"), **View Later** |
| `mv-storyboard` | Review/edit storyboard | Character image, MV song, **Visual Style (editable)**, **3 Synopsis scenes (editable, timed)**, **Generate MV (200 cr)** |
| `mv-creating` | MV render | Progress %, est. time ("~2 minutes", dynamic), **View Later** |
| `mv-result` | Output | Video player (play/mute), **Like/Dislike**, Share tiles, action strip: **Download · Edit MV · Recreate · Publish**, Home button |

### Supporting sheets/panels (in `mv-room`)
- **Choose Song** — tabs **My Songs (default)** / Sample Songs → Use. Both library pick and Import route through **Trim Audio** before the song is added.
- **Import Audio** (real local file picker) and **Paste Link** (Suno / TikTok Music / SoundCloud) sub-flows.
- **Character photo** — upload (real picker) opens a **Select a Face** picker for multi-face photos; plus a strip of **8 sample faces**.
- **Templates** — gallery of 8 named templates (Neon City, One Take Studio, …); selecting one pre-fills the description and (via template entry) auto-selects + locks a song.
- **Ideas** — inline button that auto-fills the description.
- **Settings** — Aspect Ratio (9:16 default / 16:9), Resolution (720P default / 1080P), MV Title (toggle **ON** + text input), Author Name (toggle **ON** + text input), Show Subtitle (**ON**), Show Watermark (**OFF**).

## 3. State model

**Compose state (`mv-room`)**
- `mvType`: `singing | storytelling | hybrid` (default `singing`; carried from `mv-style`, re-selectable here).
- `song`: `null | { source: 'library'|'import'|'sample'|'link', title, durationSec, art, trim? }` — **required**.
- `description`: string, 0–2500 chars — **required** (non-empty after trim).
- `characterPhotos`: 0–2 (optional); `selectedFace?` from the face picker.
- `settings`: `{ ratio: '9:16', resolution: '720P', title: {on:true,text}, author: {on:true,text}, showSubtitle: true, watermark: false }`.
- `ctaEnabled` = `song != null && description.trim().length > 0`. **⚠ New web behavior** — the source prototype does NOT gate the CTA; this is an intentional improvement.

**Job state (`MvJob`)** — drives thinking / creating / result / history:
`idle → queued → processing(progress 0–100) → done | failed`
- `mode`: `storyboard_first | direct`.
- Storyboard path inserts a `storyboard` review step between `thinking(done)` and `creating`.

**Auth**: user assumed logged-in. **No login gate** — web build intentionally omits the prototype's `requireLogin`.

**Credits**: balance `390` shown in chrome on mv-room / mv-storyboard. Storyboard = 20 cr, render = 200 cr. **Cosmetic only** — never decrements, never blocks (matches prototype).

**Generation timing**: displayed labels match prototype — thinking "~1 minute", creating "~2 minutes" (dynamic). Mock run durations compressed for demo (~6–8s / ~10–12s).

**Scene count**: **3 scenes** with uneven ranges (00:00–09 / 09–12 / 12–15), as in the prototype. (Optional later enhancement: scale 3–5 by song length — not required for this slice.)

**File inputs**: Import Audio + Upload Character Photo use a **real local file picker**, previewed in-browser via object URL. No upload/storage backend.

> **Source-fidelity note:** items marked **⚠ New web behavior** (CTA gating, 2500-char hard cap, autoplay-muted) are deliberate web improvements not present in the source prototype. Everything else mirrors observed prototype behavior.

## 4. Acceptance criteria (EARS)

**Compose / validation**
- AC1 — WHEN the user opens `mv-room`, THE SYSTEM SHALL default `mvType` to Singing and disable the Create CTA until a song and a non-empty description exist.
- AC2 — WHEN the user selects a song via the Choose Song sheet and confirms, THE SYSTEM SHALL show the added-song card (art, title, duration) and re-evaluate `ctaEnabled`.
- AC3 — WHEN the description field changes, THE SYSTEM SHALL update the `n/2500` counter and reject input beyond 2500 chars. (Counter exists in prototype; the hard cap is **⚠ new web behavior**.)
- AC4 — WHILE either song or description is missing, THE SYSTEM SHALL keep the Create CTA visually disabled and non-actionable.

**Workflow selection / auth**
- AC5 — WHEN the user taps Create Music Video, THE SYSTEM SHALL open the mode modal directly (user assumed authenticated), preserving compose state.
- AC6 — WHEN the user picks "Create Storyboard First", THE SYSTEM SHALL navigate to `mv-thinking` and start a storyboard job.
- AC7 — WHEN the user picks "Create MV Directly", THE SYSTEM SHALL navigate to `mv-creating` and start a render job.

**Generation**
- AC8 — WHILE a job status is `processing`, THE SYSTEM SHALL display a 0–100% progress indicator, a step label, and an estimated time, and SHALL disable back-navigation that would cancel silently.
- AC9 — WHEN the user taps "View Later" during generation, THE SYSTEM SHALL navigate to `history` and the in-progress job SHALL appear there as a Generating row. (Prototype shows a processing toast + pre-seeded rows; **live insert of the current job is new web behavior**.)
- AC10 — WHEN a storyboard job reaches `done`, THE SYSTEM SHALL navigate to `mv-storyboard` populated with character image, song, visual style, and timed scenes.
- AC11 — WHEN a render job reaches `done`, THE SYSTEM SHALL navigate to `mv-result` with the playable video.
- AC12 — IF a job reaches `failed`, THEN THE SYSTEM SHALL show an error state with a Retry action.

**Storyboard editing**
- AC13 — WHEN the user edits Visual Style or a Scene, THE SYSTEM SHALL persist the edited text into the storyboard state and reflect it on return.
- AC14 — WHEN the user taps "Generate MV" on the storyboard, THE SYSTEM SHALL start a render job using the (possibly edited) storyboard.

**Result**
- AC15 — WHEN `mv-result` loads, THE SYSTEM SHALL loop the video and expose play, mute, **Like/Dislike**, Share, and the action strip **Download · Edit MV · Recreate · Publish**, plus a Home exit. (Autoplay should be **muted** for reliable browser playback — **⚠ new web behavior**; prototype defaults speaker-on. Like/Share/Download are visual-only in the prototype; web build wires Like + state.)
- AC15b — WHEN the user taps Publish, THE SYSTEM SHALL show a "Ready to Go Public?" confirm → Review state (per `History_Option_Menu_Spec.md`).

**Responsive (all screens)**
- AC16 — THE SYSTEM SHALL render correctly at 390 / 768 / 1024 / 1440 px with no overflow or broken layout, preserving the dark theme and token-derived styling.

## 5. Test scenarios (→ tests; Playwright + Vitest)

- T1 (AC1, AC4): fresh `mv-room` → CTA disabled; add song only → still disabled; add description → enabled.
- T2 (AC2): open Choose Song → Sample Songs → Use → added card shows correct title/duration.
- T3 (AC3): paste 2600 chars → field caps at 2500, counter reads `2500/2500`.
- T4 (AC5): tap Create → mode modal opens directly (no login), song+description intact.
- T5 (AC6/AC8/AC10): Storyboard First → progress animates 0→100 → lands on storyboard with ≥1 scene.
- T6 (AC7/AC8/AC11): MV Directly → progress → lands on result with `<video>` present.
- T7 (AC9): View Later mid-job → history shows a Generating row.
- T8 (AC12): force `failed` (mock) → error + Retry visible; Retry restarts job.
- T9 (AC13/AC14): edit Scene 2 text → Generate MV → render uses edited text (assert on job payload).
- T10 (AC15): result autoplays muted; play/mute/Like toggle state; Recreate → mv-room pre-filled; Publish → confirm dialog.
- T11 (AC16): visual snapshot at 4 viewports, axe-core a11y pass (WCAG AA).

## 6. Decisions (all resolved)

1. **Credits** — cosmetic only; display, never block.
2. **Desktop layout** — desktop-native, two-pane compose with live preview (§1b).
3. **Scene count** — 3 scenes (prototype-faithful); optional 3–5 scaling deferred.
4. **Generation timing** — labels match prototype ("~1 min" / "~2 min"); mock runs ~6–8s / ~10–12s.
5. **Generation modes** — both Storyboard-First (20 cr) and Direct (200 cr) in scope.
6. **File inputs** — real local file picker, in-browser preview, no backend storage.
7. **Auth** — assume logged-in; no login gate.

### Scope for this slice (proposed defaults — flag to change)
- **In:** mv-style, mv-room (full compose: type, Choose Song w/ My+Sample tabs + Trim, Describe + Templates + Ideas, character upload + 8 sample faces + face picker, Settings), mode chooser, both gen paths, mv-thinking, mv-storyboard (edit visual style + 3 scenes), mv-creating, mv-result (play/mute/like/recreate/edit/download/share/publish-confirm), View Later → history Generating row.
- **Deferred (confirm OK):** Paste Link import (Suno/TikTok/SoundCloud); full History screen + option menus; sb-detail clip timeline; mv-all / mv-preview gallery screens; community/proof screens.

## 7. Audit reconciliation (vs prototype, 2026-06-20)
A subagent audited this spec against `muse-prototype-v2.html`. Corrections applied: login-gate contradiction removed (T4 fixed); mode UI clarified as a sheet→modal (`screen-mv-mode` is legacy); scene count corrected to 3; result controls corrected to like/dislike + Recreate + Home (not "favorite"); timing labels aligned; CTA-gating, 2500-cap, and autoplay-muted explicitly marked as new web behavior; Settings defaults, type carry-over, Trim-as-step, Templates auto-fill, face picker, and Publish-confirm added.
