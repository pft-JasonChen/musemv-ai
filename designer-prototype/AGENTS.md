# AGENTS.md — YCM UI Prototype

This file is the working-agreement for any coding agent (or engineer) picking up this
repository. It restates and expands on the rules already established in
[CLAUDE.md](CLAUDE.md) — read that file too, it is the source of truth for scope and
process. This file adds the technical detail CLAUDE.md doesn't cover: stack, structure,
conventions, and concrete commands.

## Project purpose

YCM (product name "MUSE" / "YouCam Muse") is an AI music-video and song creation product.
**This repository is a UI prototype only** — it exists so the product owner can review
screens and flows in a browser, and so RD can copy components/CSS for the real frontend
later. It is explicitly **not**:
- production-ready code
- wired to any backend or API
- a place to build real authentication, payments, or data persistence

Every screen uses mock data and local component state to simulate behavior. Treat that as
permanent scope, not a temporary shortcut to clean up.

## Tech stack

- **React 19** + **TypeScript** + **Vite 8**
- Plain CSS only — no Tailwind, no CSS-in-JS, no UI framework
- No router library — routing is manual `window.location.pathname` string-matching in
  [src/App.tsx](src/App.tsx)
- No state-management library — local component state (`useState`/`useRef`/`useEffect`) only
- No backend, no API calls, no data fetching
- The only runtime dependencies are `react` and `react-dom`. Do not add packages without the
  user's explicit, prior approval — this includes small utility libraries, icon packs, date
  libraries, animation libraries, etc.

## Project structure

```
src/
  pages/            One folder per route/screen. Large pages split into per-section
                     sub-files inside the same folder (e.g. HomePage/HeroBannerSection.tsx)
                     rather than one monolithic file. Each section still gets its own .css.
  components/        Shared/reusable UI. One folder per component: ComponentName/ComponentName.tsx
                     + ComponentName.css, no barrel index.ts files.
  layouts/            Page chrome shared across pages. Currently just AppLayout/
                     (Sidebar + Navbar/DetailNavbar slot + optional Footer + mobile
                     chrome). Footer and the app-mobile bottom tab bar are opt-in per page
                     via `showFooter`/`showMobileTabBar` props (both default `false`) —
                     they used to render unconditionally on every page. Only Home and
                     History currently pass them; a new page needs one of these only if
                     its Figma frame actually shows that chrome. `showMobileHeader`
                     (default `true`) lets a page opt OUT of the shared app-mobile
                     `MobileHeader` when it renders its own Figma-specific mobile header
                     instead — MVDetailPage does this for its immersive MV index/player.
  data/               Mock data assembled from real asset files via import.meta.glob
                     (songs.ts, musicVideos.ts). No manual re-registration needed when new
                     asset folders are added that match the existing naming pattern.
                     storyboardClips.ts assembles the storyboard media catalog used by
                     Edit MV and Storyboard screens.
                     mvDraft.ts is different: a sessionStorage-backed draft object that
                     bridges state between separately-routed MV Create/Storyboard/Result/
                     Edit pages, since routing here is full-page navigation, not client-side
                     — component state can't survive the page transition on its own.
                     profile.ts holds the "which profile does this username link to"
                     convention: CURRENT_USERNAME, isOwnUsername(), and
                     communityProfileHref() — every clickable avatar in the app (Card,
                     ListItem, TopSongListItem, MV/Song Detail) routes through this rather
                     than building a `/community-profile?user=...` URL by hand.
  hooks/              Shared React hooks with no page/component of their own. useEnhance.ts
                     (the "Enhance" button's dim-input/spin-icon/swap-text processing
                     state, reused by every prompt textarea across the app) and
                     useMountTransition.ts (see "Popup open/close transitions" below —
                     the shared hook every dialog/sheet uses for its enter/exit animation).
  config/             layoutMode.ts — one flag (MOBILE_LAYOUT) controlling which mobile
                     chrome renders below the app-mobile breakpoint.
  styles/             tokens.css (design tokens, do not edit without explicit request) and
                     breakpoints.css (empty reference scaffolding for the six RWD tiers —
                     not actually imported; each component does its own media queries inline).
  assets/             backgrounds/, brand/, covers/ (albums, MVs, avatars, Top Picks Songs —
                     the largest folder), hero/, icons/ (ic_*.svg, monochrome, applied via
                     CSS mask so they can be tinted with currentColor).
  App.tsx             Manual pathname routing (no router lib).
  index.css           Global reset + body defaults, sourced from tokens.css.
```

