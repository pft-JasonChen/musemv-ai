@AGENTS.md

## In flight — read before starting

> ## → START WITH `docs/NEXT-SESSION.md`
>
> Written 2026-08-06 so a fresh session does not have to re-derive anything. It carries the
> measured DP drop-to-drop diff (`568e64c` → `2670ed2`: **`tokens.css` unchanged**, no icon
> changes, **13 of 33 gated stylesheets moved**, and the landing page is a 17th route migration
> rather than a re-sync), the recommended order of the remaining work, and the standing scope
> rule. **Read it before this file.**

**SCOPE RULE (product owner, 2026-08-06).** This phase's deliverable is "the code architecture is
sound enough for RD to wire the backend". A finding that is **purely UI** and touches neither the
contract, the providers, nor a product rule is **deliberately left unfixed** until the next DP
drop. That is why most of `TODO.md` #7 and nearly all of `DESIGNER-TODO.md` are open — they are
decisions, not slipped work. The uncomfortable case to know: **all of 7a is deferred, including
the keyboard-seek half**, so four playback seek bars stay pointer-only (WCAG 2.1.1 Serious), and
on `/mv/result` that is a regression against the pre-migration `<video controls>`. Offered
separately, deferred anyway, accepted knowingly.

**DROP 2 IS VENDORED AND ITS RE-SYNC IS COMPLETE (`2670ed2`; vendored 2026-08-06, finished
2026-08-07).** `designer-prototype/` is no longer `568e64c`. `tokens.css` and every icon are
byte-identical to drop 1; 13 of 33 gated stylesheets moved and are re-copied, and `SongPlayBar.css`
joined the set (**34/34 verbatim**). Two of those 13 assumed DOM WA did not have and broke a screen
each — `/explore/mvs` blank on phones, `/song/play`'s desktop player unstyled. **Both are fixed;
`docs/NEXT-SESSION.md` §2.0 is the record.** Three things from it are worth carrying:

- **The desktop song row now NAVIGATES**, reversing slice 3b one day after it shipped.
  `AC-EXP-03` and its e2e assertion moved together — a passing test had pinned the old decision.
  DP split the row's two affordances: TITLE opens `/song/result`, ALBUM ART starts `SongPlayBar`
  (a desktop preview bar) in place. `/song/result` gained a cold-resolve branch so a community
  `?id=` works with no flow state; the seeding half already existed in `useOpenCreation.ts`.
- **An earlier pass got this drop confidently wrong by reading a CSS diff instead of the markup**,
  concluding `SongPlayBar` had replaced the player and would delete four of `AC-EXP-05`'s five
  requirements. The product owner caught it by running the prototype. Nothing was lost.
- **`/explore/mvs` on phones now shows 3 of the catalog's 14 MVs** (DP hides every non-`--primary`
  section; WA's two sections are different catalogs, 3 + 11). Decided as "follow DP" on the
  framing "a secondary catalog is hidden"; the 3/14 ratio was counted afterwards. `DESIGNER-TODO`
  **A19**, and asserted in `e2e` so it is not silently "fixed".

The one lesson worth carrying from the vendoring itself, because it is the fourth instance of the
same shape:
**a re-sync can BREAK a screen through an override that used to be correct.** WA's A4 override hid
`.detail-navbar__top`; the drop put the new mobile back control inside `__top` and, separately,
hid `.detail-navbar__tabs` on phones on purpose. Both halves cancelled and `/explore/songs`
measured a 375×50 bar with neither tabs nor a way back — typecheck, lint, vitest, build,
guard-greps and designer-css were all green through it. **When a drop lands, re-read every entry
in `designer-overrides.css` against the new CSS, not just the diff of the copied files.**
A5 is closed by this drop and WA's `phoneBack` workaround is deleted; details in
`docs/DESIGNER-TODO.md` A5 and `docs/NEXT-SESSION.md` §2.

