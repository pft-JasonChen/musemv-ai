# TODO — deferred work (decisions on record)

Items agreed with the product owner but intentionally not done yet. Each entry
says why it's deferred and what "done" looks like. See also
`docs/DEVELOPER-HANDOVER.md` § Known gaps.

## 1. Define the Community feature (deferred 2026-07-11, product-owner decision)

The community surface (home feed sections, `/explore/mvs`, `/explore/songs`,
`/watch`, `/song/play`, `/creator`) is fully rendered but runs on **hard-coded
seed data** in `src/lib/mv/community.ts`. There is no product definition behind
it yet.

**DEFINITIVE SOURCE (2026-08-06, product owner):**
`ycmuse-app-skill/YouCam_Muse_Explore_Curation_PRD  -  V2.pdf` — at the REPO ROOT, one level
above `web-app/`.

- **Page 03's homepage UI is superseded by DP.** Where that page and the designer prototype
  disagree about the home screen, DP wins. Everything else in the PRD stands.
- **It has NOT been read.** Scanning it is deliberately deferred to the next phase — it is the
  input to the community spec + API contract, not to any UI work now in flight. Do not skim it
  and summarise; when its phase starts, read it properly.
- `docs/community-strategy-proposal.html` (the 2026-07-11 manager-facing proposal) was **deleted**
  on 2026-08-06 and is superseded by the PRD. Its four "locked decisions" are NOT carried
  forward — treat the PRD as the only source.

What "defined" means (all currently missing):

- **Product spec** — which community capabilities are real product scope
  (browse, play, like, share, follow, publish?) vs. demo dressing. Write it as
  a spec in `specs/` like `specs/mv-creation-flow.spec.md`, with EARS
  acceptance criteria.
- **Data contract** — community entities already have Zod schemas
  (`CommunityMv`, `CommunitySong`, `CommunityCreator` in
  `src/lib/api/schemas.ts`), but the `MuseApi` contract has **no community
  endpoints** (list/feed/detail/like/publish). Extend the contract + mock once
  the spec exists.
- **Real-vs-mock scope** — decide what the first backend release serves
  (e.g. read-only feeds) and what stays seeded.

Until then: do not build further community UI on top of the seed data.

## 2. Accent pills fail WCAG AA contrast — ⚪ WON'T FIX (product owner, 2026-09-01)

