# PROJECT_CONTEXT.md — YCM UI Prototype

Working notes on *why* the project looks the way it does, not just what's in the repo.
For stack/structure/conventions, see [AGENTS.md](AGENTS.md). For process rules, see
[CLAUDE.md](CLAUDE.md).

## Product background and purpose

YCM (shown in-app as "MUSE" / "YouCam Muse") is a planned AI product for generating music
videos and songs. This repository is **a UI prototype, not the production frontend**. Its
two audiences are:
1. The product owner, reviewing screens and flows directly in a browser (desktop app
   deployed to Vercel for this purpose — see Deployment below).
2. RD engineers, who may copy individual components/CSS out of this repo into the real
   frontend later.

Nothing here talks to a backend. Every song, video, cover, and stat on screen is either a
static mock value or a real local media asset (audio/video/image files committed to
`src/assets/`) wired up to look like generated content.

## Deployment

The repo is pushed to `git@github.com:marukox1105/YCM.git` (`main` branch) and deployed to
Vercel for the product owner to review without needing a local dev environment.
`vercel.json` does a catch-all SPA rewrite to `/index.html` since routing is manual
pathname-matching with no server-side route awareness (see AGENTS.md).

## Current checkpoint — 2026-08-04 (session 2)

Latest committed checkpoint before this working tree:
`647e94d` — "Add Upgrade/Credits monetization, shared popup transitions, and Home
hero/tool-selector refinements".

### Work completed since that checkpoint

- **MV Create mock face detection:** the character-photo add action now opens a Figma-based
  Select a Face flow instead of the browser file picker. It uses the supplied
  `src/assets/faces/demo-detection/group.jpg`, shows a deterministic 1.4-second scan, then
  reveals four selectable face boxes/crops. Mobile uses a bottom sheet with a top-right
  check action; desktop adapts the same hierarchy into a centered dialog with a
  `Use This Face` pill CTA. Selection stroke is 2px on mobile and 4px on desktop, with the
  specified purple spread shadow. This remains an intentional prototype simulation, not
  real computer-vision detection.
- **History Storyboard emphasis:** ready Storyboard covers now add a black 15% overlay plus
  a 40% bottom gradient so the centered `Create MV` action reads clearly without changing
  the underlying artwork.
- **Shared Done badge:** the Done status now uses a `--pf-green-40` background with white
  icon/text, affecting History and the Components reference page through the shared Badge
  component.
- **Home mobile Hero:** the existing 272×153 mobile carousel now centers responsively at
  320px/375px and wider phone widths, including safe inset at its first and last positions.
  Home mobile horizontal padding is 16px, the Hero-to-tool-card gap is 10px, and the small
  `Create MV` CTA matches the mobile Figma sizing. Tablet/desktop behavior is unchanged.
- **Footer sitemap:** added a Support column (`Pricing`, `Blogs`, `FAQ`) between Studio and
  Company. Blogs routes to the existing `/blog` page; Pricing and FAQ remain mock links in
  keeping with the UI-prototype scope.

### Pages and components changed

- Pages: Home, MV Create, History.
- Shared components: Badge, Footer.
- New committed asset: `src/assets/faces/demo-detection/group.jpg`.

### Important implementation decisions

- Face detection is deliberately deterministic mock UI. Face boxes and thumbnail crops use
  percentage coordinates against one controlled demo image so the review flow is stable;
  no image upload service, ML library, API, or new dependency was introduced.
- The mobile Hero keeps one fixed 272px card and computes its track inset from available
  width (`(100% - 272px) / 2`) rather than scaling the card, preserving the Figma ratio while
  centering correctly across supported phone widths.
- The History Storyboard darkening is a non-interactive cover pseudo-element, keeping the
  content/card behavior unchanged and avoiding duplicated artwork or DOM wrappers.

### Known issues and unfinished items

- Face detection is a visual simulation tied to `group.jpg`; arbitrary user uploads and
  actual face-coordinate extraction are outside the current prototype and are not built.
- The four face crop/background positions are visually tuned percentages and should receive
  one final browser comparison at 320, 375, 768, and 1440 if the Figma face-selection flow
  changes again.
- Footer Pricing and FAQ are still placeholder links because no destination pages have been
  specified.
- `/home-review-b` remains a temporary A/B review route pending selection and cleanup.
- The broader visual-validation backlog from the previous checkpoint remains: Trim Audio
  precision/moving playhead and complete breakpoint passes for newer Song/MV/Account/
  History flows.

### Recommended next steps

1. Decide whether mock face detection remains deterministic or should accept arbitrary
   uploads; only pursue real detection after the production integration requirements are
   known.
2. Complete a six-breakpoint visual pass for MV Create's face dialog and the Home mobile
   Hero, with special attention to 320px and 375px.
3. Resolve and delete the temporary `/home-review-b` A/B route after the tool-selector
   direction is selected.
4. Finish the existing Trim Audio interaction backlog and the remaining latest-Figma
   comparisons listed in the previous checkpoint.

### Progress log — 2026-08-04 (session 2)

- Added the deterministic multi-face selection demo to MV Create using the supplied group
  photo and responsive mobile/desktop dialog treatments.
- Refined History Storyboard contrast, shared Done badge styling, and Home's mobile Hero
  spacing/centering.
- Expanded the Footer sitemap with Support links.
- Production build and TypeScript validation are recorded in the checkpoint commit handoff.

## Previous checkpoint — 2026-08-04

Latest committed checkpoint before this working tree:
`008d680` — "Fix sign-in logo shape, tool-tile click area, and Feature Room CTA/side-panel
states". This is a multi-session block of work on top of that commit — see "Previous
checkpoint — 2026-08-03 (session 2)" below for the work that landed *in* `008d680`.

### Work completed since that checkpoint