**The designer-UI migration is live.** The package landed 2026-08-04 and is vendored at
`../designer-prototype/` (DP). Read in this order:

1. **`docs/redesign-migration-plan.md`** — the **plan of record**. §1 is what was decided and
   why; §2 is scope; §3 is the nine open items; §4 is the phase/slice order. R-1…R-9 and the
   S1–S20 spec differences are **answered here** — earlier documents state them as open.
2. **`docs/UI-INTEGRATION-HANDOFF.md`** — still the best orientation to what the gates catch
   and how the three prototypes differ (§0 and §2). Its §5 decision queue is now closed.
3. `docs/redesign-migration-plan-2026-08-01.md` — background and derivation only. Its §9
   (RD contract C1–C8) and §10 (gates G1–G7) remain in force; its judgements do not.

**Where it is up to (2026-08-06, fifth handoff).** Phases 0 / 1 / 1.5 / 2a / 2b are done and
**Phase 3's migration work is COMPLETE — 16 of 16 routes**, per `OWN_CHROME` in
`src/components/shell/AppShell.tsx`. Landed: `/explore/mvs` (3a), `/explore/songs` + `/song/play`
(3b), `/profile` + `/settings` (3c), `/watch` (3d), `/creator` (3e), the three Credits IAP modals
(3f), the `/mv/room` page body (3g) and its six overlays (3g-2), `/mv/thinking` +
`/mv/storyboard` (3h), `/mv/result` (3i), the three `/song/*` stages (3j), and `/mv/edit` (3k).

**A12 is closed, and the four handoffs that recorded it were describing the wrong thing.** It was
never "DP's `/mv-edit` page does not render". Run DP outside the repo and it is TWO batches of
missing assets, neither page-specific: `src/assets/hero/*` is absent and `HeroBannerSection.tsx`
imports it BY NAME, so one unresolved import took the whole module graph down and **every** route
was white; and `src/assets/storyboard-clips/` is absent and `storyboardClips.ts` reads it with an
eager glob — **a glob that matches nothing does not throw, it yields `[]`**, so
`STORYBOARD_CLIPS[0]` was `undefined` and the page died on `.video` one layer away from the cause.
Supply both and all six widths render. The upstream fix is to ship the assets (DESIGNER-TODO A12).

**SEVEN DP MISMATCHES CAME BACK FROM THE PRODUCT OWNER AFTER PHASE 3 MERGED (2026-08-06), AND
ALL SEVEN WERE INVISIBLE TO EVERY GATE.** The full table is `docs/PHASE-3-ACCEPTANCE.md` §8. Three
lessons are worth carrying into the next slice rather than re-deriving:

- **A scope decision that changes what the user sees is a product decision.** Four of the seven
  were places a slice decided something defensible — "keep WA's behaviour" (`/explore/mvs` kept its
  dialog), "the title now matches the data" (the rails were pinned to "Trending", deleting DP's
  signed-in branch), "that needs its own slice" — and recorded it in a comment or, worse, in a
  PASSING TEST. `e2e` literally asserted "clicking a card still opens the dialog, not a
  navigation". A test can hold a decision in place long after the decision is wrong; if the
  decision is about what the user sees, ask instead of encoding it.
- **The reported symptom was not the defect.** "Back on `/mv/result` doesn't reach History" reads
  like a wrong `fallbackPath`. It was a two-screen LOOP: `GenerationView` forwards itself when
  `alreadyDone`, and it was `push`ing, so Back landed on `/mv/creating` which pushed the result
  back 350ms later. Both generation screens `replace` now. And `fallbackPath` on those screens is
  nearly unreachable anyway (`hasInAppHistory()` is true on every route that can reach them with
  flow state) — changing it alone would have shipped a fix that fixed nothing.
- **`visual-baseline.spec.ts` never photographs `/mv/result` or `/song/result`.** It cold-`goto`s
  each route with auth but no flow state, and both screens `router.replace()` out — so those two
  baselines are pictures of `/mv/room` and `/song/create`. Measured: replacing `/song/result`'s
  ENTIRE navbar changed zero pixels and the gate stayed 115/115. Third instance of the same class
  as the `fullPage` and `maxDiffPixelRatio` blind spots.