The small accent pills — "Create" in home/explore song rows, History filter
chips, SongCompose mode chips, Creator tabs — put white 12–13px bold text on
`--accent` (#A855F7): 3.95:1 vs the 4.5:1 minimum.

Status 2026-07-12: the axe gate now auto-scans every route and stays GREEN by
excluding exactly these pill selectors (`e2e/a11y.spec.ts`,
`KNOWN_CONTRAST_PILLS`) so it still catches everything else. Not fixed in code
because `--accent` is Figma-synced and token values must not be edited
(AGENTS.md). Options for the design owner: darker accent variant for small
text, larger/heavier label (≥ 19px bold only needs 3:1), or a different fill.
Once decided: add the token, restyle the pills, delete the exclusions.

> **2026-09-01 — closed WON'T FIX.** The product owner ruled the pills stay as
> they are; this is no longer an open design decision waiting on an answer.
> `e2e/a11y.spec.ts`'s `KNOWN_CONTRAST_PILLS` exclusion is now **permanent and
> intentional**, not a placeholder pending a design-owner reply — do not treat
> a future session's re-discovery of this contrast ratio as a new finding, and
> do not remove the exclusion without a new product decision to reopen it.

## 3. Dev-dependency audit findings (tooling only, not shipped code)

Status 2026-07-12: Storybook upgraded 8 → 10 and vite 5 → 6; findings dropped
from 7 (1 high) to **2 moderate**, both from the `postcss` version pinned
inside `next@16.2.x` itself — upstream, dev-time only, no fix short of a Next
canary. Re-check after the next Next.js minor.

## 4. ~~The production build strips `backdrop-filter`, so every DP blur is dead~~ ✅ FIXED 2026-08-05 (found in Slice 3b's G7, fixed in its own slice)

> **Resolved by `postcss-restore-backdrop-filter.mjs`.** Built CSS went from 27 prefixed /
> 8 standard declarations to 27 / 27. Keep the rest of this entry: the diagnosis below was
> right about the symptom but wrong about the cause, and the correction is worth having on
> record. **What actually does it is `@tailwindcss/postcss`, not "the minifier"** —
> lightningcss (which Tailwind runs internally) merges `backdrop-filter` and
> `-webkit-backdrop-filter` when their values are equal, and the LAST declaration wins the
> prefix set. DP writes them standard-first, so the standard form loses.
>
> **There is no configuration that turns this off** — measured across 8 lightningcss setups,
> targets from `defaults` to `safari >= 9`, plus `minify: false`. Every one of them collapses
> the pair. Source declaration ORDER is the only lever, and that lever is not ours to pull:
> `src/styles/designer/*.css` are gated verbatim (D1). So the fix is a PostCSS plugin that
> runs after Tailwind and re-adds the standard property to any rule left with only the
> prefixed one. It is additive, so the 7 stylesheets that always worked are untouched, and it
> no-ops if lightningcss ever stops collapsing the pair.
>
> **The "re-record baselines" part of the done-condition turned out to be unnecessary, and
> that is the interesting part.** `e2e:visual` came back 103/103 unchanged on every route
> except the 12 that were already stale. The gate screenshots `fullPage: true`, which captures
> at scroll offset 0 — so **nothing is ever behind a sticky navbar** and no `backdrop-filter`
> can ever affect a baseline pixel. The visual gate is structurally blind to this whole class
> of bug. It was verified instead with a scrolled A/B at 1024/1440/1920, and locked down by
> `e2e/backdrop-filter.spec.ts` (mutation-tested: 6/6 red with the plugin removed).

**`backdrop-filter` never renders in a production build.** The CSS minifier in the
`next build` pipeline keeps the obsolete `-webkit-` prefix and drops the standard
property. From `.next/static/chunks/*.css`:

```css
.detail-navbar{z-index:20;-webkit-backdrop-filter:blur(8px);background:linear-gradient(#09090b 0%,#09090b00 100%);…}
```

The source (`src/styles/designer/DetailNavbar.css`, verbatim from DP) declares
**both**. Only the prefixed one survives — and **Chrome 149 ignores the prefixed
form entirely**. Measured, in the same browser the e2e suite uses:

| element style                        | computed `backdropFilter` |
| ------------------------------------ | ------------------------- |
| `-webkit-backdrop-filter: blur(8px)` | `none`                    |
| `backdrop-filter: blur(8px)`         | `blur(8px)`               |

So this is not a headless artifact and not a DP defect — DP's CSS is correct. It is
our build pipeline silently removing the only form that works.

**Scope: 13 of the 19 copied designer stylesheets use `backdrop-filter`** —
`DetailNavbar`, `RoomNavbar`, `MobileHeader`, `MobileTabBar`, `Card`, `Badge`,
`IconButton`, `CreditBalance`, `HistoryPage`, `LyricsSheet`, and more. Every
frosted-glass surface in the migrated UI is currently plain transparent.

**Where it is already visibly wrong:** `/explore/songs` at ≥1024px. DP's navbar
background is `linear-gradient(#09090b → transparent)` and relies on the blur to
keep the fade legible. With no blur, the song list scrolls **sharply** through the
navbar's lower half — rows and album thumbnails collide with the Back control and
sit under the tab pills, unreadable (screenshot in the slice's review notes).

**Why it never showed until now.** `/history` is the only other migrated screen with
a two-row navbar, and at 1440×800 it does not scroll at all (`scrollHeight` equals
the viewport), so nothing has ever passed behind that gradient. `/explore/mvs`'s
navbar has no tabs row, so its opaque top covers the whole 80px.

**Not fixed here, deliberately.** The fix is in the build/minifier configuration and
would change the rendering of **all 13 stylesheets across every migrated screen** —
it needs its own change, its own six-width re-check, and new visual baselines. Doing
it at the tail of a screen migration would bundle an app-wide visual change into a
slice that is supposed to be one screen. **Do NOT paper over it in
`designer-overrides.css`** by making the navbar opaque: that hides one symptom of a
systemic problem and leaves the other twelve.

**Done looks like:** the standard `backdrop-filter` present in
`.next/static/chunks/*.css`; a test asserting `getComputedStyle(navbar).backdropFilter
!== "none"` on a production build so it cannot regress silently; the six widths
re-checked and baselines re-recorded on Linux.

**How it was actually closed (2026-08-05):**

- `postcss-restore-backdrop-filter.mjs`, wired after `@tailwindcss/postcss`. Bundle went
  27 prefixed / 8 standard → 27 / 27.
- `e2e/backdrop-filter.spec.ts` — 5 computed-style cases (`.detail-navbar`, `.room-navbar`,
  `.sidebar` at 1440; `.mobile-tabbar`, `.mobile-header` at 375) plus a sweep of the shipped
  CSS text for any rule left with a prefixed declaration and no standard one.
  **Mutation-tested both ways:** 6/6 red with the plugin removed, 6/6 green with it.
- **The sweep had to read the stylesheet TEXT, not the CSSOM.** The first version walked
  `document.styleSheets` and passed in BOTH states — Chrome does not implement
  `-webkit-backdrop-filter`, so it discards the declaration while parsing and
  `getPropertyValue("-webkit-backdrop-filter")` returns empty for exactly the rules that are
  broken. A test that cannot fail is worse than no test; this one was caught by running the
  mutation, not by reading it.
- Baselines: only the 12 already-stale ones changed (see the note at the top of this entry).

## 5. ~~The playback seek bar cannot be operated by keyboard~~ ✅ FIXED 2026-08-12

> **Closed 2026-08-12 — all of them, and there were FIVE, not four.** Every bare
> `<div onPointerDown>` seek track now renders through `ui/SeekBar`, which has `role="slider"`,
> `tabIndex={0}`, `aria-valuemin/max/now/text` and the conventional media-scrubber key map
> (←/→/↑/↓ = 5s, PageUp/PageDown = 10%, Home/End). The swap is markup- and class-name-identical,
> so it is pixel-neutral by construction.
>
> | screen            | component        | block                                  |
> | ----------------- | ---------------- | -------------------------------------- |
> | `/song/result`    | `SongResultView` | `.song-result__progress`               |
> | `/mv/result`      | `MvResult`       | `.mv-result__progress`                 |
> | `/mv/edit`        | `MvEditor`       | `.mv-edit__progress`                   |
> | `/song/play`      | `SongDetailView` | `.song-detail-mobile-player__progress` |
> | **`SongPlayBar`** | `SongPlayBar`    | `.song-bar__progress`                  |
>
> **The fifth was not on anyone's list.** `SongPlayBar` arrived with the drop-2 re-sync on
> 2026-08-07, _after_ this entry and `NEXT-SESSION`'s "four seek bars" were written, and it was
> ported with the same pointer-only defect. Found by grepping for the defect rather than working
> from the list — worth remembering, because the list was accurate when written and wrong by the
> time it was actioned.
>
> `/mv/result`'s bar was also a regression against the pre-migration `<video controls>`; that is
> now closed too. `/watch` already used `SeekBar` and is unchanged.
>
> Note `useSeek` in `SongDetailView` survives as a hook but now returns `{ seek }` instead of
> `{ trackRef, onPointerDown }`. Original entry follows.

### 5.1 Original entry (2026-08-05, G7 a11y audit)

**WCAG 2.1.1 Keyboard, severity Serious.** Both progress tracks on the merged song screen —
`.now-playing__progress` (desktop) and `.song-detail-mobile-player__progress` (mobile) — are
plain `<div ref={trackRef} onPointerDown={...}>` in `SongDetailView.tsx`. No `tabIndex`, no
`role`, no keydown handler; `useSeek` wires only `pointerdown` / `pointermove` / `pointerup`.

Play / Pause / Prev / Next are real `<button>`s and ARE keyboard-operable, so the screen is not
unusable — but **a keyboard-only user cannot scrub to an arbitrary position at all.**

Found by the independent G7 audit of slice 3b, not by the standing gate: axe cannot detect a
missing interaction affordance on a `<div>` that claims no role, so this needs the code read or
a manual keyboard pass. It is 3b's code, not the `backdrop-filter` slice's.

**Done looks like:** `role="slider"` + `tabIndex={0}` + `aria-valuenow` / `aria-valuemin` /
`aria-valuemax` / `aria-label`, plus Arrow / Home / End key handling — or a styled native
`<input type="range">`, which gets all of that for free. Either way it needs a behaviour test
(seek with the keyboard, assert `currentTime` moved), because a screenshot cannot see it.

**Ask before styling:** DP's design has no visible slider thumb affordance. Adding ARIA and key
handling changes no pixels and is safe; changing how the track LOOKS is a designer decision.

## 6. `e2e/a11y.spec.ts` never sets a viewport, so mobile chrome has never been scanned (found 2026-08-05)

The spec runs at Playwright's default ~1280x720. At that width `.mobile-header`,
`.mobile-tabbar`, and the mobile full-screen player are all `display: none`, so **axe has never
seen any of the mobile-only chrome.** This is what let `DESIGNER-TODO` A9 (mobile tab-bar labels
at 3.74:1) sit undetected.

This is the THIRD documented blind spot in that gate, alongside the two already in `AGENTS.md`:
it does not seed auth (so four guarded routes show only the sign-in modal to axe), and it only
scans unprefixed English routes.

**Done looks like:** the spec runs each discovered route at a mobile width as well as a desktop
one. **Sequencing matters:** adding the mobile pass turns A9's contrast failure into an
immediate gate failure, so either A9's colour decision lands first, or the mobile pass ships
with A9 in the exclusion list and a comment pointing at it — the same pattern A1 already uses.

## 7. Affordance findings from the Phase 3 acceptance review (found 2026-08-06)

> **SCOPE RULE, set by the product owner 2026-08-06.** This phase's job is that **the code
> architecture is sound enough for RD to wire the backend**. A finding that is _purely UI_ and
> does not touch the contract, the providers, or a product rule is **deliberately left unfixed**
> until the designer ships the next DP drop. That covers most of 7a–7h below and most of
> `DESIGNER-TODO`. It is a decision, not a backlog that slipped.

The G7 affordance review diffed every migrated component against `5296f1a` control-by-control.
Five findings were plain losses and were fixed with guards (see `docs/archive/PHASE-3-ACCEPTANCE.md`).
These are the rest — each needs a designer or product answer first, so none was patched around.

**7a. ~~ANSWERED, AND DEFERRED IN FULL.~~ ✅ REMOVED 2026-09-01 — the feature itself is gone, not
waiting on artwork.** The product owner removed the ±15s skip controls from the product on
2026-09-01: there are no ±15s controls anywhere in Muse and none are planned, so the 2026-08-06
"comes back and coexists with prev/next" decision below is superseded, not merely still pending.
This was never blocked on effort — it was blocked on a designer glyph for a control that no
longer exists to need one. `grep -rn "±15\|nudge" src` (outside tests) now returns nothing; the
keyboard-seek half this item bundled in is unaffected and stays closed via item #5 above (all
five seek bars are keyboard-operable `SeekBar`s regardless of ±15s). Nothing further to do here —
do not re-open this waiting on a designer drop.

Original entry, kept for history:

**ANSWERED, AND DEFERRED IN FULL** _(superseded — see above)_. Decision (product owner,
2026-08-06): **±15s comes back and coexists with prev/next** — it is not either/or.
Implementation waits for the DP drop, and so does the keyboard-seek half, which was offered
separately and deferred with it.

Two things the next session must not have to re-derive:

- **±15s is blocked on artwork, not on effort.** Neither DP's 90 icons nor WA's 90 contain a
  ±15s glyph, and the drop measured on 2026-08-06 (`2670ed2`) adds no icons at all. The
  pre-migration control used a hand-drawn inline `<svg>`. DP's `.song-result__transport` is also
  drawn for three slots. So this needs a designer answer for both the icon and a five-control
  transport — put it in front of the designer with the next drop.
- **The keyboard half is cheap and ready when it is unblocked.** `SeekBar`
  (`src/components/ui/SeekBar.tsx`) already exists, is keyboard-operable, takes its BEM class
  names as props, and is in production on `/watch`. Swapping the four bare
  `<div onPointerDown>` tracks onto it is a mechanical change with zero pixel movement.

The original finding, for context:

**`/song/result` lost ±15s, which leaves no keyboard way to seek.** DP's transport spends
those two slots on prev/next through the playlist. `useAudioPlayer.nudge` still exists and is
now unused on this screen, and `.song-result__progress` is a bare `<div onPointerDown>`. This is
**item #5 above happening on a second screen** — and it now also applies to `.mv-result__progress`
and `.mv-edit__progress`, both bare `<div onPointerDown>` too. On `/mv/result` it is a
REGRESSION: the pre-migration screen was `<video controls>`, which is keyboard-seekable.
**Done looks like:** #5's fix applied to all four tracks at once, plus a decision on whether
±15s comes back alongside prev/next or stays dropped.

**7b. The Face Picker's explicit Cancel is gone.** Dismissal still works three other ways
(header Close, backdrop, Escape), so nobody is stranded — the finding is that it was dropped
silently. Decide: restore it, or record the omission in the component header as deliberate.

**7c. "Change song" survives as a control but not as an affordance.** The explicit `Change`
button became `.mv-create__song-added-label`, whose only accessible name is the noun
"Song Library" / "Imported Audio". A user who wants a different song has to guess it is
clickable.

**7d. `/song/result`'s Download and volume/mute are `display: none` below 1024px**
(`SongCreatePage.css:1089`). Both are new controls, so nothing was lost — but the result
autoplays and phone users get no volume control at all. Designer question.

**7e. CLOSED 2026-08-06 — deleted, and it was six files, not one.** `TrendingMvsPanel` went, and
so did the five that `/history`'s move to the result screens orphaned: `CreationDialog` (the
root), `MvDetail`, `SongDetail`, `LyricsPanel` (SongDetail was its last consumer) and
`CommunityMvDialog`. Each had a live DP replacement — `/watch`, `/mv/result`, `/song/result`,
`ui/LyricsSheet`. The only logic that went with them is `FREE_PREVIEW_SEC`, already cancelled by
S3.