**Monetization surface (new)**
- Added `UpgradeButton`/`UpgradeDialog` (Figma "Sub btn" 1459:10293 + "Popup iAP - Pricing"
  1797:33233) — a header pill next to the credit balance (signed-in only, in `Navbar`,
  `RoomNavbar`, `DetailNavbar`) that opens a 3-plan pricing dialog (Weekly / Weekly Pro /
  Yearly). The Sidebar's own separate bottom "Upgrade" button opens the same dialog via its
  own independent `useState` (the two buttons have different Figma-mandated visual styles
  and are never mounted with a shared parent, so lifting state isn't natural here).
- Added `CreditsDialog` (Figma "IAP — Buy Credits - List_L" 1783:42703) — a "Buy Credits"
  popup with 6 selectable packs (8000→300 credits, with 20%-off/"Best Value"/"Popular" tags)
  and a "Buy Now" gradient CTA. Wired to **both** the header `CreditBalance` chip (now a
  self-contained trigger + dialog, matching `UpgradeButton`'s pattern) and the Credits page's
  own "Buy More" button.
- `UpgradeDialog`'s Weekly Pro card: stroke is now a gradient (`Color/Gradient/MV`, via the
  double-background trick since `border-color` can't take a gradient directly) instead of a
  flat orange, and the "PRO" badge sits inline right after "Weekly" (was drifting to the far
  right because `flex: 1` had been applied to the plan-name text itself instead of a
  name+badge wrapper group).

**Shared popup transition system (new)**
- Added `src/hooks/useMountTransition.ts` — `useMountTransition(isOpen, duration=300)`
  returns `{ shouldRender, visible }`: keeps a dialog mounted through its CSS exit
  transition instead of unmounting the instant `isOpen` goes false, and defers the
  entering `--visible` class by a **double** `requestAnimationFrame` (a single rAF still
  fires before the next paint, so the closed state and the visible state could land in the
  same frame and skip the enter animation entirely — this was caught and fixed mid-session).
  Also exports `useLastValue()`, for dialogs whose content prop goes `null` right as closing
  starts (e.g. `trimSong`), so the exit animation still has something to render.
- Applied to **every** popup in the app: `UpgradeDialog`, `ShareDialog`, `LyricsSheet`,
  `LoginModal`, Account's Edit Profile/Sign Out/Delete dialogs, History's publish/delete
  confirmations, all 5 of MV Create's sheets (Settings/Song Picker/Template/Trim
  Audio/Mode), and the two new dialogs below. Every popup backdrop now also has
  `backdrop-filter: blur(2px)` (some, like `ShareDialog`/`UpgradeDialog`, had none before).
- Added shared `PublishDialog` ("Ready to Go Public?" confirm — MV-only) and `Toast`
  (simple pill status message, Figma node 464:13600 — Song publish, no confirmation step)
  components, both using the new transition hook. `HistoryPage` was refactored to use them
  instead of its own inline dialog/toast markup; `MVResultPage`, `SongCreatePage`, and
  `CommunityProfilePage`'s per-item Publish toggle were newly wired to them (MV → dialog,
  Song → toast, branching on `item.type` in Community Profile's case since it lists both).

**Home hero / tool selector**
- `HeroBannerSection`: removed the "✦ Trending MV" badge; the per-video title/subtitle
  moved up into that slot (smaller, 20px/24px per Figma). Below it, a new self-contained
  `HeroHeadline` sub-component cycles between two fixed marketing headlines ("Transform
  song into **Cinematic Video**" / "Turn your selfie into **Music Video**", gradient accent
  text) every 5s, sliding up like an odometer — reuses the same clone-then-silent-reset
  infinite-loop technique as the mobile hero carousel below it in the same file. Rendered as
  **two lines** (plain lead-in, then the accent phrase always on its own line) after the
  first version's single-line layout clipped the accent phrase mid-word. Animation timing
  (duration, cubic-bezier) is tuned to the exact values the user specified — see
  `HEADLINE_ANIM_MS` / the inline `cubic-bezier(0.3, 0, 0.1, 1)` in `HeroBannerSection.tsx`.
- `ToolSelectorSection` cards: icon badge 56px→60px; the ambient background glow is now
  always visible (was hover-only) with per-card color (purple for MV, red for Song); a
  separate hover-only `.tool-selector__glow` overlay fades in a bigger/brighter version of
  the same glow (own element, not an animated gradient-size change, since CSS can't
  interpolate between two differently-sized gradients); hover border is a "shimmer"
  gradient ring added via a masked `::after` (opacity-faded, not a `border-color`
  transition, for the same gradient-interpolation reason). Title/description colors are now
  the same in default and hover state (`Neutral/Dark/100` / `Neutral/Dark/89`) — the
  previous dim-then-brighten-on-hover swap was removed since both values are now identical.
- **New A/B review page**: `/home-review-b` (`HomePageReviewB.tsx` +
  `ToolSelectorSectionAlt.tsx`/`.css`) — an alternate tool-selector treatment for the product
  owner to compare against the real `ToolSelectorSection`, per CLAUDE.md's "A/B proposals
  get a temporary review page" convention. Differences from the real section: sits **above**
  the Hero Banner instead of below it; bigger cards (Figma nodes 1835:33139 default /
  1835:33929 hover) with a "Create" **text** pill CTA on hover instead of the original's
  arrow icon button; lighter card fill (`rgba(9,9,11,0.4)`, corrected mid-review from an
  initial `0.6` after the product owner flagged it as too heavy) that's identical between
  default and hover (hover only adds the glow on top, doesn't change the base fill); tighter
  10px gap above the cards and 20px gap to the Hero below (both overridden locally via
  padding/negative-margin so the shared `.home-page` flex-gap used by the real `HomePage`
  isn't touched). **Not yet folded into the real `HomePage`** — this is still two pages
  side by side pending the product owner's pick; see Recommended next steps.

**Navigation / consistency fixes**
- `DetailNavbar`/`RoomNavbar` right-alignment: `.detail-navbar__actions` /
  `.room-navbar__actions` gained `margin-left: auto` — the credit balance + Upgrade button
  pair had no `justify-content: space-between` or growing sibling to push them to the far
  right, so they were sitting flush against the title/back button instead. Fixes every page
  built on `RoomNavbar` (History, Song Create, MV Create, Blog, Account) and `DetailNavbar`
  in one place each.
- `RoomNavbar` gained a `@media (max-width: 767px)` block (padding 60px→16px) — it had no
  responsive breakpoints at all before, harmless while nothing used its `tabsSlot` prop, but
  now exposed by History's tabs moving into it (below).
- **History's tabs bar moved into `RoomNavbar`'s `tabsSlot`** (was rendered directly in the
  page body) so it's sticky under the header on scroll, matching `SongDetailPage`'s already-
  sticky `DetailNavbar` `tabsSlot` convention instead of scrolling away with the content.
- **`Tabs` component's default height corrected to 34px** (was 28px: `padding: 5px 10px` +
  14px-radius instead of Figma's `padding: 8px 16px` + pill radius + bold weight, node
  1357:30289). Three pages (`CommunityProfilePage`, `CreditsPage`, `HistoryPage`) had each
  independently re-implemented this exact same "correct" override locally — those redundant
  per-page overrides were removed now that the shared default matches.
- **`CommunityProfilePage` back-navigation is now referrer-based**, not hardcoded to
  `/account`: `computeBackHref()` reads `document.referrer` (same-origin check) and falls
  back to `/account` only when there's no usable referrer. Fixes "back" incorrectly
  returning to your own profile after viewing someone else's from a content page.
  `CommunityProfilePage` also gates the **own**-profile view behind sign-in (same
  `useEffect`-`openSignIn()` + early-return pattern as Account/History) while leaving other
  users' profiles publicly viewable, and its item links now carry
  `from=community-profile` so `MVDetailPage`/`SongDetailPage`'s own back button can return
  here (`source` union type extended with `'community-profile'` in both).
- **Community identity convention**: `src/data/songs.ts`'s `Song` type gained a `username`
  field (assigned once from a fixed `USERNAMES` pool, same convention as
  `musicVideos.ts`'s own `USERNAMES`) since `SongDetailPage`'s "See All Songs" list is
  community content and must never show the signed-in user's own name ("ScottWu") — it had
  been hardcoded to `"ScottWu"` in three places (the list rows, the desktop Now Playing
  panel, and the mobile player), all now using the actual song's `username` and routing its
  avatar click through the shared `communityProfileHref()`. `Card` and `ListItem` gained the
  same "click avatar → that user's Community Profile" wiring (was previously non-interactive
  in both).
- Fixed two **Like icon color bugs** on `SongDetailPage`: the Top Songs list's Like icon
  wasn't visually synced to Share's dimmed color before being liked (`.top-song__share` had
  `opacity: 0.4`, `.top-song__like` didn't); the desktop Now Playing panel's and mobile
  player's Like buttons never actually turned purple when active — the CSS rule
  (`--active` modifier) existed but the JSX never applied the modifier class.

**Misc fixes**
- `MVEditPage`'s Cover Image "Recreate" button is enabled whenever the prompt is non-empty,
  regardless of whether the text changed (was gated on `coverPrompt !== generatedCoverPrompt`
  — reverted per explicit product direction: regenerating from unchanged text can still
  produce a different cover). The per-scene Recreate button's own gating is unchanged.
- `MVCreatePage`'s Mode Choice sheet ("Create Storyboard First" / "Create MV Directly"):
  featured card's stroke is now the `Color/Gradient/MV` gradient (same double-background
  technique as `UpgradeDialog`'s Weekly Pro card) instead of a flat pink; the credits tag
  moved to the bottom-right of its row via `justify-content: space-between` instead of
  sitting inline next to the duration tag.
- `CreditsDialog`'s per-pack tags (20% OFF / Best Value / Popular) are now absolutely
  positioned instead of a normal-flow row with a negative margin — the previous approach
  made a pack's rendered height (and so its visual gap to its neighbor) depend on whether it
  had any tags at all. Its small per-pack credit icon is `White 40%`, not orange (was
  `--color-action-warning`, too visually loud next to the plain price text next to it).
- **Mobile-specific work** (from the task list, predates this file's detailed session log
  but landed in this same uncommitted block): extracted `LyricsSheet` as a shared component
  out of `SongCreatePage` (also now used by `SongDetailPage`, both via a new `isOpen` prop
  instead of `{condition && <LyricsSheet/>}` conditional mounting, so its own exit
  transition — see above — actually has time to play); a mobile-only full-screen Song
  Player view for `SongDetailPage` with push/pop history-state wiring so the phone back
  gesture returns to the list instead of leaving the page; a rebuilt `MVEditPage` mobile
  layout (Figma node 49:53) including a mobile-only full-screen Scene Detail view; and a
  mobile "what would you like to create?" sheet on `MobileTabBar`'s "+" tab (Figma node
  172:1878, AI Music Video / AI Song options).
- `AppLayout` gained `showFooter`/`showMobileTabBar` props (both default `false`, were
  previously unconditional) — Footer and the app-mobile bottom tab bar now only render on
  the pages that explicitly opt in (`HomePage`, `HistoryPage`), not every page.
- `vite.config.ts`: disabled CSS minification (`cssMinify: false`). Vite's default minifier
  (Lightning CSS) collapses a rule declaring both `backdrop-filter` and
  `-webkit-backdrop-filter` down to only the `-webkit-` one in production builds, silently
  breaking the blur on browsers that don't honor the legacy alias (e.g. Firefox) — invisible
  in dev (unminified) but only shows up post-deploy. The size cost is negligible next to
  this project's multi-MB media assets.
- `src/assets/backgrounds/History_Option_Menu_Spec.zip` (flagged as an open question in the
  previous checkpoint) has been deleted from the working tree — resolved by removal rather
  than kept as a reference artifact.

### Pages and components changed

- Pages: Home (+ new `/home-review-b` review page), History, Credits, Community Profile,
  Song Detail, Song Create, MV Create, MV Detail, MV Result, MV Edit, MV Storyboard,
  Account, Blog (minor).
- New shared components: `UpgradeButton`, `UpgradeDialog`, `CreditsDialog`, `PublishDialog`,
  `Toast`, `LyricsSheet` (promoted from a `SongCreatePage`-local component).
- New shared hook: `useMountTransition` (+ `useLastValue`) in `src/hooks/`.
- New data file: `src/data/profile.ts` (`CURRENT_USERNAME`, `isOwnUsername()`,
  `communityProfileHref()` — the "which profile does this username link to" convention used
  everywhere an avatar is clickable).
- Existing shared components changed: `CreditBalance` (now self-contained trigger +
  dialog), `DetailNavbar`, `RoomNavbar`, `Tabs`, `Card`, `ListItem`, `TopSongListItem`,
  `Sidebar`, `Navbar`, `MobileTabBar`, `AppLayout`, `LoginModal`, `ShareDialog`.

### Important implementation decisions

- **A single `requestAnimationFrame` is not enough to guarantee an enter transition plays.**
  It can still fire before the browser's next paint, letting the closed state and the
  `--visible` state land in the same frame (no visible animation). `useMountTransition` uses
  a **double** rAF (schedule the class change from inside the callback of another rAF) —
  keep this pattern for any future mount-transition code; verified in-browser by sampling
  `getComputedStyle(...).opacity` across consecutive animation frames right after triggering
  open, which showed a clean 0 → 1 ramp only after the double-rAF fix (a single rAF measured
  as an instant jump to `1`).
- **Gradients can't be transitioned/interpolated by size or between different stop
  configurations** — every place that needs a gradient to change on hover (bigger/brighter
  glow, shimmer border ring, gradient card strokes) uses a **separate layered element**
  (an extra `::before`/`::after`, or the double-background border trick) whose *opacity*
  fades in/out, rather than trying to animate the gradient itself. This is now the
  established pattern across `ToolSelectorSection`, `UpgradeDialog`, `MVCreatePage`'s mode
  cards, and `ToolSelectorSectionAlt`.
- **MV publish confirms first; Song publish doesn't.** Any future "Publish" toggle should
  branch on content type the same way `CommunityProfilePage`'s per-item toggle does: MV/
  Storyboard → `PublishDialog`, Song → `Toast` only. This mirrors `HistoryPage`'s
  already-established behavior, now extracted into shared components instead of
  reimplemented per page.
- **Referrer-based back-href, not a hardcoded destination, for pages reachable from more
  than one place.** `CommunityProfilePage.computeBackHref()` is the first instance of this;
  reach for the same `document.referrer` (same-origin check, sensible fallback) pattern
  before hardcoding a `backHref` on any page that similarly has more than one real entry
  point, rather than adding another single fixed destination.
- **A/B proposals get their own page + component, never a flag inside the real
  component.** `ToolSelectorSectionAlt`/`HomePageReviewB` are fully separate files reusing
  the same underlying sections (`HeroBannerSection`, `NewMVsSection`, etc.) — nothing in the
  real `ToolSelectorSection`/`HomePage` was touched to build the alternate. Once the product
  owner picks a version, fold the winner back into the real files and delete the loser
  (both the alt component and the review page) rather than leaving two permanently.
- **Self-contained trigger+dialog is the pattern for any button that just opens one
  specific popup with no other cross-component state to share** — `UpgradeButton`,
  `CreditBalance`, and Sidebar's own bottom Upgrade button each own their `useState` and
  render their own dialog instance, rather than lifting dialog-open state to a shared
  parent. Reach for this instead of threading an `isOpen`/`onOpen` prop through a page
  when nothing else needs to know the dialog is open.

### Known issues and unfinished items

- **`/home-review-b` is a temporary A/B page, not a finished feature.** It must not survive
  long-term — once the product owner picks between the two tool-selector treatments, fold
  the winner into the real `HomePage`/`ToolSelectorSection` and delete whichever of
  `ToolSelectorSection`/`ToolSelectorSectionAlt` (+ `HomePageReviewB`, + the `/home-review-b`
  route in `App.tsx`) lost.
- **This session leaned heavily on DOM/computed-style JS assertions over visual screenshots**
  for verification, since the Browser pane's screenshot tool in this environment renders at
  a small/scaled crop that's hard to eyeball precisely (a recurring, already-known
  limitation from earlier checkpoints too) — most fixes were confirmed via
  `getBoundingClientRect()`/`getComputedStyle()` assertions plus low-resolution screenshots
  for gross layout sanity, not a full pixel-level visual pass at all six widths.
- **Mobile/tablet sizing for the new `HeroHeadline` rotating headline is a reasonable
  default, not a confirmed design** — only the ≥1024px Figma frame existed for this
  element; the smaller-breakpoint font sizes were scaled down proportionally and flagged as
  such in `HeroBannerSection.css`'s own comments, but haven't been checked against a mobile
  Figma frame (none was supplied).
- **The "add 2-3 more templates" request for MV Create's Select-a-Template carousel is still
  outstanding** — no additional suitable video assets exist in the project yet (checked:
  only the 8 already-used hero videos are available); this needs either new video files
  from the user or an explicit decision to reuse an existing clip under a second name.
- Everything already logged as unfinished in the 2026-08-03 checkpoint below (six-width
  visual passes on Account/Credits/Community Profile/History, the Trim Audio Figma-precision
  pass, `SongResult` Figma re-verify) remains open and untouched by this session.

### Recommended next steps

1. Get the product owner's pick between `/home` and `/home-review-b`'s tool-selector
   treatment, then fold the winner into the real `HomePage`/`ToolSelectorSection` and
   delete the loser (component file(s), the review page, and its `App.tsx` route).
2. Do a proper six-width visual pass (not just DOM assertions) over everything touched this
   session, particularly the new `HeroHeadline` at mobile/tablet widths (no Figma frame was
   supplied below 1024px) and the popup transition/blur sweep across all ~12 dialogs.
3. Resolve the outstanding "add more templates" request — ask the user for new video assets
   or an explicit go-ahead to reuse an existing one.
4. Continue carrying forward the previous checkpoint's outstanding items (see "Recommended
   next steps" under "Previous checkpoint — 2026-08-03 (session 2)" below).

## Previous checkpoint — 2026-08-03 (session 2)

Latest committed checkpoint before this working tree:
`6c0f3be` — "Add account flows, shared badges, and source-aware history navigation".
This is a same-day follow-up session on top of that commit — see "Previous checkpoint —
2026-08-03" below for the work that landed *in* `6c0f3be`.

### Work completed since that checkpoint

- **Sign-in dialog logo** (`LoginModal`): changed from a perfect circle (`border-radius:
  28px` on a 56px box — exactly half, i.e. a full circle) to a rounded-square/squircle
  shape (`var(--radius-lg)`, 16px), matching how Figma node 1724:43347 actually renders.
  Figma's auto-extracted code for this shape still says `rounded-[28px]` even though the
  node visually renders as a squircle — Figma's corner-smoothing isn't representable as a
  plain CSS `border-radius`, so the value had to be picked by eye against the reference
  screenshot rather than copied literally from the exported code.
- **Home's two Tool Selector tiles** ("Music Video Creator" / "AI Song Composer"): the
  entire tile is now the clickable link (`<a href="/mv-create">` / `<a href="/song-create">`
  wrapping the whole card), not just the small arrow icon button that only appeared on
  hover. The arrow badge is now decorative markup reusing `IconButton`'s own CSS classes
  directly (a `<button>` can't legally nest inside an `<a>`), so its exact look/hover-reveal
  animation is unchanged.
- **MV Create's "My Creations" side panel**: signed-out visitors now see a **"Trending
  MVs"** heading + a **"See all"** link to `/mv-detail?from=mv-create` (Figma node
  1341:2170), with each row showing its own mock creator username (from
  `MUSIC_VIDEOS[].username`, e.g. "StarryNights", "ChasingWaves") instead of the hardcoded
  `"ScottWu"` used for the signed-in "My Creations" case. Signed-in behavior is unchanged.
- **Song Create's equivalent side panel**: same treatment — signed-out shows **"Trending
  Songs"** + **"See all"** to `/song-detail?from=song-create`. Song data has no per-song
  username/stat fields to swap in (unlike `MUSIC_VIDEOS`), so the row content itself is
  unchanged either way — only the heading text and the conditional see-all link differ by
  sign-in state.
- **MV Create's uploaded character-photo slot**: restored a `1px solid` border (matching
  Figma node 1344:25777, `rgba(255,255,255,0.15)`) that was being lost entirely once a
  photo was uploaded. The empty "add" state already had a dashed border as an affordance;
  the filled state had none at all, so the slot visually lost its outline on upload.
- **Song Create's Simple-mode "Create Song" button** no longer uses the fixed/floating
  `FloatingCTA` wrapper. Figma (node 1762:41594) shows it as a plain inline button directly
  under the prompt box for Simple mode, not pinned to the viewport bottom — the floating
  version was leaving a large empty gap below the short Simple-mode form. Custom mode's CTA
  is untouched (still wrapped in `FloatingCTA`, appropriate for its longer form).

### Pages and components changed

- Pages: MV Create, Song Create.
- Shared components: `LoginModal`, `ToolSelectorSection` (Home).

### Important implementation decisions

- **Figma's exported code for a squircle shape can't be trusted for its `border-radius`
  value.** A shape that visually reads as a rounded square in the Figma screenshot can
  still export as `rounded-[N]` where `N` is exactly half the box's width (i.e., a
  mathematically perfect circle) — Figma's corner-smoothing/squircle rendering has no CSS
  equivalent. When a design-to-code fetch's code and screenshot visually disagree like
  this, trust the screenshot and pick a `border-radius` by eye (checked against the
  existing token scale) instead of the extracted value.
