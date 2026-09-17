# YouCam Muse Web — eBugs to Fix (pulled 2026-09-17)

Source: `TSR.EbugSearch` via ePF MCP (`query_data`) + full form view per bug (Claude in Chrome,
authenticated as Jason_Chen@PerfectCorp.com), filtered:

- Product: **YouCam Muse Web** (ProductID 315)
- Belongs to: **PM**
- Status: **NewCreated, Assigned**

Result: **17 bugs**, all `NewCreated`, Handler `JASON_CHEN` (two — P0012, P0020 — also carry an
`Assignee` of `SMITH_LEE`).

**Final status (2026-09-17):**

| #   | Bug            | Status                                                                   |
| --- | -------------- | ------------------------------------------------------------------------ |
| 1   | YMW260907P0007 | ✅ Already fixed (verified live) — reply comment ready                   |
| 2   | YMW260911P0004 | ✅ Already fixed (09/11–09/14) — reply comment ready                     |
| 3   | YMW260914P0002 | ✅ Fixed, confirmed live (reversed after live-testing production)        |
| 4   | YMW260915P0004 | ⏸️ Deferred to designer, per your instruction — not touched              |
| 5   | YMW260915P0007 | ✅ Spec documented (MV-E9) using RD's error-code sheet, no code change   |
| 6   | YMW260915P0009 | ✅ Spec documented (MV-E9), name mismatch flagged for RD, no code change |
| 7   | YMW260915P0010 | ✅ Fixed, confirmed live                                                 |
| 8   | YMW260915P0012 | ⏸️ Not a code defect — reply comment ready                               |
| 9   | YMW260916P0001 | ✅ Fixed, confirmed live                                                 |
| 10  | YMW260916P0003 | ⏸️ Decided: keep current behavior — reply comment ready, no code change  |
| 11  | YMW260916P0006 | ✅ Fixed, confirmed live (site-wide)                                     |
| 12  | YMW260916P0013 | ✅ Fixed, confirmed live                                                 |
| 13  | YMW260916P0020 | ✅ Spec corrected, no code change                                        |
| 14  | YMW260916P0021 | ✅ Fixed (reversed direction — see note), confirmed live, spec updated   |
| 15  | YMW260916P0022 | ✅ Fixed, confirmed live                                                 |
| 16  | YMW260916P0024 | ✅ Fixed, confirmed live                                                 |
| 17  | YMW260916P0026 | ⏸️ Not applicable to this repo — reply comment ready                     |

`typecheck` / `lint` / `test:run` / `build` all green throughout. Not committed yet (pending your
go-ahead — see note at the end).

---

## YMW260907P0007 — [Home][Mobile] Sample MV displays audio icon

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Already fixed
- Local status: **Verified**

### Report

- Repro: Go to home; check the template/sample MV.
- Result: an audio icon is displayed on the sample MV (loading state).
- Expected: audio icon not displayed.
- Comments: SMITH_LEE asked PM to confirm spec; CRUZ_CHU clarified "audio is working, just loading
  slowly"; JASON_CHEN (this handler, in a prior session) asked to "show the icon instantly"; mockup
  was updated; **SCOTT_WU (2026-09-16): "Mockup 已經更新。目前 production link RD已經有解了這個bug，
  Top banner在mobile view上有顯示Mute/Unmute button。https://musemv-ai.vercel.app"**

### Resolution and verification

- Root cause: N/A — already resolved by an earlier change (mute/unmute control replaced the old
  audio-loading icon).
- Resolution: none needed by this session.
- Verified: mobile viewport (375px), local dev server — hero banner ("Vintage Drive" sample MV)
  shows a solid mute/unmute speaker icon immediately, top-right of the card. No loading-audio-icon
  placeholder state.
- Not verified: production `musemv-ai.vercel.app` directly (checked local build only, which should
  match — no local changes exist in this area).

### Reply comment (paste into eBug)

> Confirmed fixed — the template MV banner now shows a Mute/Unmute control immediately instead of
> a loading audio icon, on both mobile and desktop. No further code change needed on our side.

---

## YMW260911P0004 — [AI Music Video] Gray screen, no loading animation on F5/tab switch