**7f. ~~HALF CLOSED 2026-08-06~~ ✅ FULLY CLOSED 2026-09-03.** `HistoryView.tsx`'s `rowHref` was
locale-prefixed and guarded in 2026-08-06's half (`e2e` → "item 3: the row href matches where the
click actually goes"). The other half — Delete Account's `router.push("/")` in `SettingsView.tsx`
— is now `router.push(localePath(locale, "/"))`. It was the last raw unprefixed navigation in
`src/`: `grep -rn 'router\.push("\|router\.replace("' src` returns only a comment now.

Worth recording why it survived three weeks: the file **already imported `localePath` and
`useLocale`**, and used them correctly on the line 100 rows above (sign-out) and in
`DetailNavbar`'s `fallbackPath`. So the defect was not "this file doesn't know about locales", it
was one call site inside a `setTimeout` inside an `onClick` — and in English the cookie redirect
lands you on the right page anyway, so nothing looks wrong to anyone testing it. That is R-9's
whole thesis, and `guard-greps.sh` cannot see it: the rule greps for a literal `<a href="/`, not
for `router.push`.

**7g. CLOSED 2026-08-06 — answered "show both, by state".** The rails now follow DP: **Trending**
when logged out or when the user has made nothing, **My Creations** over `useHistory()` once
they have. Title, rows and "See all" switch together. The extra "and has made something"
condition is WA-specific: DP can key on sign-in alone because its `MY_CREATIONS` fixture is never
empty. Guarded in `e2e` (three tests, including the signed-in-but-empty case).