- **"Trending X / See all" is now an established pattern for signed-out Feature Room side
  panels** (MV Create, Song Create). Both key off `useAuth().isSignedIn` to swap the
  heading and conditionally render a `<a>` "See all" link, reusing the exact CSS shape
  already used by `SectionHeader`'s see-all link (purple `Title/S` text + 24px chevron)
  but as page-scoped classes rather than importing `SectionHeader` itself, since this
  panel's title uses a different type scale (20px Inter) than `SectionHeader`'s (24px
  Roboto, for Home's marketing sections). Extend this same pattern if another Feature Room
  page gains a similar side panel.
- **`FloatingCTA` is not a blanket rule for every generate button** — AGENTS.md's existing
  wording ("long creation forms") already implicitly scopes it to forms long enough that
  the button could scroll out of view. Song Create's Simple mode is a short form (one
  toggle + one textarea) and Figma places its CTA inline, not floating; Custom mode (more
  fields) keeps `FloatingCTA`. No AGENTS.md change was needed — this is a data point
  confirming the existing rule's own scoping, not a new rule.

### Known issues and unfinished items

- These 6 fixes were spot-checked only at 1440px this session, via a mix of screenshots
  and direct DOM/computed-style JS assertions (the Browser pane's screenshot tool
  intermittently rendered at a visibly wrong scale/crop for part of the session, same
  known issue noted in the 2026-07-30 checkpoint). No explicit 375px/768px check was done
  for these specific changes yet.