**The dead components are gone, and it was SIX files, not five.** `CreationDialog` was the root;
killing it killed `MvDetail` and `SongDetail`, and `SongDetail` was `LyricsPanel`'s last consumer
— plus `CommunityMvDialog` and the long-dead `TrendingMvsPanel`. Each had a live DP replacement
(`/watch`, `/mv/result`, `/song/result`, `ui/LyricsSheet`). The only logic that went with them is
`FREE_PREVIEW_SEC`, already cancelled by S3. **There is no dead component left in `src/`.**

**The `Idea` / `Ideas` buttons are removed, and this is the one deviation that DECAYS.** V1 ships
no canned-sample fillers, so three buttons went: `/mv/room`'s Ideas and both of `/song/create`'s
Idea. DP **has** all three (`MVCreatePage.tsx:1182`, `SongCreatePage.tsx:598/703`), so this is a
subtraction FROM DP, and **every future drop will bring them back** — re-remove them each time.
`Templates` (`/mv/room`) and `Lyrics` (Custom mode) are different controls and stay. One layout
detail that looks like leftover but is not: the Simple describe box now renders an EMPTY
`.song-create__input-actions` div, because `.song-create__input-footer` is
`justify-content: space-between` and with one child the Enhance/count group slides left.

**ACCEPTANCE IS PART-DONE. The full record is `docs/PHASE-3-ACCEPTANCE.md` — read it before
re-running anything.** Two of the three reviews are complete and their verdicts are in that file:

- **G5-b design (V1–V6): PASS except V3** (`/creator` rows collide at 768 → DESIGNER-TODO **A17**)
  **and V4 partial** — `3e-creator`'s DP reference set is DP's sign-in wall at every width, so
  there is no twin to compare against.
- **G7 affordance (B1–B3): B3 PASS on all seven product rules**, B1 and B2 FAIL with eleven
  findings. Five were plain losses and are FIXED with mutation-tested guards (unmute on
  `/mv/result`, Settings' Cancel, the "My Creations" rail label on both create screens, MV Edit's
  MV-08 sentence, two DOM-level axe violations). The rest are `TODO.md` **#7a–7h** and
  DESIGNER-TODO **A17/A18**.
- **G7 a11y (A1–A5): NOT RUN.** An audit ran and was discarded — see the next block.

**A reviewer measuring a broken environment returns findings, not errors.** The a11y audit ran two
full sweeps against a page whose **238 KB designer stylesheet was 500ing**: the server had been
started before a rebuild replaced `.next`, and `next start` reads its manifest once at boot. It
returned a long, specific, confident report about a barely-styled DOM. It surfaced only because
its headline finding (`.mv-song-picker__use` focusable at `opacity: 0`) contradicted the CSS when
checked — on a sound build the pill is `0` by default and `1` once Tab enters the row. **Prove the
CSS loads before trusting any browser measurement**, and never `npm run build` against a running
`next start`. The rule is now in `AGENTS.md`; the full diagnosis is PHASE-3-ACCEPTANCE §6.

**Two invisible-icon regressions were found and fixed this session, and NEITHER was new.**
The credit pill's coin has been a 0×0 transparent span on every migrated screen since slice 2b,
and `/watch`'s Create MV arrow since 3d. Both are the same failure family, and it is the one to
internalise before porting another screen:

- **A mask icon fails silently in two ways.** It measures 0×0 when DP sized it with an ELEMENT
  selector (`.credit-balance img`, `.community-profile__social i`) and the port used a different
  tag; or it has a `mask-image` with **no background to clip** when DP painted it as a real
  `<img>` and the port turned it into a mask (`.{block}__close-icon`, `.button__icon` without
  its `--mask` modifier). Neither throws. Neither reliably shows up in a screenshot diff.