**7j. CLOSED 2026-08-07 — drop 2's two blocked stylesheets are resolved.** `/explore/mvs` has
DP's `.mv-detail__mobile-grid` on phones (it was rendering blank), and `/song/play`'s desktop
column is gone in favour of DP's model: the row title navigates to `/song/result`, the album art
starts the new `SongPlayBar`. `AC-EXP-03` / `AC-EXP-05` / `EXP-P3-S1` were rewritten with the code,
and the 3b assertion that pinned the old decision was replaced rather than argued with. Two product
decisions came with it — `DESIGNER-TODO` **A19** (phones reach 3 of 14 MVs) and "a community song
gets no Recreate/Publish". Full record: `docs/archive/NEXT-SESSION.md` §2.0.

**7i. Two capabilities drop 2 (`2670ed2`) shipped and WA has not adopted.** Neither costs
anything today — the current behaviour is unchanged and nothing is lost — but both are the
designer's answer to A5 and WA is only using half of it.

- **`RoomNavbar`'s `mobileBackHref`.** DP passes it on AccountPage and SongCreatePage; a
  RoomNavbar that gets it renders the same 50px compact back bar `DetailNavbar` now has, via a
  `.room-navbar--mobile-back` modifier that `AppLayout.css` explicitly exempts from its mobile
  hide rule. WA's RoomNavbar has no such prop, so `/mv/room`, `/song/create` and `/profile` stay
  hidden on phones exactly as before. **Not a regression, an unused affordance.** `/history`
  correctly stays out of it — DP's own comment names History as the page that keeps the old
  behaviour, which is also why the `.room-navbar` half of the A4 override must stay.