- Everything already logged as unfinished in the checkpoint below (Sidebar Upgrade/Credits
  Buy More pages, Community Profile's missing `from=community-profile`, the Trim Audio
  Figma-precision pass, six-width visual passes on Account/Credits/Community
  Profile/History, `SongResult` Figma re-verify) remains open and untouched by this
  session.

### Recommended next steps

1. Do a quick 375px/768px check on the 6 fixes above (only 1440px was checked this
   session).
2. Continue carrying forward the previous checkpoint's outstanding items (see the
   Recommended next steps list under "Previous checkpoint — 2026-08-03" below).

## Previous checkpoint — 2026-08-03

Latest committed checkpoint before this working tree:
`cb1ada0` — "Add History and Blog flows, shared auth, and creation UI refinements".

### Work completed since that checkpoint

- Added the signed-in account surface: a fixed-bottom Sidebar profile and Upgrade
  treatment, Account overview, Edit Profile dialog, Settings, Sign Out confirmation,
  Delete Account confirmation, Credits history, and a tabbed Community Profile for music
  videos and songs. `AuthProvider` now exposes prototype-only `signOut()` behavior.
- Added the reusable `Badge` component for Purple, Gold, Done, Failed, Processing, Hot,
  New, Sale, and Popular states; documented it on ComponentsPage and switched History's
  status badges to the shared component. Failed-state artwork now uses White/40.
- Corrected shared Large Primary/PrimaryPayg disabled styling: the solid disabled
  background stays fully opaque while only the label, icon, and credit content are dimmed.
  ComponentsPage reflects the same shared rule.
- Updated LoginModal to the latest centered Figma dialog treatment with pill social
  buttons and responsive sizing while retaining the mocked success stage.
- Expanded History behavior: generating cards hide More; Storyboards open directly in
  edit mode; Songs open the AI Song result surface; Liked Songs open See All Songs;
  Storyboard/Song/MV More menus now use type-specific actions, publish review/unpublish,
  confirmations, deletion, and a mobile bottom-sheet treatment.
- Implemented source-aware navigation. Home, MV Create, Song Create, and History add a
  stable `from` query value; MV/Song Detail and the MV Storyboard/Result/Edit chain derive
  their Back destination from it and preserve it through in-flow navigation.
- Song Result can initialize from History with `stage=result&id=...`, and its My Creations
  row reflects the active song's play/pause state. MV Create's prompt no longer includes
  the Idea shortcut.

### Pages and components changed

- Pages: Account/Settings, Credits, Community Profile, History, Components, Home entry
  sections, Song Create/Result, Song Detail, MV Create, MV Detail, MV Storyboard, MV Result,
  MV Edit, plus manual routes in `src/App.tsx`.
- Shared components: AuthProvider, Button, ListItem, LoginModal, Sidebar, plus the new
  reusable Badge component.
- New local assets in this working tree: `ic_user.svg` and the supplied untracked History
  option-menu ZIP under `src/assets/backgrounds/`.

### Important implementation decisions

- Account, sign-out, profile edits, credits, publish state, and deletion remain local mock
  interactions. No backend, OAuth, payment, or persistence layer was introduced.
- Back navigation uses explicit `from=home|mv-create|song-create|history` query parameters
  instead of `history.back()`, with `/home` as the safe fallback after a direct deep link.
- `Badge` is the single shared status-badge source. Extend it rather than adding another
  History-only badge implementation.
- History actions depend on content type: Storyboard and Song use Primary Create MV;
  unpublished MV uses Secondary Edit MV; published MV hides Edit until unpublished; and
  generating cards intentionally expose no More menu.
- History-origin Song results reuse `/song-create` with `stage=result`, `id`, and
  `from=history` so the full AI Song player can return reliably to History.

### Known issues and unfinished items

- Sidebar Upgrade and Credits Buy More are visual controls only. The requested upgrade
  and credit-purchase pages/routes are not yet implemented or wired.
- Community Profile uses local mock interactions and does not yet carry a dedicated
  `from=community-profile` source into detail pages.
- `src/assets/backgrounds/History_Option_Menu_Spec.zip` is untracked. Decide explicitly
  whether it is a repository reference artifact or should remain local before staging.
- Account/Credits/Community Profile and the expanded History menus still need a complete
  six-width visual pass. This checkpoint performs compile/build validation only.
- Trim Audio still needs the inspected Figma node `90:1600` geometry/playhead precision
  pass. No automated test suite exists.
- `src/assets/covers/Ｘ/` is outside this checkpoint and was not inspected. Do not inspect,
  stage, delete, move, rename, restore, or duplicate it without a new explicit instruction.

### Recommended next steps

1. Build and wire the approved Upgrade and Buy More desktop/mobile pages and connect all
   three entry points: Sidebar Upgrade, Credits Buy More, and the header credit balance.
2. Run a six-width visual/interaction pass over Account, Credits, Community Profile, and
   every History content-type menu and publish state.
3. Apply the inspected Figma node `90:1600` trimmer geometry/playhead pass.
4. Decide whether `History_Option_Menu_Spec.zip` belongs in Git; keep
   `src/assets/covers/Ｘ/` excluded regardless.

## Previous checkpoint — 2026-07-31

Latest committed checkpoint before this working tree:
`896048f` — "Add AI Music Video flow (Create/Storyboard/Result/Edit), rebuild ListItem,
add shared Enhance hook" (2026-07-30).

### Work completed since that checkpoint

