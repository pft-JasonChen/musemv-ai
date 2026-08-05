@AGENTS.md

## In flight — read before starting

**The designer-UI migration is live.** The package landed 2026-08-04 and is vendored at
`../designer-prototype/` (DP). Read in this order:

1. **`docs/redesign-migration-plan.md`** — the **plan of record**. §1 is what was decided and
   why; §2 is scope; §3 is the nine open items; §4 is the phase/slice order. R-1…R-9 and the
   S1–S20 spec differences are **answered here** — earlier documents state them as open.
2. **`docs/UI-INTEGRATION-HANDOFF.md`** — still the best orientation to what the gates catch
   and how the three prototypes differ (§0 and §2). Its §5 decision queue is now closed.
3. `docs/redesign-migration-plan-2026-08-01.md` — background and derivation only. Its §9
   (RD contract C1–C8) and §10 (gates G1–G7) remain in force; its judgements do not.

**Where it is up to (2026-08-05).** Phases 0 / 1 / 1.5 / 2a / 2b are done, and Phase 3 has landed
both `/explore/mvs` (3a) and `/explore/songs` + `/song/play` (3b — one merged two-column screen
plus a mobile full-screen player). `OWN_CHROME` in `src/components/shell/AppShell.tsx` is the
honest ledger of what has migrated — 4 of the 16 routes in plan §2.1.

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

**Next is `/creator`** — but it is on the A5 list too, so decide the back-control question before
starting it rather than at the end.

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