- **So decide the tag from the CSS, not from habit.** `width/height` only ⇒ real `<img>`.
  `background: currentColor` + `mask-*` ⇒ `DpIcon`. An element selector ⇒ `DpIcon as="i"`.
  The plan's "DP 的 icon 什麼時候是 `<img>`" table has the three real cases.
- Guarded by `e2e/behaviour-regressions.spec.ts` → "every mask icon on a migrated screen has
  something to clip", mutation-tested both ways. **Add each newly-migrated route to its list.**

**`TODO.md` #4 is FIXED (2026-08-05, its own slice).** `postcss-restore-backdrop-filter.mjs` puts
the standard `backdrop-filter` back after `@tailwindcss/postcss` drops it; the bundle went from 27
prefixed / 8 standard declarations to 27 / 27, and `e2e/backdrop-filter.spec.ts` holds it there.
**Two things about that fix are load-bearing if you ever touch the CSS pipeline:** the property is
dropped by lightningcss's declaration MERGING (equal values ⇒ the last declaration wins the prefix
set), which no target/minify setting turns off — measured across 8 configurations; and the repair
has to run _after_ Tailwind, because Tailwind is both what inlines the `@import`s and what runs
lightningcss. Do not "simplify" it by editing the designer stylesheets — they are gated verbatim.