- Refined Home interactions: Tool Selector default/hover typography and circular action;
  New Music Videos and Top Picks horizontal navigation, reverse arrows, hidden scrollbars,
  and additional mock items; Hero thumbnail auto-scroll now uses local `scrollTo()`
  calculations so it never moves the whole document, and first/last items retain their
  edge padding.
- Standardized Large buttons globally to bold typography and 16px horizontal padding;
  desktop Primary/PrimaryPayg buttons have a 230px minimum width.
- Added `FloatingCTA` and applied it to Song Create, MV Create, Storyboard, and Edit MV.
  It aligns to the form column, reserves the full overlay height in layout, and raises
  above the Footer instead of obscuring the last fields.
- Expanded Song Create/Result: Song Length is intentionally hidden in both Instrumental
  states; the result player uses a responsive 542:442 baseline ratio, circular
  rotating-while-playing art, current/total time, playlist-based previous/next, download,
  Publish, and a vertical volume slider whose icon and slider share a stable hover target.
  My Creations is a full-width two-column list below the player and swaps the active song
  in place rather than navigating away.
- Refined the MV creation flow: responsive 700:332 create layout, contain-fit user
  uploads, corrected popup/header/processing states, storyboard image preview/download
  and song timing, and responsive 700px media column on MV Result.
- Expanded Edit MV to use the real storyboard videos 1–11, horizontal thumbnail history
  with an edge gradient, download/fullscreen/volume controls, scene-specific prompt text,
  disabled Recreate when unchanged or empty, and appended/selected mock generations after
  Recreate.
- Added `AuthProvider` and `CreditBalance`. Unsigned users see Login rather than credits;
  Start for Free opens MV Create; generate/recreate actions call `requireSignIn()` and
  open one global LoginModal. Mock sign-in persists in `sessionStorage` for the current
  browser session only.
- Added the current grid-based History page (`/history`) with All/Music Videos/Songs/Liked
  tabs, done/generating/failed/storyboard-ready states, Create MV, and an action menu.
- Added Blog concepts 1 and 3 (`/blog1`, `/blog3`); the discarded Blog 2 concept and
  exploratory History alternatives were removed. Blog category controls are slotted into
  the sticky first-layer header. Every category has complete feature, Trending Now, and
  grid data. Cards use Neutral/Dark/09 and image-only hover scaling.
- Added storyboard media catalogs under `src/assets/covers/storyboard-clips/` and
  `src/assets/storyboard-clips/`, assembled by `src/data/storyboardClips.ts`.

### Pages and shared components changed

- Pages: Home, Song Create/Result, MV Create, MV Storyboard, MV Result, MV Edit, History,
  Blog 1/3, plus manual routing in `src/App.tsx`.
- Shared components: Button, DetailNavbar, LoginModal, Navbar, RoomNavbar, Sidebar.
- New shared components: AuthProvider, CreditBalance, FloatingCTA.
- New mock-data module: `src/data/storyboardClips.ts`.

### Important implementation decisions

- Auth remains prototype-only and centralized: no API/OAuth. `AuthProvider` owns one
  LoginModal and exposes `openSignIn()` / `requireSignIn()`.
- Long-form generate CTAs must use `FloatingCTA`; fixed positioning alone is not
  sufficient because it covers fields and the Footer.
- Song Length is retained in code but gated with `SHOW_SONG_LENGTH = false` for the
  current product phase, regardless of Instrumental state.
- History and Blog are now formal routed screens. Blog shares one catalog across both
  retained concepts; category filtering must still leave enough records for every layout
  region.
- Home Hero keeps one real thumbnail list. Do not use cloned infinite rails or
  `scrollIntoView()`; both previously caused visible jumps or document scrolling.
- New storyboard media is registered through `storyboardClips.ts`; do not hand-maintain a
  second parallel array inside a page.

### Known issues and unfinished items

- MV/Song Detail Back still defaults to Home. The approved but unimplemented solution is
  to add and preserve `from=home|mv-create|song-create` in entry/detail links and derive
  `DetailNavbar.backHref` from it.
- Trim Audio still needs the inspected Figma node `90:1600` precision pass: fixed 45-bar
  geometry, handle grips/hit areas, selection geometry, and a moving playhead. The current
  trimmer remains interactive but visually approximate.
- Song Result/Lyrics and the newest MV Result/Edit refinements still benefit from a final
  pixel-by-pixel Figma pass at all six responsive tiers.
- No automated test suite exists; verification is build/type-check plus manual browser
  checks.
- The working tree contains tracked deletions of older top-level cover assets. These are
  separate from `src/assets/covers/Ｘ/` and must be explicitly reviewed before staging.
- `src/assets/covers/Ｘ/` is an untracked manual holding area owned by the product owner.
  Do not inspect, stage, delete, move, rename, restore, or duplicate its contents without
  a new explicit instruction.

### Recommended next steps

1. Implement the agreed MV/Song Detail Back-origin query parameter flow.
2. Apply the inspected Figma node `90:1600` trimmer geometry/playhead pass.
3. Do a six-width visual pass over the newly refined Song Result and MV flow.
4. Confirm whether the tracked top-level cover deletions belong in the next commit; keep
   the untracked `Ｘ/` folder excluded either way.

## Pages and features completed

**HomePage** (`/` or `/home`) — landing page:
- Hero banner: auto-rotating video/thumbnail carousel with "Create Music Video" CTA.
  Desktop version has a clickable thumbnail rail that now auto-scrolls to keep the active
  thumbnail in view (fixed 2026-07-29 — see Handoff Log). Mobile has a separate
  fully-custom infinite draggable carousel (fixed 272×153 cards, single clone on each side,
  drag-to-navigate, auto-rotate).
- Tool selector, New Music Videos, Top Picks Songs, New Songs sections.
- Looping colorflow background video — **Home-only**, per an explicit global rule (see
  Design Decisions below); every other page has a plain dark background.

**MVDetailPage** (`/mv-detail`) — "See All Music Videos" page:
- Two sections (Top Picks Music Videos, Newly Released Music Video) drawing from one
  shared catalog (`src/data/musicVideos.ts`), reordered per section.
- Justified-gallery grid layout: rows fully fill available width before wrapping, row
  height flexes within a tuned range rather than every row being a fixed height.
- No "See all" links anywhere on this page — it's the deepest level in this flow.
- Uses the same video/cover catalog as Home's New Music Videos section, so clicking a
  cover on either page corresponds to the same clip.

**SongDetailPage** (`/song-detail`) — song player + lyrics page:
- Now Playing panel (art, transport controls, seekable progress, like/share/lyrics),
  synced lyric-line highlighting, Top Songs list.
- DetailNavbar and the page's Tabs bar are merged into one sticky header box (no visible
  seam between them).

**SongCreatePage** (`/song-create`) — "AI Song — Feature Room", the newest and most
elaborate flow, reachable from Home's "AI Song Composer" card and the Sidebar's "AI Song"
link:
- **Simple** mode: idea textarea + Instrumental toggle + Idea (suggestion) button + char
  count; **Custom** mode: lyrics textarea + Idea/Lyrics generate buttons + Genre/Mood/Vocal
  chip pickers + optional Song Title field. Song Length is retained for a later phase but
  hidden in the current UI in both Instrumental states.
- Both textareas grow an Enhance ("polish this text") button and a Clear (×) button once
  they have a value, matching a specific Figma micro-state (node 1357:30384).
- "Create Song" CTA (disabled until valid input in Simple mode; always enabled in Custom).
- **My Creations** side panel, using the shared `ListItem` component's `variant="song"` —
  this was originally built with the wrong Figma component variant (see Design Decisions).
- **Processing stage**: "Composing Your Song" screen — animated equalizer wave, progress
  bar that now actually reaches 100% (see Handoff Log), rotating status text, "View Later"
  button. My Creations is hidden entirely during this stage and the panel is centered full-
  width (fixed 2026-07-29).
- **Result stage**: a real song is picked from the mock catalog to stand in as "the
  generated song" — real cover, real audio, real (mock) lyrics. Player UI mirrors
  SongDetailPage's Now Playing (art, transport, seekable progress, like/share/lyrics) plus
  two CTAs: "Use in Music Video" (links to `/mv-detail`) and "Recreate" (returns to the
  form). My Creations stays visible on desktop at this stage, hidden on mobile.
- **Lyrics bottom sheet**: mic/lyrics button opens synced, line-highlighted lyrics —
  mobile-native bottom sheet, becomes a centered dialog on desktop (same convention as
  LoginModal), reusing the exact highlight logic already built for SongDetailPage.

**Sign-in (LoginModal component, used globally)**:
- Redesigned to remove email/password entirely — logo, headline, subtitle, Apple/Google
  buttons only (no real OAuth). Mobile uses the exact Figma bottom-sheet frame directly;
  desktop reuses the existing centered-dialog convention (no separate desktop Figma frame
  was supplied for this one).