- **DP's page-specific mobile headers.** `MVDetailPage` passes `hideMobileBar` and draws
  `.mv-detail__mobile-header` / `.mv-player__mobile-header` itself (back + title + a
  "Singing | 1-2 min" style subtitle). WA has not ported those, so `/watch` keeps
  `DetailNavbar`'s generic bar instead. **Do not pass `hideMobileBar` there until the replacement
  exists** — deleting the affordance before building its successor is precisely how A5 happened.

**Done looks like:** the prop threaded through `RoomNavbar.tsx` with the same
`localePath`-and-intercept treatment `DetailNavbar` uses (R-9), and either the two mobile headers
ported or a recorded decision that DetailNavbar's bar is good enough for WA.

**7h. ~~`/mv/room`'s disabled CTA lost its reason line~~ ✅ CLOSED 2026-08-20 — the requirement was withdrawn, not satisfied.** The product owner directed that DP is the reference here, and DP's `MVCreatePage` has no hint line and no class for one. `MV-P1-S1` no longer asks for it, so there is nothing for the designer to add. Original note: ("Add a song and a description to
continue."). Not a DP-fidelity constraint — `/song/create` KEPT its equivalent inside migrated
markup, using `.song-create__title-hint`. `MVCreatePage.css` simply has no counterpart class,
and inventing one, borrowing `song-create__`'s, or adding an override all break a rule
(`designer-overrides.css` takes only already-decided defects; a class no stylesheet defines
renders as nothing). **Done looks like:** the designer adds a hint class to `MVCreatePage.css`,
after which this is a two-line change. Until then `/mv/room` disables the button and says
nothing, while `/song/create` explains itself — an inconsistency, recorded rather than papered
over.

---

## 8. ~~Two code defects found by the 2026-08-19 spec audit~~ ✅ BOTH FIXED 2026-08-19

Both came out of the full spec↔code sweep (`docs/spec-audit-2026-08-19.html`). Recorded here
rather than fixed in that pass because neither is a doc problem — the specs already say the right
thing, so **the spec was deliberately left alone and the code is what has to move.**

**8a. ~~The Home song rail's Like bypasses the login gate.~~ ✅ FIXED.** `ui/ListItem`'s Like is now CONTROLLED (`liked` + `onToggleLike`), matching `TopSongListItem`; omitting `onToggleLike` renders no like button at all, so there is no uncontrolled path back. Guarded by e2e "TODO#8a", mutation-tested. Original report: `ui/ListItem.tsx:222` flips its own
`useState` directly:

```tsx
onClick={() => setLiked((current) => !current)}
```

No `requireLogin`. The component's own comment at `:89` says callers wrap **the Create pill** in
`requireLogin` — which they do — so the Like button was simply never included in that contract.
`SongPlayBar` and `TopSongListItem`, on the same screen, both gate correctly. This is the only
community Like control in the app that violates **GL-02** (`AC-EXP-08`, `EXP-E2`).
**Done looks like:** `ListItem` takes an `onLike` the caller supplies (as `TopSongListItem` does)
rather than owning the state, plus an e2e that clicks Like as a guest and asserts the sign-in
modal opens — mutation-tested both ways.

**8b. ~~`/song/result` shows invented lyrics for songs that have none.~~ ✅ FIXED.** `FALLBACK_LYRICS` deleted; the Lyrics button, the inline panel and the sheet all render only when the song actually has lyrics. This reverses a 2026-08-11 designer request, so the missing empty-state is recorded as `DESIGNER-TODO` **A23**. Guarded by e2e "TODO#8b", mutation-tested. Original report: `SongResultView.tsx:233-236`
falls back to `FALLBACK_LYRICS`, and the Lyrics button and sheet render unconditionally
(`:450-457`, `:678-688`). So a **Simple-mode** song — which never had lyrics — opens a sheet of
generic filler presented as its own words. `AC-SONG-06` and `SONG-P3-S2` both say the sheet appears
**only when lyrics exist**; the product owner confirmed on 2026-08-19 that the spec is right and
this is a bug, not a demo convenience. It is also the kind of thing a CEO demo gets caught on.
**Done looks like:** no `FALLBACK_LYRICS`; the Lyrics affordance is absent when the song carries no
lyrics, guarded by an e2e that creates a Simple-mode song and asserts the control is not rendered.

---

## 9. ~~`/mv/edit`'s cost sentence renders `(26credits)` with no space~~ ✅ FIXED 2026-09-03

> **Closed, and the cause was not what the entry below assumes.** This entry (rightly) refused to
> let anyone "fix it by reasoning about JSX whitespace rules" and demanded a browser repro first.
> Both were done — and then the compiled bundle was read, which is what actually settles it. SWC
> emitted the children as
>
> ```js
> ["Recreate (", sceneCost, "credits) … saved — Merge MV (", COST_MERGE, " credits) re-renders …"]
> ```
>
> The two halves are not symmetric in the SOURCE the way the entry assumed. The text node after
> `{COST_MERGE}` has a whitespace-only second line, which JSX drops, leaving an effectively
> single-line node whose leading space survives. The node after `{sceneCost}` spans two NON-empty
> source lines, and SWC trims the leading whitespace of the joined result. **So the trigger is
> where Prettier happened to WRAP the sentence, not the expression before it** — which means
> either half could have lost its space on any future reflow, and a `{" "}` would only have fixed
> today's wrap.
>
> **What shipped:** `MvEditor.tsx` builds the sentence from string literals, so there is no JSX
> text node left for a formatter to re-wrap. Live DOM now reads
> `"Recreate (26 credits) … Merge MV (10 credits) …"`, confirmed on screen in the re-captured
> `13_scene_recreated_version.png`, not just in `textContent`. Guarded by `e2e`'s
> **"TODO#9: the MV-08 sentence spaces BOTH credit figures, not just the flat one"**, which
> asserts the shape (`two "(N credits)" figures`, never `\d+credits`) rather than the literal 26,
> because `recreateShotCost()` moves with the scene. Mutation-tested both ways: red with the JSX
> form restored, green with it fixed.
>
> **S3 was re-captured in the same change** — all 24 shots, `build_spec.py` bumped to v2 and the
> flowchart stamp with it. The `strings_ignore` entry did NOT go away as this entry predicted, but
> its reason changed completely: `lint_spec.py`'s `_ENT` map rewrites the spec's `&mdash;` to an
> ASCII hyphen while the source carries a real U+2014, so that one string can never byte-match
> whatever the copy says. The bug-tolerating comment on it is replaced by that explanation, and
> the `limits` bullet telling QA the missing space was deliberate is deleted.
>
> **Two things the re-capture turned up that were not this bug.** (1) The old screenshots were
> *also* stale on the sidebar logo — it changed after 2026-08-28 and nothing had re-captured S3
> since. (2) `specs/storyboards/mv-edit/` and `specs/storyboards/credits-iap/` were the two capture
> scripts that never adopted `capture_lib.chromium_path()`, so **S3 and S5 could not be re-captured
> at all on a sandboxed image** — the launch died on a build-number mismatch with a message telling
> you to run `playwright install`. Both now use the shared resolver. S3's insufficient-balance step
> also waited a flat 2500ms against a 2200ms `setTimeout`; under load the click landed on a still-
> disabled Merge and the run died 30s later on a selector, reading exactly like a broken credits
> gate. It now waits for `.mv-edit__merge-btn:not([disabled])`.

### 9.1 Original entry (2026-08-28), kept for the repro it insisted on

**Deferred by the product owner on 2026-08-28: fix it LATER, after the S3 spec landed.** The S3
(`mv-edit`) storyboard quotes and photographs this sentence **verbatim, bug included**, with a
`strings_ignore` entry saying so — so fixing the app makes `12_scene_recreate_enabled.png`,
`13_scene_recreated_version.png` and two `exact` strings stale. That is why the fix waits: it costs
a re-capture, not one line.

`MvEditor.tsx:488-489` renders

```
Recreate (26credits) replaces a scene directly. Edits aren't saved — Merge MV (10 credits) re-renders…
```

— **no space before "credits" after the dynamic scene cost, a normal space after Merge's flat
one** — even though the JSX source has an identical literal space in both places:

```tsx
Recreate ({sceneCost} credits) replaces a scene directly. Edits aren&apos;t saved —
Merge MV ({COST_MERGE} credits) re-renders the video with your changes.
```

Reading the source is what makes this look impossible; the capture is what settles it. Confirmed
twice — by a DOM `textContent` read across two scenes with different cost values during the S3
capture run, and by eye in the committed screenshot. **Do not "fix" it by reasoning about JSX
whitespace rules; reproduce it in a browser first**, because the asymmetry between the two halves
of one sentence is the part any theory has to explain.

**Repro:** `/mv/edit` with flow state → edit any scene's prompt → read `.mv-edit__sublabel`'s
`textContent`.

**Done looks like:** an explicit separator (`{" "}` or `&nbsp;`) so both halves read the same, an
e2e assertion on the sublabel's text mutation-tested both ways, and the S3 spec re-captured and
re-quoted in the same change — including dropping its `strings_ignore` entry, which exists only to
tolerate this bug.

**While you are in there:** delete the stale comments naming constants that no longer exist —
`COST_RENDER` / `COST_STORYBOARD` / `COST_REGEN` in `src/lib/user.ts:70-71`,
`src/components/mv/MvResult.tsx:91` and `src/components/mv/MvEditor.tsx:71,140`. Those comments are
what fed the `areas/02` pricing drift that S3 corrected (Merge is a flat `COST_MERGE` = 10, per
`areas/11` §3.6 — the spec had claimed `COST_RENDER` 200, a constant that does not exist).