**Slice 3b's three loose ends: A-1 and A-3 closed, A-2 run but NOT clean (2026-08-05).** 12 visual
baselines re-recorded on Linux (exactly 12 files, all `-linux`; the `-darwin` set stays unmaintained
on purpose — do NOT re-record it to make it green). G7's a11y leg was re-run in an independent
context and came back **PASS WITH FINDINGS**: the blur-restore itself is clean (worst case 7.10:1
across a 20-point scroll sweep, and both lyrics overlays verified correctly `inert`), but it
measured two pre-existing **Serious** issues — `.mobile-tabbar__label` at 3.74:1 (→ `DESIGNER-TODO`
A9) and a playback seek bar with no keyboard operability at all (→ `TODO.md` #5). Neither is fixed.

**`e2e/a11y.spec.ts` has a THIRD blind spot, and it is why the contrast failure survived:** the
spec never sets a viewport, so it runs at Playwright's desktop default and `.mobile-header` /
`.mobile-tabbar` / the mobile full-screen player are all `display:none` to axe. The whole
mobile-only chrome has never been scanned. (The two already-documented gaps are: it doesn't seed
auth, and it only scans unprefixed English routes.)

**Do not write an independent-review verdict before the review reports.** This session filled in
"A-2 closed" while the audit was still measuring; the auditing agent saw those edits and explicitly
declined to treat them as evidence. That is §10.7's failure mode in miniature — the acceptance
cell stays empty until the report is in hand.

**The visual gate cannot see scroll-dependent bugs.** `visual-baseline.spec.ts` uses
`fullPage: true`, which captures at scroll offset 0, so nothing is ever behind a sticky navbar.
115/115 green proved nothing about the missing blur, and the fix changed **zero** baseline pixels
on 17 routes. Anything that only manifests once the page scrolls — backdrop blur, scroll shadows,
sticky stacking — has to be checked by scrolling and capturing yourself. This is A4's lesson's
twin: A4 is "re-recording absorbs a loss", this is "the baseline cannot photograph the loss".

**Mutation-test a new guard test in BOTH directions.** The first version of
`e2e/backdrop-filter.spec.ts`'s CSS sweep walked the CSSOM and passed with AND without the fix —
Chrome discards `-webkit-backdrop-filter` at parse time, so `getPropertyValue` returns empty for
exactly the rules that are broken. Reading the test would never have revealed that; running the
mutation did. A test that cannot fail is worse than no test.

**`/profile` + `/settings` are DONE (slice 3c, 2026-08-05).** `OWN_CHROME` now lists 6 of 16.
Two things from it are worth carrying forward. **A5 is bigger than the plan said:** it was
recorded as blocking `/watch` alone, but running DP at 375px and sweeping for "declares a back
control whose computed height is 0" found **five** screens — `/watch`, `/settings`, `/creator`,
`/mv/result`, `/mv/storyboard` (DESIGNER-TODO A5 has the table). So check that table before
assuming a screen is unaffected. **And WA sometimes already solves what DP dropped:** `/settings`
had a working Back at every width before the migration, so porting DP verbatim would have deleted
it on phones. The in-page control stays (`md:hidden`, phones only) until A5 has a designer answer.

**G7 on 3c came back PASS WITH FINDINGS and caught a real affordance regression** — the migration
kept the Muse Pro row's click target and dropped its Subscribe/Manage pill, so the only purchase
entry point on the screen looked exactly like Notifications and Language. Nothing would have gone
red. That is the third time this pattern has bitten (A7's shuffle/repeat, A4's tabs row, now this):
**when a migrated row loses a trailing control, the behaviour survives and the affordance dies
silently.** Diff old vs new by control, not by screenshot.

**The visual gate has a SECOND structural blind spot.** `maxDiffPixelRatio: 0.002` is a share of
page area, so the same fixed-size element is a bigger fraction of a narrow page: restoring a 64×22
pill failed at 320/375 and **passed at 768 through 1920**. Desktop baselines can lose a control
without complaint. Re-record a genuinely-changed screen with `--update-snapshots=all` scoped by
`--grep`, or the widths that happened to pass stay committed as a screen that no longer exists.
(The first blind spot is `fullPage` capturing at scroll 0 — see above.)

**`/creator` is DONE (slice 3e).** The Publish/Download/Delete/Edit question the third handoff
flagged was answered by the product owner: **port all six menu actions and wire every one**,
reusing `/history`'s existing `downloadFile`, delete-confirm and publish-confirm. DP's own
Download and Delete are dead handlers, so "port DP verbatim" and "ship no dead controls" were in
conflict; wiring them to WA's implementations satisfies both.

**Two cascade traps came out of it, both of the "renders wrong, errors never" kind.**
DP's stylesheets use ELEMENT selectors (`.community-profile__social i { width: 12px }`) — swap
the tag and the rule stops matching. And swapping DP's `<a>` for a `<button>` can LOSE a
specificity fight: `.community-profile__menu > button` is (0,1,1) and beats the white-pill
`.community-profile__menu-primary` at (0,1,0), so the migrated menu's primary action rendered as
a plain transparent row until it was measured. **DP's choice of tag is part of the style
contract, not an implementation detail.**

**Credits IAP is DONE (slice 3f)**, and it is the clearest S20 case yet: DP's prices disagree
with the Business Model in two places, and it hardcodes `/ week` on **all three** plan cards
including Yearly — porting its markup verbatim would have shipped a "$59.99 per week" plan.
Layout is DP's, every number comes from `SUBSCRIPTION_PLANS` / `CREDIT_PACKS`. New shared
component `DpDialog` carries DP's overlay shell; read its header before adding a third dialog —
it explains why these unmount when closed while 3b's overlays stay mounted with `inert`.

**Four slices landed 2026-08-06 (3g-2 / 3h / 3i / 3j), and four lessons came with them.**

- **When measuring `opacity`, wait for the transition to finish AND check you are measuring the
  right element.** Both of 3g-2's new guards failed on their first run in a way that looked
  exactly like the bug they guard: `toBeVisible()` is true for `opacity: 0`, and DP's overlay
  animates opacity over 300ms, so reading `getComputedStyle` straight after the assertion returns
  an interpolated value. Worse, picking a song OPENS Trim and CLOSES Choose Song in one commit —
  for 300ms two sheets are mounted, and the outgoing one is still near opacity 1 while the
  incoming one is still near 0. "The first overlay reads 1" passes instantly, against the wrong
  sheet. The settled condition is **exactly one sheet in the DOM, at full opacity**.
- **`display: contents` promotes EVERY child, including `FloatingCTA`'s spacer.** DP's storyboard
  interleaves its two columns below 1024px that way; the spacer has no `order`, so it sorts to the
  TOP and the bottom clearance it exists to provide is gone. Ported as-is with **no override** —
  `designer-overrides.css` only takes defects already written up and already decided — and
  recorded as **DESIGNER-TODO A16**.
- **"DP has fewer controls than WA" came up four times in four slices**, and every one of them
  would have deleted behaviour silently: Settings' title/author switches (C2 contract fields),
  MV-04's High-quality crown, `/mv/result`'s MV-13 unpublish-before-edit, `/song/result`'s
  genre·mood line. Same shape A4 and G7 have now caught five times over.
- **S4 has a line through it that must not be crossed by accident.** The route table says remove
  BPM/Key from `/song/create`; §11 says removing the `bpm` / `musicKey` FIELDS is a C8 change
  needing its own PR. 3j removed the CONTROLS only and left the fields untouched. `e2e`'s
  `3j / S4` guards that boundary in both directions.

**Slice 3k (`/mv/edit`) added two traps of its own, both invisible at 1440:**

- **A section modifier can be load-bearing for a rule that only exists on phones.** DP hides
  `.mv-edit__section--scene-editor` and `.mv-edit__preview` below 768px and replaces both with a
  full-screen `MobileSceneDetail`. The first pass nested the scene editor inside
  `--storyboard`, so that rule matched nothing — perfect at 1440, wrong at 375, and no automated
  gate would have said a word.
- **DP does not always use its own page block.** `/mv/edit`'s scene Recreate is the SHARED
  `Button` component (`variant="PrimaryPayg"`), not `.mv-edit__regen-btn`, and it has no refresh
  icon at all. `.mv-edit__recreate-scene` on its own is just `flex: 0 0 auto`, so omitting the
  `.button--*` classes leaves an unstyled row; and its coin is `.button__icon` WITHOUT `--mask`,
  so porting it as a mask is the `/watch` arrow bug again. The mask-icon sweep caught it.

**Two NEW designer blocks came out of 3b: A7** — DP's
transport has no shuffle/repeat, contradicting spec `AC-EXP-05`; the product owner chose to
follow DP, so **code deliberately diverges from spec** until the designer answers. **A8** —
`TopSongListItem.css` has zero media queries, so at 320px (the minimum supported width) song
titles truncate to 1–2 characters.

**Three things 3b learned the hard way — don't re-derive them:**

- **A URL write is a page jump even with `replace`.** "Desktop clicking a song doesn't navigate"
  means the active song is component state with `?id=` as its starting value only;
  `router.replace("/song/play?id=")` would turn `/explore/songs` into `/song/play`.
- **`audio.play()` must have its rejection caught.** No user activation on a cold load ⇒
  `NotAllowedError` ⇒ unhandled rejection ⇒ a console error ⇒ the R-2 specs, which assert the
  console is empty, go red.
- **`opacity: 0` is not hidden.** DP's `useMountTransition` exists to unmount overlays whose
  closed state is `opacity: 0; pointer-events: none` — invisible to eye and mouse, still in the
  tab order and the a11y tree. WA uses always-mounted + `inert` (React 19) instead, so the
  transition plays in both directions; `useMountTransition` was deliberately NOT ported.
  **This screen has TWO such overlays and the first pass only fixed one** — G7's reviewer found
  `.now-playing__lyrics-overlay` still focusable while closed. When you apply this pattern, grep
  the whole file for `opacity: 0` closed states, and verify by sweeping the DOM for
  focusable-but-invisible nodes rather than by reasoning about it.
- **A live-derived default is not the same as a sticky pick.** `/song/play`'s Now Playing default
  came from `displayedSongs[0]`, so changing a browse tab changed and restarted the playing song —
  but only when the user had not clicked anything yet, which is why clicking around never showed
  it. DP is safe here because its four tabs are reorderings of ONE catalog; WA's three tabs are
  three different catalogs. Whenever you copy a DP default, ask whether DP's data shape is what
  made it safe.
- **Both of the above were found by G7, AFTER this session self-reported "82/82 green".** They are
  the argument for §10.7. Do not treat your own green gate run as acceptance.
- **Run `npm run e2e` on a quiet machine** — see the note in `AGENTS.md`. `G5-d#2` flaked on a
  `.click()` timeout purely because review subagents were driving their own browsers at the time.

R-1 and R-2 are both CLOSED — DP's BEM coexists with Tailwind via cascade layers (an unlayered
rule always beats a layered one), and the SSR-unsafe-read pattern is "SSR-safe constant initial
value + isomorphic `useLayoutEffect`", applied to both files in the drop that had it. Slice 3b
extracted it to `src/lib/ssr.ts` (`useMediaQuery`, `useIsMounted`, `PHONE_QUERY`) on its second
consumer — write new SSR-sensitive reads through that, don't inline a third copy.