- A "Signed in successfully!" success stage appears after clicking either provider button,
  auto-closes after ~1.8s.

**ComponentsPage** (`/components`) — internal style-guide/showcase page (Button/Pill, Icon
Button, Card variants, and now a `ListItem` showcase — see below). Dev reference only, not
part of the product.

**AI Music Video flow** (new since the last handoff) — reachable from Home's "Create Music
Video" CTA and the Sidebar's "AI Music Video" link (previously `href="#"`, now wired to
`/mv-create`):
- **MVCreatePage** (`/mv-create`) — "AI MV — Feature Room": MV type selector (Singing/
  Storytelling/Hybrid, real preview clips from `src/assets/create-mv/type/`, static by
  default and playing only on desktop hover / mobile press — never more than one at once),
  Choose a Song (Song Library sheet with My Songs/Sample Songs tabs, real audio preview
  playback with a live play/pause icon per row, Import Audio), a video-idea textarea with
  Templates/Idea buttons and an Enhance button, character photo upload (Primary/Tertiary
  Active circular add buttons, an uploaded-photo state with delete + editable name), a
  Settings sheet (aspect/quality with icons, MV title/author, Subtitle/Watermark toggles —
  Watermark is now a real, operable toggle, not a locked upsell placeholder), and a "How
  would you like to create?" mode-choice sheet (Storyboard-first vs. Direct).
- **MVStoryboardPage** (`/mv-storyboard`) — opens on a ~3s mock "Crafting Your Storyboard"
  processing screen (progress %, ETA, "View Later"), then reveals the editable storyboard:
  read-only Visual Style/Story cards, 4 editable Scene textareas (char count + Enhance),
  Character Image, MV Song preview, synced Lyrics.
  - **MVResultPage** (`/mv-result`) — single component that switches between a portrait and
  landscape layout depending on the draft's aspect setting; "Edit MV" quick action.
- **MVEditPage** (`/mv-edit`) — 7-clip storyboard strip + scrubbable preview player, Scene
  editor, Cover Image + prompt + Recreate, MV Title/Author Name, Subtitle/Watermark toggles,
  Delete Project/Merge MV.
- A new **Trim Audio** step now sits between picking a song and it actually being applied:
  clicking "Use" on a song row opens a Trim Audio sheet (real audio duration, a decorative-
  but-draggable waveform with two trim handles) — confirming there is what actually commits
  the song choice. No real audio trimming happens (mock UI only, per project scope).
- A new **Select a Template** sheet opens from the video-idea textarea's "Templates" button:
  5 named style templates (J-Pop, Midnight Static, Paper Wonderland, Pastel Film, Alice in
  Wonderland), each previewed with its actual video (not a static image) at its real
  portrait/landscape ratio; picking one + confirming fills the idea textarea with that
  template's description.
- A new shared **`useEnhance` hook** (`src/hooks/useEnhance.ts`) drives every "Enhance"
  button across the whole app (MV Create's idea box, Song Create's idea/lyrics boxes,
  Storyboard's 4 scene boxes, Edit MV's 2 prompt boxes): clicking it dims/disables the rest
  of that input box, spins the icon (ic_refresh, counter-clockwise) for ~1s, then swaps in
  new text.
- **`ListItem` was substantially rebuilt** this pass (see Design Decisions) — its Community
  variant now has a real narrow/wide container-query layout, Song variant has correct
  album-art sizing, and both variants share one borderless, hover-highlighted treatment
  instead of Community having its own extra card border.
- **Desktop popup convention changed globally** for every sheet on the AI Music Video page
  (see Design Decisions) — close (X) moved to the top-right and a bottom Cancel/Confirm
  button row replaced the header checkmark, on desktop only. Mobile is unchanged.

## Current implementation status

All routed pages (Home, MV Detail, Song Detail, Song Create, the 4 new AI Music Video
pages, Components) render and are navigable via the Sidebar and in-page links. Sidebar
active-state highlighting is pathname-based (not hardcoded to Home). `npm run build` (which
runs `tsc -b` then a production Vite build) passes clean as of this handoff. No automated
tests exist; verification throughout this project has been manual — browser checks at
1920/1440/1024/768/375/320px plus console-error checks (this pass's UI-heavy work was
spot-checked mainly at 1440px/375px via direct DOM/JS assertions, since the browser
screenshot tool was unreliable for parts of this session — see Known issues).

The authoritative latest-commit marker for the current checkpoint is recorded near the top
of this file. Older commit IDs in the dated logs below are historical handoff references.

## Important design decisions from this project's history

- **`import.meta.glob` for mock catalogs.** `src/data/songs.ts` and `src/data/musicVideos.ts`
  both auto-discover asset files from folder conventions (`Top Picks Songs/<song>/cover.*` +
  `song.mp3` + `title.json`; `New Music Videos/mv_NN_<slug>.<ext>` cover+video pairs) instead
  of hand-maintained arrays. Adding a new mock song/MV means adding files in the matching
  pattern, not editing the data file.
- **One shared video/cover catalog for MVs across pages.** Home's New Music Videos section
  and MVDetailPage were deliberately pointed at the same `MUSIC_VIDEOS` data source so a
  cover always corresponds to the same clip everywhere it appears — this was an explicit
  user request after the two pages briefly had mismatched sources.
- **Justified-gallery algorithm (MVDetailPage).** Rows pack greedily until the *next* item
  would push row height below a minimum threshold (not until it crosses a maximum) — the
  first implementation had this backwards and left rows under-filled with a visible gap.
  Only the true trailing row is allowed to clamp outside the target height range.
- **`ListItem` gained a `variant` prop instead of a new component.** The Song Create "My
  Creations" list was first built using the *wrong* Figma component variant (a
  Community-style row with stats/actions) instead of the correct Song-type variant
  (subtitle + chevron, no stats). Once caught, the fix extended the existing `ListItem`
  component with `variant="song"` rather than creating a parallel component — consistent
  with CLAUDE.md's "don't over-split components" rule.
- **Global rule: colorflow background is Home-only.** `AppLayout` gained a `showBackground`
  prop (default `false`); only `HomePage` passes `showBackground`. Every other page —
  including the new Song Create Room — has a plain dark background. This was an explicit,
  retroactive rule applied mid-project, not part of any single page's original Figma spec.
- **Global rule: large CTA buttons don't stretch full-width on desktop.** Buttons like
  "Create Song" and the Result screen's two CTAs use `min-width: 230px` + `padding: 0 16px`
  and are centered under their container on desktop (≥1024px); **mobile is explicitly
  unaffected** and keeps the original full-width design. This rule was corrected once
  mid-project (an initial version used `padding: 0 48px` with left-alignment before the
  user asked for the centered/16px version) — if asked to touch any other large button in
  the future, apply this same treatment rather than reinventing it.
- **Hero thumbnail rail: no infinite-scroll illusion.** An earlier implementation rendered
  the thumbnail row three times back-to-back and silently recentered scroll position to
  fake an infinite loop — this had a padding-math bug that could show up as a visible gap
  during the silent recenter jump. It was replaced with a single real copy of the row plus
  local horizontal `scrollTo()` calculations whenever selection changes. This avoids
  `scrollIntoView()` moving the whole document and explicitly restores edge padding at the
  first/last items. Do not reintroduce the copy-and-recenter trick.
- **Figma access requires the user to re-authorize the MCP connection.** During the Song
  Result build, Figma's Dev Mode MCP was unavailable (needs interactive OAuth via `/mcp`).
  `SongResult`'s layout was built by closely mirroring the already-Figma-verified
  SongDetailPage "Now Playing" component instead of guessing — flagged to the user as
  something to visually double check once Figma access is restored.
- **Desktop popup convention (new, this pass).** Every sheet on the AI Music Video page
  (Settings, Choose Song, Select a Template, Trim Audio, Mode Choice) shares one `.mv-sheet`
  shell. Figma's own desktop "Popup Dialog" component (node 1641:31755) put the close (X)
  button top-right with a Cancel/Confirm button row at the bottom, whereas its mobile bottom
  sheets put X top-left with a checkmark top-right and no bottom row — those are two
  genuinely different header conventions per device, not the same design scaled down. This
  is implemented with a single `@media (min-width: 768px)` block that reorders the existing
  header children via CSS `order` (no JSX duplication) and reveals a `.mv-sheet__footer` row
  that's `display: none` by default. Sheets whose content has no real "confirm a pending
  choice" step (Choose Song, Mode Choice) only get the X repositioned — no footer was added
  to them, since Figma's own reference for those doesn't show one either.