Routing today (`src/App.tsx`): `/` or `/home*` → HomePage (desktop renders the review-c
Tool Selector/Hero treatment the product owner picked — `ToolSelectorSectionV3`/
`HeroBannerSectionV3` — while mobile keeps the original `ToolSelectorSection`/
`HeroBannerSection`, chosen independently of the desktop A/B result; see `HomePage.tsx`'s
`isMobile` branch. The `/home-review-b` and `/home-review-c` temporary A/B routes and the
losing `HomePageReviewB`/`HomePageReviewC`/`ToolSelectorSectionAlt` files have been removed
now that the pick is made), `/mv-detail*` → MVDetailPage,
`/song-detail*` → SongDetailPage, `/song-create*` → SongCreatePage, `/mv-create*` →
MVCreatePage, `/mv-storyboard*` → MVStoryboardPage, `/mv-result*` → MVResultPage,
`/mv-edit*` → MVEditPage, `/history*` → HistoryPage, `/blog*` → BlogPage concept 1,
`/blog3*` → BlogPage concept 3, `/account*` → AccountPage, `/account/credits*` →
CreditsPage, `/community-profile*` → CommunityProfilePage, and `/components*` →
ComponentsPage (internal style-guide page, not part of the product). Anything else → a
plain fallback placeholder.
`vercel.json` rewrites all paths to `/index.html` so these routes survive a hard
refresh/deep link on Vercel. `AppRoutes` is wrapped by `AuthProvider`, which supplies the
prototype-only signed-in state and global LoginModal.

## Coding and naming conventions

- **Components**: PascalCase folder + matching PascalCase filenames
  (`Button/Button.tsx`, `Button/Button.css`). Keep this 1:1 colocation for any new component.
- **CSS classes**: BEM-style, kebab-case, rooted in the component name
  (`.card__play-icon`, `.detail-navbar__back-button`, modifiers like
  `.mobile-tabbar__item--active`). Follow this exactly for new components — it is applied
  with no exceptions across the existing codebase.
- **CSS custom properties**: kebab-case, namespaced by category (see Design Tokens below).
- **Icon assets**: `ic_<name>.svg`, snake_case, monochrome, imported as a URL and applied
  via CSS `mask-image`/`-webkit-mask-image` (not `<img>`) so one asset can be recolored with
  `currentColor` per variant/state. Follow this pattern for any new icon — don't hand-draw
  SVG paths inline, and don't switch to `<img>` just because it's simpler.
- **Data files**: plural camelCase (`songs.ts`, `musicVideos.ts`) exporting
  `SCREAMING_SNAKE_CASE` constants (`SONGS`, `MUSIC_VIDEOS`), built from
  `import.meta.glob` over an asset folder rather than hand-written arrays. Follow this
  pattern if a new catalog of mock content is needed — don't hardcode a parallel list that
  can drift from the actual asset files.
- **Figma provenance comments**: components consistently cite the Figma node they were
  built from in a comment (e.g. `// Figma "List/List Item/dt" (node 1270:21039)`). Keep
  adding these — they're how visual fidelity is traced back to source designs, and the next
  agent/engineer will need them to re-check or extend a screen against Figma.
- Default to **no comments** otherwise, per general good practice — only the Figma
  provenance notes and genuine non-obvious "why" notes are the exception, matching what's
  already in the codebase.