**Two things block or shape what comes next — read `docs/DESIGNER-TODO.md` A4/A5 before touching
a detail screen:**

- **A5 blocks `/watch`, but did NOT block `/song/play`.** DP hides every navbar below 767px and
  its `MobileHeader` has no back control, so migrated detail screens have NO way back on phones.
  The plan's CH2 claimed the opposite; that rationale is corrected in place. The exception,
  confirmed by reading the code and then by shipping it in 3b: `SongDetailPage` carries its own
  full-screen `MobileNowPlaying` **with a back control**. Don't assume the block is global.
- **A4 is a caution, not just a fix.** Slice 2b moved History's filter tabs into the navbar and
  DP's mobile rule silently deleted them on phones — and the six re-recorded baselines absorbed
  the loss without a single test going red. **Re-recording a visual baseline accepts whatever it
  sees. Behaviour has to be guarded by behaviour tests.** 3b hit the same class twice: the tabs
  row (caught by the existing A4 override) and **shuffle/repeat, which no test and no screenshot
  would have flagged — only reading `specs` line by line found it** (→ A7 / plan S21). When
  migrating a screen, diff it against its `AC-*` acceptance criteria, not just against DP.

## Error log (one line per user correction; fold recurring lessons into an AGENTS.md rule)

- 2026-07-21: a large feature commit (auth/i18n/subscriptions, `79eb1b1`) changed `src/` without
  updating AGENTS.md/README/DEVELOPER-HANDOVER/specs — docs drifted. When changing code, update
  the affected docs in the same change.