- ePF status: NewCreated · Priority: 2 · Handler: JASON_CHEN
- Triage: Already fixed (2026-09-11, corrected 2026-09-14)
- Local status: Fixed for the route-transition case; **question open on the screenshot below**

Matches `docs/BUGS-TO-FIX-2026-09-11.md` #6/Re-pull #6. A shared `ui/LoadingDots.tsx` renders via
`app/[locale]/loading.tsx` on every client-side route switch between AI Music Video / AI Song.
**Not fixed for a full F5 reload** — Next.js resolves that fully-synchronously, so nothing streams
a separate fallback. Accepted, known gap (product owner, prior session).

### Follow-up (2026-09-17): screenshot from `testing-ycm.makeupar.com/en/mv/room`

You sent a screenshot highlighting a gray skeleton-placeholder list (rows of a thumbnail + two text
bars) in the right-hand panel of `/mv/room`, asking whether "we fix the correct issue".

- **That URL is the real backend build, not this prototype** — same distinction the eBug's own
  `Note` field already made (`URL: https://testing-ycm.makeupar.com`). The highlighted panel is
  structurally that build's "My Creations"/Trending rail.
- **This is a different mechanism from what we fixed.** Our `LoadingDots` fix addresses a
  **route-transition** loading state — the WHOLE page going blank while a new route's JS streams
  in, on F5 or switching between AI Music Video/Song. The screenshot shows a **panel-level data
  skeleton** — a placeholder for ONE list while it fetches, which only makes sense against a real
  backend with real network latency.
- **This repo's equivalent panel can't reproduce or need this**, because it has no async fetch to
  skeleton in the first place: `useMyCreations()` reads already-in-memory mock state synchronously
  — there is no moment where that data is "loading". Same shape as `YMW260915P0007`/`P0009`/`P0026`
  — a real-backend behavior this backend-less prototype has no equivalent code path for.
- **Not verified as still correct** pending your answer — see the question below the ledger.

### Reply comment (paste into eBug)

> Fixed for switching between AI Music Video and AI Song without a full page reload — you'll now
> see the same 3-dot loading animation History already uses, instead of a blank screen. **Not
> fixed for F5 (full refresh)** — that still shows blank while loading; a full fix for that case
> would need more work, flag me if you want it prioritized.

---

## YMW260914P0002 — [Home] Top Picks Songs card click is inconsistent with mockup

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Clear to fix — **reversed after you live-tested production**
- Local status: **Fixed, confirmed live**

### Report