- **Every dynamic UI state change gets a `transition` — no instant snaps.** Show/hide,
  expand/collapse, active/selected swaps, size or shape changes driven by state, etc. all
  need to animate, per CLAUDE.md. The established pattern (see `SongDetailPage`'s Now
  Playing lyrics toggle) is:
  1. **Keep both states mounted** — don't conditionally render (`{condition && <X/>}`) an
     element that needs to animate in/out, since React unmount/mount can't transition.
     Always render it, and toggle a BEM modifier class (e.g. `--open`, `--hidden`,
     `--active`) that flips the CSS properties actually being transitioned.
  2. **Transition `opacity`/`transform`/layout properties like `max-width`,
     `border-radius`** directly on the base class (`transition: opacity 0.2s ease;`), with
     the modifier class only changing the end-state values (`opacity: 0` / `1`,
     `pointer-events: none` / `auto`, etc.) — not the transition itself.
  3. Typical duration/easing already used across the codebase: **0.15s–0.2s, `ease`**
     (matches `.mv-song-picker__use`, `.tool-selector__card`, `.now-playing__art`, etc.) —
     reuse this rather than inventing a new duration per component.
  4. Always pair a hidden/closed state with `pointer-events: none` so it doesn't intercept
     clicks while invisible, and `pointer-events: auto` on the open/visible modifier.
  5. **A gradient itself can't be transitioned/interpolated** (not by size, and not between
     two different stop configurations) — if a hover/active state needs a *different*
     gradient (bigger glow, shimmer border, gradient stroke), don't animate the gradient
     property directly. Add a separate layered element (another `::before`/`::after`, or the
     double-background border trick) holding the target-state gradient, and fade **its
     opacity** in/out instead. See `ToolSelectorSection`'s hover glow/shimmer border or
     `UpgradeDialog`'s gradient-stroke featured card for the concrete pattern.
