# TODO — deferred work (decisions on record)

Items agreed with the product owner but intentionally not done yet. Each entry
says why it's deferred and what "done" looks like. See also
`docs/DEVELOPER-HANDOVER.md` § Known gaps.

## 1. Define the Community feature (deferred 2026-07-11, product-owner decision)

The community surface (home feed sections, `/explore/mvs`, `/explore/songs`,
`/watch`, `/song/play`, `/creator`) is fully rendered but runs on **hard-coded
seed data** in `src/lib/mv/community.ts`. There is no product definition behind
it yet.

**Strategy proposal (2026-07-11):** `docs/community-strategy-proposal.html` — a
manager-facing proposal covering the four locked decisions (official-first feed
with locale-secondary; IP-based locale; HN-gravity time-decayed ranking;
auto-prescreen + human-review-of-gray-zone moderation), the Phase 1/2/3
algorithm roadmap, the Phase 1 ranking formula, the moderation pipeline + data
model, and open decisions still needing sign-off. Turn its conclusions into a
`specs/` spec + API contract once approved.

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

## 2. Accent pills fail WCAG AA contrast (needs a design decision)

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

## 5. The playback seek bar cannot be operated by keyboard (found 2026-08-05, G7 a11y audit)

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

## 7. Affordance findings from the Phase 3 acceptance review that need a decision (found 2026-08-06)

The G7 affordance review diffed every migrated component against `5296f1a` control-by-control.
Five findings were plain losses and were fixed with guards (see `docs/PHASE-3-ACCEPTANCE.md`).
These are the rest — each needs a designer or product answer first, so none was patched around.

**7a. `/song/result` lost ±15s, which leaves no keyboard way to seek.** DP's transport spends
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

**7e. Dead code: `src/components/community/TrendingMvsPanel.tsx` has had zero consumers since
slice 3g.** Delete it, or say why it stays.

**7f. Out-of-scope R-9 leaks.** `HistoryView.tsx` builds unprefixed `rowHref`s (clicks are
intercepted, so only middle-click / copy-link lose the locale prefix) and `SettingsView.tsx:170`
does `router.push("/")`. Neither is migrated code, but both are the same shape R-9 exists to
prevent, and both are invisible when testing in English.

**7g. The rails on `/mv/room` and `/song/create` show community fixtures.** The migration's
"My Creations" title was corrected to "Trending MVs" / "Trending Songs" so the label matches the
data. Whether those rails should instead show the user's OWN history (which `useHistory()`
already has) is a product decision, not a rename — the guard test asserts the pairing, so
either answer stays honest.

**7h. `/mv/room`'s disabled CTA lost its reason line** ("Add a song and a description to
continue."). Not a DP-fidelity constraint — `/song/create` KEPT its equivalent inside migrated
markup, using `.song-create__title-hint`. `MVCreatePage.css` simply has no counterpart class,
and inventing one, borrowing `song-create__`'s, or adding an override all break a rule
(`designer-overrides.css` takes only already-decided defects; a class no stylesheet defines
renders as nothing). **Done looks like:** the designer adds a hint class to `MVCreatePage.css`,
after which this is a two-line change. Until then `/mv/room` disables the button and says
nothing, while `/song/create` explains itself — an inconsistency, recorded rather than papered
over.