- Repro: Login → click a song card in Top Picks Songs.
- Result: enters the song's own playing/player page (`/song/play?id=`).
- Expected (QA's own words): "behavior on mockup is entering a page like a see all page" — QA
  itself asked PM to confirm which is correct.

### Investigation and correction

First round: I asked "keep current (`/song/play`) or change to a see-all list page", and you said
keep current. You then tested it live on `https://musemv-ai.vercel.app/` and reported the opposite
— clicking a Top Picks Songs card lands on `/song/play?id=sp-neon-static`, and that this is **not**
"that song's own player", which you identified as `/song/result?id=sp-neon-static&from=song-detail`.

That pointed at a real, pre-existing inconsistency: `NewSongsSection.tsx` (Home's OTHER song rail,
"Newly Released Songs") already got exactly this fix on **2026-08-13** (product owner request) —
desktop seeds `SongFlow` and opens `/song/result`, phone keeps `/song/play`. `TopPicksSection.tsx`
is a duplicate copy of the same row pattern that never received that fix — the same shape as
`YMW260909P0008`'s missed-duplicate. `specs/areas/04-explore-community.md`'s `AC-EXP-03` was
itself stale since 2026-08-13 for the same reason.

### Resolution and verification

- Resolution: `TopPicksSection.tsx` gained its own `openSong()`, mirrored from
  `NewSongsSection.tsx` exactly (including the `from=home` origin tag, not `/explore/songs`' own
  `from=song-detail`). The card's `Link` now branches by viewport instead of always pointing at
  `/song/play`.
- Spec corrected: `AC-EXP-03` and `EXP-P1-S3` in `specs/areas/04-explore-community.md`, recorded in
  `specs/CHANGELOG-SPEC.md`.
- **Confirmed live:** clicking the "Neon Static" card now seeds `SongFlow` and lands on
  `/song/result?id=sp-neon-static&from=home`, rendering the song's title, lyrics panel, and the
  "Newly Released Songs" rail correctly (desktop viewport).
- **Related finding, not yet acted on:** `CreatorProfile.tsx`'s own songs grid also links straight
  to `/song/play?id=` with no viewport split at all — a different, mixed MV/song/storyboard grid
  component, not simply another copy of the `NewSongsSection`/`TopPicksSection` row pattern, so I
  didn't change it without checking first. Flag if you want the same split applied there.

### Reply comment (paste into eBug)

> Fixed — a Top Picks Songs card now opens that song's own result page
> (`/song/result?id=...`) at desktop widths, matching the "Newly Released Songs" rail right below
> it, instead of always going to `/song/play`. On a phone it still opens the full-screen player,
> same as every other song rail.

---

## YMW260915P0004 — [AI Music Video] Close button position, full-screen character view

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Needs Designer — **deferred, per your instruction ("我會轉給designer處理，我們不動")**
- Local status: Not touched

### Report

- Repro: AI Music Video → Storyboard → Full Screen on a character image → check close button.
- Expected: close button position is inside the viewer dialog.
- SMITH_LEE: "different preview [musemv-ai.vercel.app/cht/mv/edit?id=h-neon-city-nights] — suggest
  following current testing-ycm ui."

### Investigation (for whoever picks this up)

Viewed the attached `result.png` — a 3-way comparison. Our own build's preview dialog is a wide
landscape box (`min(90vw,1080px) x min(84vh,720px)`, `object-fit: contain`) around a portrait
photo, so the photo only fills the center; the close button, positioned `top:16px;right:16px`
relative to the OUTER box, ends up floating in the empty letterboxed margin beside the photo. In
the testing-ycm reference, the close button sits directly on the photo's own top-right corner. A
real, locatable layout defect — but the component
(`src/components/mv/StoryboardEditor.tsx`'s `.mv-storyboard__image-preview*` classes) lives in
`src/styles/designer/MVStoryboardPage.css`, a verbatim-copied designer stylesheet; any fix needs a
`designer-overrides.css` entry plus a `docs/DESIGNER-TODO.md` write-up (added as **A33** is a
different item — this one was NOT written up, per your instruction not to touch it).

### Reply comment (paste into eBug)

> Confirmed as a real layout issue — the close button sits in empty space beside the photo instead
> of on it, matching what you flagged against testing-ycm. Handing this to the designer to resolve
> against the visual reference rather than us guessing at an exact position.

---

## YMW260915P0007 — [AI Music Video] error_audio_overlength not documented

- ePF status: NewCreated · Priority: 2 · Handler: JASON_CHEN
- Triage: Documented (spec only — real-backend error, not modeled in this mock)
- Local status: **Spec updated**

Real-backend-only (`testing-ycm.makeupar.com`) — this prototype has no MV-generation call and no
named error-code model at all, so there is no code to fix. You supplied
`docs/MV Engine Error Code - Sheet1.csv` (RD's canonical error-code list), which gives the actual
limit: `error_audio_overlength` = **"Input audio length too long (<=240s)"**, i.e. a 240s (4-minute)
ceiling. Documented as **MV-E9** in `specs/areas/02-mv-creation.md`, with a suggested user-facing
message, and recorded in `specs/CHANGELOG-SPEC.md`.

### Reply comment (paste into eBug)

> This is specific to the real backend build (testing-ycm) — this prototype has no real generation
> API or error-code surface to fix in code. Per RD's error-code sheet
> (`docs/MV Engine Error Code - Sheet1.csv` in this repo — search "error_audio_overlength"), the
> actual limit is **240 seconds (4 minutes)**. Suggested user-facing message: **"Your audio is too
> long — please use a track under 4 minutes."** Documented in `specs/areas/02-mv-creation.md`
> (MV-E9) for whenever a real backend integration lands; no app code changed.

---

## YMW260915P0009 — [AI Music Video] error_moderation_blocked not documented

- ePF status: NewCreated · Priority: 2 · Handler: JASON_CHEN
- Triage: Documented (spec only — real-backend error, not modeled in this mock)
- Local status: **Spec updated**

Same shape as P0007. `docs/MV Engine Error Code - Sheet1.csv` has **no exact `error_moderation_blocked`
entry** — the closest match is `error_nsfw_content_detected` ("Output Blocked (image/video)"), which
may be the same failure under a different name. Documented as part of **MV-E9** in
`specs/areas/02-mv-creation.md`, flagging the name mismatch for RD to confirm rather than assuming
it.

### Reply comment (paste into eBug)

> Same as the audio-length ticket — real backend build only, nothing to fix in this prototype's
> code. Checked RD's error-code sheet (`docs/MV Engine Error Code - Sheet1.csv` in this repo) and
> could **not** find an exact `error_moderation_blocked` entry — the closest is
> `error_nsfw_content_detected` ("Output Blocked"). **@RD — can you confirm whether these are the
> same error under two names?** If so, suggested user-facing message: **"We couldn't create your MV
> because the content didn't pass our moderation check. Please try a different photo, audio, or
> description."** Documented in `specs/areas/02-mv-creation.md` (MV-E9); no app code changed.

---

## YMW260915P0010 — [Home][FAQ] Two clear buttons on the keyword search field

- ePF status: NewCreated · Priority: 2 · Handler: JASON_CHEN
- Triage: Clear to fix
- Local status: **Fixed, confirmed live**

### Report

- Repro: FAQ → type in the search field → two clear ("X") buttons appear.
- Note (QA): "Mockup has the same situation" — but two clear buttons for one field is an
  accidental artifact regardless of what the mockup shows, not an intended design.

### Resolution and verification

- Root cause: `FaqView.tsx` renders `<input type="search">` **and** its own custom clear button
  (`faq-page__search-clear`). Chrome/Safari/Edge render a native built-in clear ("X") on
  `type="search"` inputs once they have text, so with our own custom button the field showed two.
- Resolution: [faq-page.css](src/styles/faq-page.css) now suppresses
  `::-webkit-search-cancel-button` / `::-webkit-search-decoration` / `::-ms-clear`, leaving only
  the custom button.
- **Confirmed live:** typed "refund" into the FAQ search — exactly one clear button appears, and
  filtering to "2 results for refund" still works correctly.

### Reply comment (paste into eBug)

> Fixed — the search field now shows a single clear ("X") button instead of two; the browser's own
> built-in one is suppressed.

---

## YMW260915P0012 — [Home][FAQ] Contents missing for non-English languages

- ePF status: NewCreated · Priority: 2 · Assignee: SMITH_LEE → RAYMANS_PENG · Handler: JASON_CHEN
- Triage: Informational — not a code defect
- Local status: N/A (no code change)

### Report

- Repro: switch language to 繁體中文 → Home → FAQ → contents missing.
- **RAYMANS_PENG (RD, 2026-09-16): "there is no content in CMS."**

Matches documented, deliberate behavior: FAQ content is served entirely by the CMS
(`api.getFaq(locale)`), never through `src/lib/i18n/dictionaries/`. RD's own comment confirms this
is a missing-content gap in the CMS, not a code bug.

### Reply comment (paste into eBug)

> This is a content gap, not a code issue on the web app side — FAQ content is served by the CMS
> per-locale, and RAYMANS_PENG already confirmed the non-English content isn't populated there yet.
> No app code change needed; this needs CMS content for the other locales.

---

## YMW260916P0001 — [AI Music Video] .tif upload can't display normally

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Clear to fix (message wording confirmed by you: "This image format isn't supported.
  Please use JPG or PNG.")
- Local status: **Fixed, confirmed live**

### Report

- Repro: AI Music Video → upload a `.tif` image.
- Result: can't be displayed normally.
- Expected: displayed normally, OR a warning popup if the format isn't supported.
- SMITH_LEE: "need PM comment err msg."

### Resolution and verification

- Root cause: [MvRoom.tsx](src/components/mv/MvRoom.tsx)'s photo upload had **no file-type
  validation at all** — no browser can decode TIFF into an `<img>`, so it silently rendered broken.
- Resolution: reject anything other than JPG/PNG with your confirmed message, same
  reject-with-toast pattern the audio upload already uses. `accept` narrowed to
  `image/jpeg,image/png`.
- **Same gap found and fixed in a second, duplicate location**
  ([ProfileView.tsx](src/components/profile/ProfileView.tsx)'s avatar upload) — its own comment
  explicitly says it mirrors `MvRoom`'s upload "so the two entry points cannot disagree", and it
  had the identical `file.type.startsWith("image/")` gap (which still lets `.tif` through). Fixed
  the same way, same message.
- **Confirmed live:** uploading a fake `.tif` shows "This image format isn't supported. Please use
  JPG or PNG."; uploading a real `.jpg` opens the face cropper normally, no false rejection.

### Reply comment (paste into eBug)

> Fixed — uploading an unsupported image format (like .tif) now shows a clear message ("This image
> format isn't supported. Please use JPG or PNG.") instead of silently failing to display. Applies
> to both the AI Music Video character photo upload and the Profile avatar upload.

---

## YMW260916P0003 — [Account] Credits detail page shows only spent credits

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Needs PM — **decided 2026-09-17: keep current behavior (spent only)**
- Local status: Decided, no code change

### Report

QA asked PM to decide whether earning-credit entries should also show. You decided: keep current
behavior, spent-only.

### Reply comment (paste into eBug)

> Confirmed as intended — the Credits detail page is spent-only by design. No change needed.

---

## YMW260916P0006 — [AI Music Video][UI] Trim Audio confirm button lacks a disabled look

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Clear to fix (value confirmed by you: 40% opacity, site-wide)
- Local status: **Fixed, confirmed live**

### Report

- Repro: our own mockup → AI Music Video → upload audio → trim to <30s.
- Result: confirm button doesn't look disabled.
- Note: "in test link, the active status of confirm button looks like disabled status" (reverse
  confusion on the real build).

### Resolution and verification

- Root cause: [TrimAudioModal.tsx](src/components/mv/TrimAudioModal.tsx) already enforces
  `MIN_TRIM_SEC = 30` and correctly sets the confirm button `disabled` — but **no `:disabled` CSS
  rule existed anywhere in the migrated UI for any button**, so a disabled button was functionally
  blocked but looked identical to an active one.
- Resolution: added a site-wide `button:disabled { opacity: 0.4; cursor: not-allowed; }` rule to
  `src/styles/designer-overrides.css`, with a new **DESIGNER-TODO A33** entry recording the
  decision (product owner, 2026-09-17: 40% opacity).
- **Confirmed live:** any disabled button now computes to `opacity: 0.4`, `cursor: not-allowed`
  app-wide.

### Reply comment (paste into eBug)

> Fixed — disabled buttons across the app (including this Trim confirm button below 30s) now show
> a dimmed (40% opacity) look, matching what "disabled" should look like. This was a site-wide gap,
> not specific to this one button.

---

## YMW260916P0013 — [AI Music Video] Share icon stays enabled after unpublishing MV

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Clear to fix (decided by you: **hide**, matching History's precedent)
- Local status: **Fixed, confirmed live**

### Report

- Repro: History → MV → Publish → check Share state → Unpublish → check Share state again.
- Result: Share stays enabled after unpublish.
- SMITH_LEE: "pls define share button state (hide/disable)."

### Resolution and verification

- Root cause: [MvResult.tsx](src/components/mv/MvResult.tsx)'s dedicated Share button had **no
  gating on `published` at all** — unlike History's own row menu (2026-09-11 fix, `YMW260903P0012`),
  which already hides its Share entry when not published.
- Resolution: Share button now only renders `{published && (...)}`, matching History's precedent.
- **Confirmed live:** published an MV → Share appeared alongside Download/Recreate; unpublished →
  Share disappeared, Edit MV reappeared.

### Reply comment (paste into eBug)

> Fixed — the Share button on the MV result page is now hidden while the MV is unpublished (same
> rule History's own menu already used), and reappears once published.

---

## YMW260916P0020 — [Account] No sign-in dialog after sign out

- ePF status: NewCreated · Priority: 3 · Assignee: SMITH_LEE · Handler: JASON_CHEN
- Triage: **Decided 2026-09-17: agree with SMITH_LEE — spec corrected, no code change**
- Local status: Spec updated

### Report

- Repro: Account → Settings → sign out → returns to home, no sign-in dialog.
- SMITH_LEE (2026-09-17): "i think it's not necessary to popup sign in dialog after back to home
  page, suggest update spec."

### Resolution

Current code already matches the decided behavior. `specs/areas/06-profile-account.md`'s
`AC-PROF-06` now explicitly states no auto-popup after sign-out, with the reasoning and eBug
reference recorded so it isn't re-reported. Recorded in `specs/CHANGELOG-SPEC.md`.

### Reply comment (paste into eBug)

> Agreed — no automatic sign-in popup after sign-out is the intended behavior. Spec updated to
> state this explicitly; no code change needed.

---

## YMW260916P0021 — [Auto][AI Song] Newly Released song Create doesn't fully auto-fill

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Clear to fix — **direction reversed by you after investigation**
- Local status: **Fixed, confirmed live, spec updated**

### Report

- Repro: Home → Newly Released Songs → Create on any card → check Genre, Mood, Style Prompt,
  Title, Lyrics in the creation panel.
- Result (as reported): none of it fills in.

### Investigation

Found the opposite of the report: Genre, Mood, Title, and Lyrics were already correctly
auto-filling (Custom mode, the default tab since 2026-09-01) — live-verified both signed-in and
through the sign-in gate. Only Simple mode's Style Prompt was ever left blank (no source data field
for it). Put this to you as "keep the working prefill and patch the one gap, or remove it all" —

**You decided: remove it all.** The existing prefill itself was more than V1 wants, not a partial
implementation to finish.

### Resolution and verification

- [NewSongsSection.tsx](src/components/home/NewSongsSection.tsx)'s `createFromSong` no longer
  seeds the compose form at all — just gates on `requireLogin` and navigates.
- **Two duplicate copies found and fixed the same way** (Step-3 scope check): `/explore/songs` and
  `/song/play` share one component, [SongDetailView.tsx](src/components/song/SongDetailView.tsx),
  whose own comment says its Create "matches Home's create flow" — same removal applied. The "same
  list as Home's Newly Released Songs" rail on
  [SongResultView.tsx](src/components/song/SongResultView.tsx) had an identical copy-pasted
  seeding call — same removal applied there too.
- Spec updated: `specs/areas/04-explore-community.md` (`AC-EXP-02`, `AC-EXP-05`, `EXP-P1-S3`,
  `EXP-P3-S1`, `EXP-P5-S2`, §2, §7 checklist, flowchart) and
  `specs/storyboards/explore-community/build_spec.py` (v3 → v4, `AC-EXP-02`, P3-S5), regenerated.
  Recorded in `specs/CHANGELOG-SPEC.md`.
- **Confirmed live:** Create from a Newly Released Songs row now opens `/song/create` with Title
  and Lyrics both empty (no prefill at all), both signed-in and through the sign-in gate.

### Reply comment (paste into eBug)

> Investigated and found the opposite of the report — Genre/Mood/Title/Lyrics were actually already
> filling in correctly. After review, decided the auto-fill itself wasn't wanted for V1: Create now
> opens a blank creation form everywhere (Home, Explore Songs, and the song player), matching every
> other entry point into song creation.

---

## YMW260916P0022 — [Auto][AI Song] Song title input lacks a character counter

- ePF status: NewCreated · Priority: 3 (Normal) · Handler: JASON_CHEN
- Triage: Clear to fix (cap confirmed by you: 120 characters)
- Local status: **Fixed, confirmed live**

### Report

- Repro: AI Song → check Song Title input.
- Result: no counter (e.g. 0/120).

### Resolution and verification

- Root cause: no max length was ever defined for Song Title.
- Resolution: added `SONG_TITLE_MAX = 120` to [types.ts](src/lib/mv/types.ts); the title input in
  [SongCompose.tsx](src/components/song/SongCompose.tsx) now has `maxLength={120}` and a counter
  (reusing the existing `song-create__char-count` style already used for Lyrics/Describe).
- **Confirmed live:** typed 18 characters — counter correctly reads "18/120".

### Reply comment (paste into eBug)

> Fixed — Song Title now has a 120-character limit with a live counter (e.g. "18/120"), matching
> the pattern already used for Lyrics.

---

## YMW260916P0024 — [History] MV result always shows "just now"

- ePF status: NewCreated · Priority: 2 · Handler: JASON_CHEN
- Triage: Clear to fix
- Local status: **Fixed, confirmed live**

### Report

- Repro: History → open an MV that was **not** created today → check the result page.
- Result: always shows "just now" regardless of actual age.

### Resolution and verification

- Root cause: [MvResult.tsx](src/components/mv/MvResult.tsx) hardcoded the literal string "just
  now" and never read any timestamp. `useOpenCreation`'s `OpenableCreation` never carried the
  History row's real `date` through to the result screen, even though `HISTORY_SAMPLES` fixtures
  do have one (shown correctly in the History LIST, just not on the result screen it opens).
- Resolution: `useMvFlow()` gains `resultDate`/`setResultDate` (C4 additive,
  `docs/CHANGELOG-RD.md` updated, `providers.surface.test.ts` snapshot regenerated).
  `OpenableCreation` gains `date?: string`, threaded from `HistoryView.tsx` and `MvRoom.tsx`'s "My
  Creations" rail through `useOpenCreation` into the new provider field. `MvResult.tsx` now renders
  `resultDate ?? "just now"` — a live, in-session render still correctly falls back to "just now"
  since nothing set the date for it.
- **Confirmed live:** opened the "Cinematic Night" fixture (dated 2026-07-23) from History — the
  result page now shows "2026-07-23" instead of "just now".

### Reply comment (paste into eBug)

> Fixed — opening an older MV from History now shows its real creation date on the result screen
> instead of always saying "just now". A freshly-generated MV in the same session still correctly
> shows "just now".

---

## YMW260916P0026 — [AI Music Video][UI] Gray "Preparing files" button, not in mockup

- ePF status: NewCreated · Priority: 5 · Handler: JASON_CHEN
- Triage: Informational — not applicable to this repo
- Local status: N/A

Repro is against `testing-ycm.makeupar.com` (the real RD build). Grepped this repo for "Preparing
files" — zero matches; this state doesn't exist in our own mock UI at all. SMITH_LEE already
proposed NAB on the real ticket.

### Reply comment (paste into eBug)

> This doesn't exist in this prototype's UI at all — it's specific to the real backend build.
> Nothing for this repo to change; leaving SMITH_LEE's NAB proposal for the real ticket.

---

## Decisions recap (2026-09-17 session)

| #           | Decision                                                              |
| ----------- | --------------------------------------------------------------------- |
| P0002       | Keep current behavior (song player)                                   |
| P0013       | Hide Share when unpublished                                           |
| P0020       | Agree with SMITH_LEE — spec only                                      |
| P0004       | Deferred to designer — not touched                                    |
| P0003       | Keep current behavior (spent-only)                                    |
| P0006       | Fix now — 40% opacity, site-wide                                      |
| P0022       | Add 120-char cap + counter                                            |
| P0001       | Use "This image format isn't supported. Please use JPG or PNG."       |
| P0007/P0009 | Leave alone — real-backend only                                       |
| P0021       | **Reversed** — remove ALL prefill, not just patch the Simple-mode gap |

## New finding not yet acted on

While fixing P0013 (MV Share button, hide-when-unpublished), found the **identical ungated
pattern** on [SongResultView.tsx](src/components/song/SongResultView.tsx)'s own Share button
(`song-result__icon-btn`, unrelated to the P0021 fix above) — it also has no `published` gating at
all. This wasn't part of the P0013 ticket (which named MV specifically), so it wasn't touched. Flag
if you want the same hide-when-unpublished rule applied there for consistency.

## Verification

`npm run typecheck && npm run lint && npm run test:run && npm run build` all exit 0. Live-verified
every "Fixed" item above via the local dev server (not e2e — per `AGENTS.md`, the Stop hook owns
that run).

## Commit

Not committed yet. Changed files span `src/components/{mv,song,home,profile,history,providers}`,
`src/lib/mv/types.ts`, `src/styles/{faq-page.css,designer-overrides.css}`,
`docs/{CHANGELOG-RD.md,DESIGNER-TODO.md}`, and `specs/{CHANGELOG-SPEC.md,areas/04-*.md,areas/06-*.md,
storyboards/explore-community/*}`. Say the word and I'll stage explicit paths and commit (never
`git add -A`, per the repo rule) — and let me know if you'd also like me to reply to each eBug in
ePF directly, or if you'll paste the reply comments in yourself.