- **Popup open/close transitions use the shared `useMountTransition` hook**
  (`src/hooks/useMountTransition.ts`), not a hand-rolled version of the pattern above —
  every dialog/sheet in the app (`UpgradeDialog`, `ShareDialog`, `LyricsSheet`, `LoginModal`,
  `PublishDialog`, `CreditsDialog`, `Toast`, MV Create's sheets, Account/History's confirm
  dialogs) uses it. It returns `{ shouldRender, visible }`: gate the JSX return on
  `!shouldRender` (keeps the exit transition mounted long enough to finish), and apply
  `visible` as a `--visible` modifier class carrying a `0.3s` opacity (+ usually a
  `scale`/`translateY`) transition, with `backdrop-filter: blur(2px)` on the backdrop. It
  internally uses a **double** `requestAnimationFrame` before flipping to `visible` — a
  single rAF can still land in the same paint as the initial mount and skip the enter
  animation entirely, which is why this exists as a shared hook instead of being
  reimplemented ad hoc. For content whose prop goes `null` right as it starts closing (e.g.
  a "confirm delete this item" dialog's target item), pair it with the hook's own
  `useLastValue()` so the exit animation still has something to render instead of going
  blank immediately.

## Existing reusable components (src/components/)

| Component | Purpose |
|---|---|
| Button | Pill CTA button — sizes Large/Medium/Small, variants Primary/PrimaryPayg/Secondary/Tertiary/Ghost, optional icon + credits badge |
| Card | Video/song grid card — Video (3:4 or 4:3) or Song (1:1), community vs. own-content variants, play/pause, favorite, badge |
| Chip | Small selectable pill (Genre/Mood/Vocal pickers on Song Create) |
| AuthProvider | App-wide prototype auth context — session-scoped mock sign-in state, global LoginModal, and `requireSignIn()` gate for generate/recreate actions |
| Badge | Shared status/promotional badge — Purple/Gold/Done/Failed/Processing/Hot/New/Sale/Popular |
| CreditBalance | Self-contained header credit pill — owns its own `CreditsDialog` (Buy Credits popup) and opens it on click; used by marketing, room, and detail navbars |
| CreditsDialog | "Buy Credits" popup — 6 selectable credit packs + Buy Now CTA. Opened by `CreditBalance` and the Credits page's own "Buy More" button |
| DetailNavbar | Sticky detail-page header — back button, credits, optional slotted second row for tabs |
| Footer | Site footer — brand/tagline + Studio/Company link columns (mock links) |
| FloatingCTA | Fixed-bottom CTA shell with a layout spacer, optional parent-column alignment, and automatic footer avoidance |
| IconButton | Icon-only button — sizes Large/Medium/Small/XSmall, variants Primary/Secondary/Tertiary/Ghost |
| ListItem | List row for songs/videos — `variant="community"` (avatar/stats/actions, narrow-vs-wide layout driven by a CSS container query on its own rendered width, not viewport) or `variant="song"` (subtitle + chevron, used in My Creations). Avatar/username click routes through `communityProfileHref()` |
| LoginModal | Mobile bottom-sheet / desktop dialog sign-in mock — Apple/Google buttons, mocked "signed in" success stage, no real auth |
| LyricsSheet | Synced, line-highlighted lyrics popup (mobile bottom sheet / desktop dialog) — shared by Song Create's Result stage and Song Detail's Now Playing |
| MobileHeader | Sticky app-style mobile top bar — only rendered when `MOBILE_LAYOUT === 'app'` |
| MobileTabBar | Bottom tab bar (Explore/Create/History) — only rendered when `MOBILE_LAYOUT === 'app'`. The Create tab opens a "what would you like to create?" sheet (AI Music Video / AI Song) |
| Navbar | Top marketing navbar — language picker (mock), login trigger |
| PublishDialog | Shared "Ready to Go Public?" confirmation — used for every MV/Storyboard publish action (History, MV Result, Community Profile's MV tab). Song publish uses `Toast` instead, no confirmation step |
| RoomNavbar | Simpler navbar for "Feature Room" pages (e.g. Song Create) — title + credit balance only, optional slotted tabs row (see History) |
| SectionHeader | Section title row — optional "See all" link, separate mobile-abbreviated title text |
| ShareDialog | Share dialog + `shareOrOpenDialog()` helper (prefers native Web Share API when available, falls back to the dialog) |
| Sidebar | Left nav rail — collapses to icon-only below 1024px. Its bottom "Upgrade" button and the header's `UpgradeButton` each own an independent `UpgradeDialog` instance |
| Tabs | Pill tab-bar switcher — controlled via `active`/`onChange`. Default styling (34px height, pill radius, bold, `--white-60` inactive text) matches Figma "Bar/Tabs" — don't re-override this per page, it's already the shared default. App-mobile (`.app-layout--mobile-app`, below 767px) gets its own smaller variant (26px height, Caption/M Medium) baked into `Tabs.css`, no per-page override needed there either |
| ToggleSwitch | On/off switch (e.g. the Instrumental toggle on Song Create) |
| Toast | Shared simple pill status message (e.g. "Published success") — auto-dismisses, used wherever a popup confirmation isn't warranted |
| TopSongListItem | Song row specific to Song Detail's Top Songs list — larger type scale, own stats layout at ≥1920px |
| UpgradeButton | Header "Upgrade" pill — owns its own `UpgradeDialog` and opens it on click |
| UpgradeDialog | 3-plan (Weekly/Weekly Pro/Yearly) pricing popup — opened by `UpgradeButton` and Sidebar's own Upgrade button |

Before building something new, check this list — CLAUDE.md's rule against over-splitting
components means a new shared component should only be created for UI that's genuinely
repeated across screens, and an existing one should be extended (e.g. via a new `variant`
prop, as `ListItem` already does) rather than duplicated.

## CSS tokens and responsive conventions

All design tokens live in [src/styles/tokens.css](src/styles/tokens.css). **Do not modify
this file unless the user explicitly asks you to.** Categories defined there:

- Primitive brand colors (`--pf-*`, each with alpha variants) and alpha neutrals (`--white-*`, `--black-*`)
- Dark/light neutral scales (`--neutral-dark-*`, `--neutral-light-*`)
- Mobile and web typography scales (`--font-mobile-*`, `--font-web-desktop-*`, `--font-web-mobile-*`)
- A simplified semantic typography set actually used day-to-day (`--font-display`,
  `--font-title-xl/l/m/s/xs`, `--font-body-l/m/s/xs`, `--font-label-m/s`, `--font-caption-m/s`)
  plus matching `--line-height-*` and `.type-*` utility classes
- Theme-aware semantic aliases (`--color-text-primary/secondary/tertiary/disabled`,
  `--color-bg-primary/secondary/tertiary`, `--color-border-primary/secondary`,
  `--color-action-primary/danger/success/warning`)
- Gradients (`--gradient-mv/song/story/shadow`) and matching `.color-gradient-*` classes
- A **"YCM Local Variables" section**, added 2026-07-27 and explicitly commented in-file as
  *not present in the original Figma token export*: `--purple-500`, `--color-accent-purple`,
  spacing scale `--spacing-4` through `--spacing-48`, radius scale `--radius-sm` through
  `--radius-pill`/`-full`, `--blur-glass`, `--opacity-disabled`, `--overlay-hover-dark`.
  These exist because the product's actual gradient/purple/spacing/radius values kept
  showing up in Figma frames with no matching token — prefer these over a new hardcoded
  value, but don't assume every needed value already has a token; check the file first.

Responsive tiers (per CLAUDE.md): **1920 (XL) · 1440 (L, primary design baseline) · 1024
(M) · 768 (S) · 375 (XS) · 320 (minimum supported)**. `src/styles/breakpoints.css` is an
empty reference scaffold listing these six breakpoints — it is not imported anywhere.
Every component instead writes its own `@media` rules inline in its own `.css` file. Follow
that existing pattern rather than introducing a shared breakpoints stylesheet or a
JS-based breakpoint system, unless asked to change the approach.

Rules that must hold at every tier (not just at 1440, the design baseline):
- No horizontal scrollbars
- Text wraps naturally, never truncated by a fixed layout
- Images/video support landscape, portrait, and square source material without stretching
- Layout re-flows (column count, nav treatment, component widths) — never just a scaled-down
  copy of the desktop layout
- Primary large generate CTAs on long creation forms use `FloatingCTA`: align to the form
  column rather than the whole viewport, reserve the full overlay height with its spacer,
  and move above the Footer instead of covering content.

## Rules for modifying this project

These carry over directly from CLAUDE.md — they are not optional:

1. **Figma is the only source of visual truth.** This is a fidelity/reproduction job, not a
   redesign job. Don't beautify, simplify, "improve," or generalize a design because it
   looks more standard that way. Don't add elements that aren't in the Figma frame. Don't
   change spacing because a different value "looks more correct."
2. **Do not guess.** If a screen, state, or breakpoint isn't covered by a supplied Figma
   frame, list what's unconfirmed and ask — don't invent it and present it as done.
3. **Do not over-engineer.** No new abstractions, no premature component splitting, no
   speculative configuration, no state-management library, no backend/API wiring — ever,
   regardless of how the request is phrased. If a bug fix or small feature doesn't need a
   refactor, don't do one alongside it.
4. **Do not refactor unrelated code.** A change to one screen or component should not
   ripple into unrelated files "while we're in there." Keep diffs scoped to the request.
5. **Preserve existing UI and responsive behavior.** Don't change a working page's layout,
   spacing, or breakpoint behavior as a side effect of an unrelated change. If a shared
   component or token is touched, check the other screens that use it at all six widths
   before considering the change done.
6. **Do not declare a page "done" before the user confirms it.** The expected per-page loop
   is: read the full + partial Figma references → analyze layout/sizing/spacing/type/
   alignment/media ratios → list anything unconfirmed → wait for the user → build the main
   layout first → a second pass corrects sizing/spacing/typography/color/border/radius/image
   handling → compare the result against Figma and list remaining discrepancies → only then
   is it "done," and only the user says so.
7. **Do not create a git commit before the user explicitly confirms it**, and do not push
   unless explicitly asked to push. (In practice this session's history shows large batches
   of work going uncommitted for a while, then committed and pushed together once the user
   said so explicitly — that pattern is fine; committing preemptively is not.)
8. **No new npm packages without explicit prior approval.**
9. **The user is a designer** — fluent in HTML/CSS, a beginner with React/TypeScript/npm/
   Git. After any change, explain in plain terms: which files changed, what each file is
   for, and which on-screen area the changed React code corresponds to.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start the Vite dev server (localhost, default port 5173)
npm run build     # type-check (tsc -b) then production build — this is the real "does it compile" check
npm run preview   # preview the production build locally
npm run lint      # run oxlint
```

There is no test suite in this repository (no test runner configured, no `*.test.*` /
`*.spec.*` files). Verification is: `npm run build` must succeed with no TypeScript errors,
then manually check the affected page(s) in a browser at each of the six responsive widths
listed above, and check the browser console for errors before considering a change verified.