- **Template/song "Use" flow needed extra steps that weren't there before.** Two flows that
  used to be a single click were both split into an extra intermediate sheet once the
  correct Figma frames were checked: picking a song's "Use" now opens Trim Audio before the
  song is actually applied; the Templates button now opens a picker sheet instead of
  directly inserting random suggestion text. Both follow the same "select in a
  presentational sheet, confirm to commit" shape as the rest of this page.
- **`useEnhance` hook extracted once several pages needed the identical "processing" state**
  (dim the input, spin the Enhance icon ~1s, then swap the text) — added to
  `src/hooks/useEnhance.ts` and reused by MV Create, Song Create, MV Storyboard, and MV Edit
  rather than reimplementing the same timer/disabled-state logic four times.

## Known issues / unfinished work

- **`SongResult` and its Lyrics sheet have not been re-verified pixel-for-pixel against
  Figma** (nodes 50:84, 881:19546, and desktop reference 1611:23120) — they were built by
  reusing SongDetailPage's already-verified player pattern while Figma access was down.
  This is the single highest-priority thing to check once Figma MCP access is restored.
- **`ComponentsPage`** exists purely as an internal showcase and predates most of the
  conventions used elsewhere (e.g. it may not reflect the latest Button/Card states) — treat
  it as a reference, not a page that needs to stay in lockstep with product pages.
- **`src/styles/breakpoints.css`** is an empty scaffold that is not imported anywhere. It
  exists only as a documented list of the six RWD tiers. Don't assume it does anything.
- **`README.md`** is still the unedited default Vite template — it does not describe this
  project. (This may be intentionally out of scope; AGENTS.md/PROJECT_CONTEXT.md are meant
  to be the actual onboarding docs going forward.)
- No automated tests exist. All verification has been manual browser checks.
- Stray `.DS_Store` files exist in several `src/assets` subfolders (harmless, gitignored,
  but worth a cleanup pass if the next agent wants a tidy diff sometime).
- **`src/assets/covers/Ｘ/` (fullwidth-X folder name) exists on disk, untracked, and must
  stay that way.** The product owner uses it as a manual holding area and has added more
  files since the first audit. Do not inspect, `git add`, delete, move, rename, restore, or
  duplicate anything in this folder without a new explicit request.
- **Tracked top-level cover deletions are present in the current working tree.** They are
  separate from the untracked `Ｘ/` folder and must be reviewed in the checkpoint file list
  before staging; do not silently restore or stage them as part of unrelated UI work.
- **Trim Audio doesn't actually trim anything.** The sheet has a real audio duration, a
  real draggable two-handle selection over a (decorative, Figma-sourced) waveform, and
  Confirm really does commit the song choice — but no audio processing happens; this is
  visual/interaction fidelity only, consistent with the rest of the app's mock-data scope.
- **Trim Audio still needs the approved Figma-precision pass** for node `90:1600`: fixed
  45-bar geometry, handle grips/hit areas, selection geometry, and a moving playhead were
  inspected and planned but were not implemented before this checkpoint.
- **Detail-page Back origin handling is not implemented yet.** MV/Song Detail still fall
  back to `/home` when entered from the corresponding Create page's My Creations panel.
  The agreed approach is to add and preserve `from=home|mv-create|song-create` query
  parameters and derive `DetailNavbar.backHref` from them.
- **MV Result / Storyboard / Edit MV were built once each, not yet re-verified against a
  fresh Figma pull in this same pass** the way MV Create's individual pieces were (Storyboard
  Processing, Templates sheet, Trim Audio, and the desktop popup convention were all built
  from freshly-fetched Figma nodes and spot-checked in-browser this pass) — if the product
  owner has newer Figma frames for Result/Edit MV specifically, treat those two pages as due
  for a fresh comparison pass.
- **`HeroBannerSection.css` has an uncommitted-turned-committed padding fix** (moving
  horizontal padding from the outer `.hero-banner` container onto `.hero-banner__top` and
  `.hero-banner__thumbnails` individually, so the thumbnail rail's own padding scrolls as
  part of its content instead of being a fixed offset) that predates this pass's own session
  record — it type-checked and was included in this handoff's commit, but hasn't been
  re-eyeballed at all six widths within this specific pass. Worth a quick visual check on
  Home's hero thumbnail rail if anything there looks off.
- Screenshot-based visual verification was flaky for part of this session (the Browser
  pane's screenshot tool intermittently rendered at the wrong scale/crop). Where that
  happened, verification fell back to direct DOM/computed-style assertions via JS instead of
  screenshots — functionally reliable, but means less has been eyeballed visually this pass
  than usual. Worth a plain visual pass over the new AI Music Video pages before calling them
  fully done.

## Recommended next steps

1. Once Figma MCP access is re-authorized, do a pixel-diff pass on `SongResult` /
   `SongResultLyrics` against nodes 50:84 / 881:19546 / 1611:23120, per CLAUDE.md's normal
   "compare against Figma, list discrepancies" workflow.
2. Confirm with the product owner whether `SongCreatePage`'s "Recreate" button and "Use in
   Music Video" link's destinations are the intended long-term behavior, or placeholders.
3. If new pages are added, follow the same catalog pattern as `songs.ts`/`musicVideos.ts`
   (asset-folder convention + `import.meta.glob`) rather than hand-writing new mock arrays.
4. Before adding any new large CTA button, reuse the desktop non-stretch / mobile
   full-width pattern already established (see Design Decisions above) instead of asking
   the user to re-specify it.
5. Keep using Figma node-ID comments in new components — this is how the project traces
   fidelity back to source designs, and it's the fastest way for a new agent to re-verify
   a screen later.
6. Do a plain visual (not just DOM-assertion) pass over MV Create/Storyboard/Result/Edit at
   all six widths — this pass leaned more than usual on JS/DOM checks instead of screenshots
   (see Known issues), so a fresh pair of eyes on the actual rendered pages is worthwhile.
7. Ask the product owner before touching or clearing `src/assets/covers/Ｘ/` — it's their
   own in-progress cleanup, not the agent's to resolve.
8. If newer Figma frames exist for MV Result / MV Edit specifically, treat them as not yet
   re-verified in this pass (unlike MV Create's sub-flows, which were freshly re-checked).

## Handoff Log — 2026-07-29

- Fixed the Home hero desktop thumbnail rail: the active thumbnail could drift completely
  off-screen during auto-rotation because the row never scrolled to follow selection.
  Replaced the old 3x-copy "infinite scroll" illusion (which had a padding-math bug) with a
  single-copy row that scrolls the active thumbnail into view on every selection change,
  including the last-to-first wrap. Scrollbar is now hidden.
- Reworked the Song Create "Processing" stage: the My Creations side panel is no longer
  shown at all while composing (previously shown on desktop); the form panel now expands to
  full width and centers the processing UI in that space instead.
- Standardized large desktop CTA buttons (Create Song; Result screen's "Use in Music Video"
  / "Recreate") to `min-width: 230px`, `padding: 0 16px`, centered under their parent on
  desktop — replacing an earlier `padding: 0 48px` + left-aligned version. Mobile is
  unchanged (still full-width).
- Completed and verified the Song Result player screen and its Lyrics bottom sheet
  (previously in progress) — wired the Processing → Result stage transition, added a real
  song pick from the mock catalog, synced lyric highlighting, and all associated CSS.
  Verified via `tsc -b` and manual browser checks at 1440px and 375px.
- Committed and pushed **all accumulated work from this session** in one commit
  (`470146e`) — this includes the entire Song Create Room feature, the MV Detail justified
  gallery rework, the Sign In redesign (including the success stage), navbar gradient
  background fixes, and the global "background/CTA" rules described above. Nothing from
  this session was committed incrementally; it had all been sitting uncommitted until this
  push, per the user's explicit go-ahead.
- Created this file and [AGENTS.md](AGENTS.md) to hand the project off to a different
  coding agent going forward.

## Handoff Log — 2026-07-30

- Built the entire **AI Music Video flow**: `MVCreatePage` (`/mv-create`), `MVStoryboardPage`
  (`/mv-storyboard`, including a new ~3s mock Processing stage), `MVResultPage`
  (`/mv-result`), and `MVEditPage` (`/mv-edit`), wired into `src/App.tsx` and the Sidebar's
  "AI Music Video" link (previously `href="#"`).
- Rebuilt the shared **`ListItem`** component (Community narrow/wide container-query
  layout, correct Song-variant album-art sizing, unified borderless hover treatment) and
  added a `ListItemShowcase` to `/components` demonstrating it in isolation before it was
  applied to real pages.
- Added a shared **`useEnhance` hook** (`src/hooks/useEnhance.ts`) and switched every
  "Enhance" button in the app (MV Create, Song Create ×2, MV Storyboard ×4, MV Edit ×2) over
  to it, fixing the spin direction (now counter-clockwise, matching the icon) and the
  button's color (purple background / white icon, matching Figma — it had been white
  background / black icon).
- Replaced MV Create's 3 style-type videos with real clips (default static, plays only on
  desktop hover / mobile press, never more than one at once) and removed the description
  text under them per feedback.
