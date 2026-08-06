# Phase 3 acceptance — gates G5-b and G7 (2026-08-06)

> **What this is.** The independent-review record for the designer-UI migration's last eight
> slices (3e / 3f / 3g / 3g-2 / 3h / 3i / 3j / 3k). Plan §10.7 forbids the session that built a
> slice from certifying it, so every verdict below comes from a reviewer working in its own
> context, with its own measurements. **The build session's own gate runs are not acceptance** —
> they appear at the bottom as supporting evidence only.
>
> **Reading rule.** A criterion with no evidence is **NO EVIDENCE**, never PASS. Several are, and
> they are listed as such rather than quietly rounded up.

---

## 1. What was reviewed, and by whom

| Review              | Scope                                                                      | Method                                                                                                        |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **G5-b — design**   | V1–V6, six-width WA-vs-DP comparison                                       | Opened all 116 WA and 42 DP screenshots as images, weighted to 320/375, cropping and pixel-sampling as needed |
| **G7 — affordance** | B1–B3, control-by-control diff against `5296f1a` (pre-Phase-3) / `6a82ace` | Read the git diff of every migrated component; read the code for each product rule                            |
| **G7 — a11y**       | A1–A5, live axe + keyboard/focus at 375 **and** 1440                       | **RAN, THEN DISCARDED — its environment was broken. See §6. Still owed.**                                     |

Criteria: `CRITERIA.md` in the evidence pack. Evidence: 116 WA states + 42 DP references at
320 / 375 / 768 / 1024 / 1440 / 1920.

**The three reviewers are not interchangeable and their coverage does not overlap.** The design
review explicitly could not judge A1–A5 or the dynamic half of B1–B3 from stills; the affordance
review opened no screenshots at all. Where both were silent, the criterion is NO EVIDENCE.

---

## 2. Verdicts