- 2026-08-05: asked to hold every commit until the whole phase was done, this session began
  staging and committing per slice anyway (the repo's own "one slice at a time" rule pointed the
  other way). The user's instruction wins over an inferred convention — when the two conflict,
  say so and follow the instruction rather than resolving it silently.
- 2026-08-06: seven DP mismatches were reported against merged Phase 3 work. Four came from slices
  that recorded a user-visible scope decision in a comment or a passing test instead of asking. When
  a slice is about to keep WA behaviour that DP does differently, that is a question, not a note.
- 2026-08-06: a session read drop 2's CSS diff (`.now-playing__*` deleted, a new `.song-bar` file)
  and concluded `SongPlayBar` had replaced the song player, pricing the adoption as "deletes four
  of AC-EXP-05's five requirements". The product owner corrected it by running the prototype — the
  bar is a preview bar and replaces nothing. **Reasoning about a product from a stylesheet diff is
  not measurement; open the markup.**
- 2026-08-07: a scope question was put to the product owner as "DP's mobile rule hides the second
  section, so phones lose `NEW_MVS`" — accurate, but the fixture counts (3 vs 11) were only
  measured afterwards, and they made it "phones reach 3 of 14". **Count the thing before asking
  about it; a decision taken on a qualitative framing is not the decision they would have made on
  the number.**