- Fixed MV Create's Settings sheet: added missing icons to the Aspect Ratio/Quality
  options, made Show Watermark a real operable toggle instead of a locked placeholder, and
  made the collapsed Settings summary's chips dim/brighten based on whether their field is
  actually filled in/on, not a hardcoded "locked" state.
- Rebuilt MV Create's Upload Character Photo buttons to the correct Primary/Tertiary Active
  circular styles (previously a plain Ghost icon) and rebuilt the uploaded-photo state to
  match Figma: delete (X) top-right, an editable name field + edit pencil bottom row.
- Added a **Select a Template** sheet (previously the Templates button just inserted random
  text directly) — 5 named templates, each previewed with its real video at its real
  portrait/landscape ratio rather than a static cropped image.
- Added real audio interaction to the Choose Song sheet: clicking a row plays/pauses that
  song's audio via a single shared `<audio>` element, with the thumbnail's icon reflecting
  play/pause state live; added My Songs/Sample Songs tabs; the "Use" pill on each row now
  only appears once that row is active (desktop hover, mobile tap) instead of always.
- Added a new **Trim Audio** sheet between picking a song and it being applied: real audio
  duration, a draggable two-handle waveform selection (Figma's own mock waveform data,
  reused verbatim), Confirm is what actually commits the song choice.
- Changed the **desktop popup convention for every sheet on this page** to match Figma's
  dedicated desktop dialog component (node 1641:31755): close (X) moved from top-left to
  top-right, and a bottom Cancel/Confirm button row replaced the header checkmark — desktop
  only; mobile's original X-left/checkmark-right bottom-sheet header is untouched.
- Restored ~29 cover PNG files under `src/assets/covers/` that had been deleted in the
  working tree (moved into an untracked `Ｘ/` folder by the product owner as their own
  in-progress manual cleanup) — **do not delete or re-stage those deletions**; see Known
  issues above. Confirmed via `grep` that nothing in `src/data/*.ts` references the
  top-level copies (only the `New Music Videos`/`Top Picks Songs` subfolder copies are used).
- Verified via `tsc -b` + a full `npm run build` (production build, no errors) plus a mix of
  in-browser manual checks and direct DOM/computed-style JS assertions (screenshots were
  intermittently unreliable this session — see Known issues) at 1440px and 375px.
- This handoff's commit stages only the AI Music Video feature work, the `ListItem`/
  `useEnhance` refactors, the Sidebar/App.tsx routing changes, and this documentation
  update — it deliberately excludes the cover-image deletions (restored, not staged) and
  does not touch the untracked `Ｘ/` folder.

## Handoff Log — 2026-07-31

- Refined Home interactions: Tool Selector visual states, horizontally scrollable New
  Music Videos/Top Picks rows with correct two-way arrows and hidden scrollbars, more mock
  content, and Hero thumbnail auto-scroll that retains first/last padding without moving
  the document.
- Standardized Large button typography/sizing and added the shared `FloatingCTA` used by
  Song Create, MV Create, Storyboard, and Edit MV. Floating CTAs align to the form column,
  reserve overlay space, and avoid the Footer.
- Expanded Song Create/Result with the responsive player, rotating circular art, list-based
  song selection/transport, Publish/download/volume interactions, and a full-width My
  Creations list. Song Length is hidden in both Instrumental states for the current phase.
- Refined MV Create/Storyboard/Result/Edit against the latest supplied frames, including
  responsive 700:332 layouts, contain-fit uploads, storyboard image/song details, real
  storyboard media 1–11, and prompt/recreate generation states.
- Added the app-wide mock `AuthProvider`, shared `CreditBalance`, signed-out Login states,
  session-scoped sign-in, Start for Free routing, and sign-in gating for generate/recreate
  actions.
- Added the formal History grid with All/Music Videos/Songs/Liked filters and mixed
  completion states, plus retained Blog concepts 1/3 with sticky header tabs, complete
  per-category article data, and History-style card hover treatment.
- Added `storyboardClips.ts` and the associated cover/video assets. The working tree also
  contains tracked deletions of older top-level covers; these must be explicitly reviewed
  before staging. The separate untracked `src/assets/covers/Ｘ/` folder was not touched.
- Left two approved follow-ups intentionally unfinished: source-aware MV/Song Detail Back
  navigation and the Figma node `90:1600` trimmer precision pass.

## Handoff Log — 2026-08-03

- Added the Account, Settings, Credits, and Community Profile prototype routes and the
  signed-in Sidebar profile surface. Added mock sign-out support to AuthProvider.
- Added and documented the shared Badge component, applied it to History, corrected the
  failed-state artwork color, and fixed the shared Large Primary disabled-opacity rule.
- Updated LoginModal to the newest supplied sign-in dialog design and preserved the
  existing prototype-only session sign-in flow.
- Completed the approved `from` query navigation for Home, MV Create, Song Create, and
  History entries, including source-aware Back behavior throughout MV and Song details.
- Expanded History's mixed content/state interactions: direct Storyboard edit, History-
  origin AI Song result playback, Liked Song routing, type-specific More menus, publish
  review/unpublish, delete confirmation, and mobile bottom-sheet actions.
- Removed the MV Create prompt's Idea shortcut and added active play/pause state to the
  shared ListItem presentation used by AI Song My Creations.
- Prepared this documentation checkpoint without making new UI changes. Build/type-check
  results and the exact file list are reported to the product owner before any staging,
  commit, or push.

## Handoff Log — 2026-08-04

- Built the Upgrade/Buy-Credits monetization surface: `UpgradeButton`/`UpgradeDialog`
  (header pill + 3-plan pricing popup) and `CreditsDialog` (6-pack Buy Credits popup),
  wired to all their entry points (header credit balance, Sidebar Upgrade, Credits page's
  Buy More).
- Added `useMountTransition`/`useLastValue` and rolled a consistent 0.3s open/close
  transition + backdrop blur out to every popup in the app (~12 dialogs/sheets); fixed a
  single-vs-double-`requestAnimationFrame` bug that was silently skipping the enter
  animation on every one of them.
- Added shared `PublishDialog`/`Toast` components and standardized "MV publish confirms
  first, Song publish just toasts" across History, MV Result, Song Create, and Community
  Profile (previously only History had this distinction, implemented inline).
- Reworked Home's Hero Banner (rotating two-line marketing headline replacing the old
  "Trending MV" badge) and Tool Selector cards (bigger icon badges, always-on ambient
  glow, hover shimmer border), and built a full alternate Tool Selector treatment as a
  temporary `/home-review-b` A/B page for the product owner to choose between.
- Fixed several navbar/tabs consistency bugs found during review: `DetailNavbar`/
  `RoomNavbar` action alignment, History's tabs bar not being sticky (now lives in
  `RoomNavbar`'s `tabsSlot`), and the shared `Tabs` component's default height (28px→34px,
  removing three pages' redundant local overrides of the same fix).
- Made `CommunityProfilePage`'s Back button referrer-based instead of hardcoded to
  `/account`, added its own sign-in gate for the owner's profile, and threaded
  `from=community-profile` through to MV/Song Detail so their own Back buttons can return
  here.
- Established the "community usernames are never the signed-in user" convention:
  `songs.ts` gained a per-song `username` (mirroring `musicVideos.ts`), fixing three
  places on Song Detail that had been hardcoded to "ScottWu"; `Card`/`ListItem` gained the
  same clickable-avatar wiring already used elsewhere.
- Fixed two Like-icon color bugs on Song Detail (list row not matching Share's dimmed
  default color; Now Playing/mobile player never actually turning purple when active — the
  CSS existed but the active class was never applied).
- Smaller fixes: MV Edit's Cover Image Recreate button no longer requires the prompt text
  to have changed; MV Create's Mode Choice cards got a gradient stroke + repositioned
  credits tag; `CreditsDialog`'s pack tags no longer affect row spacing; disabled Vite's
  CSS minifier to stop it from dropping the standard `backdrop-filter` alongside the
  `-webkit-` one in production builds.
- Prepared this documentation checkpoint (this entry) without making further UI changes.
  Build/type-check results and the exact file list are reported to the product owner
  before staging, commit, and push.