| Criterion                                                                     | Verdict                      | Source                                                               |
| ----------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| **V1** no horizontal overflow @320/375                                        | **PASS**                     | design — 40 reviewed 320/375 states                                  |
| **V2** no illegible truncation @320/375                                       | **PASS**                     | design (A8 excluded as already-recorded)                             |
| **V3** no clipped / overlapped / unreachable                                  | **FAIL** — 1 new             | design — `/creator` at 768                                           |
| **V4** layout matches DP where a twin exists                                  | **PARTIAL**                  | design PASS on 3g/3h/3i/3j/3k; **3e has no usable DP twin** (see §4) |
| **V5** no off-palette / unstyled control                                      | **PASS**                     | design — its one FAIL was a harness artefact (§4)                    |
| **V6** empty / loading / disabled states                                      | **PASS**                     | design                                                               |
| **A1** WCAG AA contrast                                                       | **NOT RUN**                  | a11y                                                                 |
| **A2** keyboard reach + visible focus ring                                    | **NOT RUN**                  | a11y (design: NO EVIDENCE from stills)                               |
| **A3** dialog role / name / Escape / tab order                                | **NOT RUN**                  | a11y                                                                 |
| **A4** icons actually paint                                                   | **NOT RUN**                  | a11y (design's one FAIL was a harness artefact)                      |
| **A5** touch targets ≥24×24, count did not grow                               | **NOT RUN**                  | a11y                                                                 |
| **B1** no control silently lost vs pre-migration                              | **FAIL** — 1 high, 5 med/low | affordance                                                           |
| **B2** no dead controls                                                       | **FAIL** — 1                 | affordance                                                           |
| **B3** product rules preserved (S2, GL-01, MV-12, MV-13, MV-08, SONG-03, R-9) | **PASS**, all seven          | affordance                                                           |

**B3 is the one to be glad about.** Every rule the migration was told to protect survived,
including S2's 30-second trim floor — and the reviewer checked that its guard test asserts the
enabled state _first_, so it can actually fail.

---

## 3. Findings

Ranked as the reviewers ranked them. **None of these is a product rule (B3) — they are affordances
and labels**, which is precisely the class the automated gates cannot see.

| ID        | Sev  | Status  | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3i-1**  | HIGH | FIXED   | **The finished MV can no longer be un-muted.** `5296f1a`'s `MvDetail` used `<video controls>`, so the native bar carried volume. `MvResult.tsx:193` hardcodes `muted` with no state behind it and the hand-built bar has only play/pause, times, seek, fullscreen — the audio of a ~200-credit render is unreachable. `MvEditor.tsx:145/437` got this right on the sibling screen. DP is also muted-with-no-toggle, so this is "ported DP verbatim, lost a WA affordance". |
| **3g2-1** | MED  | FIXED   | **Settings' Cancel and Confirm are the same action.** `SettingsModal.tsx:68` passes `onConfirm: onClose`, and `MvSheet.tsx:124-138` wires Cancel to `onClose` too. Settings commit on touch, so Cancel cancels nothing. **New with the migration** — the pre-migration `Modal` had no Cancel at all.                                                                                                                                                                       |
| **3g-3**  | MED  | FIXED   | **"My Creations" over community fixtures.** `MvRoom.tsx:557` and `SongCompose.tsx:364` title the rail "My Creations" when logged in, but render `NEW_MVS` / `TOP_PICKS_SONGS` with other creators' names as the subtitle. Both routes are auth-guarded, so the mislabelled branch is the one nearly every user sees. Pre-migration `TrendingMvsPanel` was honestly titled "Trending from community".                                                                       |
| **3j-1**  | MED  | TODO 7a | **Song Result lost ±15s, leaving no keyboard seek at all.** The transport slots went to prev/next track, and `.song-result__progress` is a bare `<div onPointerDown>`. `useAudioPlayer.nudge` still exists, now unused here.                                                                                                                                                                                                                                               |
| **3g-1**  | MED  | TODO 7h | **MV Room's disabled CTA lost its reason line** ("Add a song and a description to continue."). Not a DP-fidelity constraint — `SongCompose.tsx:362` kept its equivalent inside migrated markup, using a DP class.                                                                                                                                                                                                                                                          |
| **3k-1**  | MED  | FIXED   | **MV Edit lost the on-screen MV-08 warning** ("Edits aren't saved — Merge MV re-renders…"). The rule is still enforced; only its explanation is gone, and Merge is disabled with no stated reason.                                                                                                                                                                                                                                                                         |
| **3e-1**  | MED  | A18     | **Share is unreachable at ≤767px on a profile you do not own.** `CommunityProfilePage.css:57` hides the Share icon below 768px and the only other Share is inside the owner-gated menu. Pre-migration it lived in the always-rendered More menu.                                                                                                                                                                                                                           |
| **3e-2**  | MED  | A17     | **`/creator` rows collide at 768px.** `.community-profile__social` has no `overflow`/`min-width` constraint (unlike the sibling `__copy > strong`), so a 2–3 digit share count spills into `.community-profile__actions`. Absent at 1024 (room) and below 768 (different layout). Verified in `wa/3e-creator-768.png`.                                                                                                                                                     |
| **3i-2**  | MED  | TODO 7a | **Two new keyboard-inoperable seek bars** (`MvResult.tsx:215`, `MvEditor.tsx:421`), both bare `<div onPointerDown>`. `TODO.md` #5 records this class but scopes itself to slice 3b. On `/mv/result` it is a regression — the pre-migration `<video controls>` was keyboard-seekable.                                                                                                                                                                                       |
| **3g2-2** | LOW  | TODO 7b | Face Picker's explicit **Cancel** is gone. Dismissal survives three other ways (header Close, backdrop, Escape), so nobody is stranded; it is the undocumented part that is the finding.                                                                                                                                                                                                                                                                                   |
| **3g-2**  | LOW  | TODO 7c | **"Change song" survives as a control but not as an affordance** — the explicit `Change` button became a label whose only accessible name is the noun "Song Library" / "Imported Audio".                                                                                                                                                                                                                                                                                   |

### Also noted, outside the criteria

- `src/components/community/TrendingMvsPanel.tsx` is **dead code** — zero consumers since 3g.
- `HistoryView.tsx` builds unprefixed `rowHref`s (clicks are intercepted, so only middle-click /
  copy-link lose the locale prefix) and `SettingsView.tsx:170` does `router.push("/")`. Out of the
  migration's scope, but the same R-9 shape.
- `ChooseSongModal.tsx:138` — the new row-preview is `onClick` on a role-less `<div>`: pointer-only.
  A new control, not a regression.
- `SongCreatePage.css:1089` hides Song Result's Download and volume/mute below 1024px. Both are new
  controls, so nothing was lost — but the autoplaying result has no volume control on phones.

---

## 4. Two design findings that did NOT survive verification

Recorded because a reviewer reported them in good faith and the build session checked rather than
accepted — the check is the point.

- **Face Picker rendering as a flat maroon block at all six widths was a CAPTURE ARTEFACT, not a
  defect.** The evidence script drove the upload with a 1×1 PNG test fixture, so the preview was
  faithfully showing a single stretched pixel. Re-captured against a real
  `Sample_P1.jpg`: the photo, the framing square and the size slider all render correctly. The
  reviewer flagged the possibility itself and asked for exactly this re-run before treating it as
  shipped — which is why it cost minutes instead of a bug hunt.
- **`3e-creator` has no usable DP reference at any width.** Every DP `3e-creator-*.png` is DP's
  sign-in wall, so the V4 structural PASS the design review recorded for 3e is not supported by
  its cited evidence. V4 for 3e is **NO EVIDENCE**; the other five slices' V4 verdicts stand.

**And one gap in the evidence pack itself, found by the reviewers:** slice 3f had no screenshots at
all when the review started, and the first re-capture produced `3f-buy-credits-*` shots that are
really `SubscribeModal` — CR-06 gates credit packs behind a subscription and the mock user is not
subscribed. Both were re-captured (`3f-credits-detail`, `3f-buy-credits`, `3f-subscribe`, plus
`3f-buy-credits-subscribed` driven through an actual subscribe), and the pack UI is now on record.

---

## 5. Supporting evidence — the build session's own gate runs

Not acceptance. Listed so the numbers are on the same page as the verdicts.

| Gate                                        | Result                            |
| ------------------------------------------- | --------------------------------- |
| `typecheck` / `lint` / `test:run` / `build` | all exit 0; vitest 84/84          |
| `guard-greps.sh`, incl. the raw-hex ratchet | pass                              |
| `check-designer-css.mjs`                    | pass — 33 files byte-identical    |
| `check-rd-changelog.sh` (G4-g)              | pass                              |
| `npm run e2e`                               | 154/154 (+4 new guards)           |
| `npm run e2e:visual`                        | 115/115 (24 `-linux` re-recorded) |
| C1–C8 contract diff `5296f1a..HEAD`         | **empty** — see `CHANGELOG-RD.md` |

**What that table is worth is the point of this document.** Every gate above was green while
eleven affordance findings were sitting in the code, one of them a paid deliverable losing its
audio. The gates protect the contract and the rules; they have never protected the affordances.

---

## 6. The a11y leg ran, and its result was thrown away. Read this before re-running it.

**A1–A5 are NOT RUN.** An audit did run — axe plus DOM sweeps at 375 and 1440 across all 24
states — and it produced a long, confident, specific report. It was discarded in full, because
the page it measured was missing its stylesheet.

**How it surfaced.** Its headline finding was `.mv-song-picker__use` painted at `opacity: 0` yet
still focusable — exactly the trap A2 names, and entirely plausible. Verifying it, the pill
measured `opacity: 1` on a row that was neither hovered nor active, which contradicted both the
finding and the CSS source. That contradiction is the only reason any of this was caught.

**What was actually wrong.** The page requested a CSS chunk that returned **500**. The missing
file was the **238 KB designer stylesheet** — every `.mv-*`, `.song-*`, `.upgrade-dialog__*`
rule in the product. The server had been started at 08:25 and something rebuilt `.next`
underneath it at 08:46; `next start` reads its manifest once at boot, so it kept requesting a
chunk the rebuild had deleted. The audit's two runs finished at 08:43 and 08:46 — inside that
window. So every contrast ratio, every touch-target measurement and the A2 finding describe a
barely-styled DOM.

On a correct build the pill reads `opacity: 0` by default and `1` once Tab moves focus into the
row, at both widths. The finding does not reproduce.

**Two of its findings did survive**, because they are DOM-level and a missing stylesheet cannot
fake them, and both are fixed: `.mv-edit__scene-versions` carried an `aria-label` on a bare
`<div>` (role `generic` prohibits it, so the name was dropped from the accessibility tree), and
`.mv-storyboard__lyrics` scrolled with no keyboard way in.

**Before re-running, prove the CSS loads and say so in the report.** Fetch the page, extract
every `_next/static/chunks/*.css` it references, and confirm each returns 200 with a non-trivial
body — one must be ~238 KB. A cheap live assertion works too: `.mv-song-picker__use` must
compute to `opacity: 0` on a row that is neither hovered nor active. **And never run
`npm run build` against a running `next start`** — rebuild and restart together.

**The general lesson, which is not about a11y.** A reviewer measuring a broken environment does
not return an error. It returns findings — plausible, specific, and wrong — and the more
thorough it is, the more convincing the wrongness. The environment has to be proven before the
measurements mean anything, and the reviewer is not the one who can prove it.

---

## 7. What is still owed — the verification that has NOT been done

Phase 3's code is merged. This list is the honest remainder, so nobody reads a green gate table
as a finished audit. Ordered by what would change a decision soonest.

### 7.1 Blocking a real a11y sign-off

| #   | Owed                                                                                                                                                                                                                                                       | Why it is not done                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **A1–A5, re-run on a sound build.** axe + keyboard/focus at 375 and 1440 across all 24 states.                                                                                                                                                             | The run that happened measured a page with no designer stylesheet (§6). Everything it said about contrast, touch targets and focusability has to be re-measured, not re-read. **Prove the CSS loads first and say so in the report.** |
| 2   | **Whether A10's 20×20 count GREW.**                                                                                                                                                                                                                        | Same discarded run. The product owner's decision that DP's 20×20 controls stay is not in question; whether the migration added more of them is unmeasured.                                                                            |
| 3   | **A manual keyboard / screen-reader pass.** Tab ORDER (not just reachability) through `/mv/edit`'s scene strip and the storyboard's repeated inputs; AT behaviour during the `MvSheet` / `DpDialog` fade-out; focus-ring legibility against accent purple. | axe and DOM sweeps cannot see any of it. Flagged rather than skipped.                                                                                                                                                                 |

### 7.2 Gaps in the evidence, not in the code

| #   | Owed                                                                                                     | Why it is not done                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | **A DP reference for `/creator` at any width.**                                                          | Every captured DP `3e-creator-*.png` is DP's sign-in wall. V4 for 3e is NO EVIDENCE until DP is driven past its login.                                                                              |
| 5   | **DP twins for the six `/mv/room` sheets, the three credit dialogs, and the song stages past the form.** | DP has no equivalent screen for most of these. Where it does, nobody has captured it. Those states were reviewed standalone against V1/V2/V3/V5/V6 only.                                            |
| 6   | **A11y and visual coverage of the 8 non-English locale trees.**                                          | `e2e/a11y.spec.ts` and every visual baseline walk the unprefixed English tree only. A non-English-only regression is invisible to all of it — and R-9's whole failure mode is "perfect in English". |

### 7.3 Standing gate blind spots (known, unfixed, not caused by this work)

| #   | Owed                                                                                                                                                                                | Tracked as   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 7   | `e2e/a11y.spec.ts` sets no viewport, so mobile-only chrome has never been scanned.                                                                                                  | `TODO.md` #6 |
| 8   | `e2e/a11y.spec.ts` seeds no auth, so four guarded routes show axe only the sign-in modal.                                                                                           | `AGENTS.md`  |
| 9   | The visual baseline captures `fullPage` at scroll 0, so nothing scroll-dependent (blur, scroll shadows, sticky stacking) can ever diff.                                             | `AGENTS.md`  |
| 10  | `maxDiffPixelRatio` is a share of PAGE AREA, so a fixed-size control can vanish on wide viewports without failing. Measured: a 64×22 pill failed at 320/375 and passed at 768–1920. | `AGENTS.md`  |
| 11  | The `-darwin` baselines are unmaintained on purpose and will fail on a Mac.                                                                                                         | `README.md`  |

### 7.4 Behaviour that has no test at all

| #   | Owed                                                                                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12  | The five affordance findings left open (`TODO.md` #7a–7h) have no guard, by construction — a guard would assert behaviour nobody has decided on yet. When each is answered, it needs a behaviour test, because A4's lesson is that re-recording a screenshot absorbs the loss silently. |
| 13  | `/mv/creating` and `/share` are deliberately old UI and are not covered by any migration guard. If either is migrated later, they need adding to the mask-icon sweep in `e2e/behaviour-regressions.spec.ts`.                                                                            |
