# CHANGELOG-RD

Changes to the **RD contract surface** only — the interfaces RD codes against, listed as
C1–C8 in `redesign-migration-plan-2026-08-01.md` §9. Nothing else belongs here: UI, styling,
copy, and internal refactors are out of scope no matter how large.

`scripts/check-rd-changelog.sh` (Gate G4-g) fails any change that touches C1–C8 without
adding an entry here. If your edit was a comment or a reformat, say exactly that — the
required output is an explicit statement that you looked, not paperwork.

**Newest first.** One entry per change, with the surface, what moved, and what RD must do.

| Surface | What it is                                                                        | May change?       |
| ------- | --------------------------------------------------------------------------------- | ----------------- |
| C1      | `src/lib/api/contract.ts` — the `MuseApi` interface                               | ❌ frozen         |
| C2      | `src/lib/api/schemas.ts` — Zod = wire contract                                    | ❌ frozen         |
| C3      | `src/lib/api/index.ts` — the one-line backend swap point                          | ❌ frozen         |
| C4      | `useAuth` / `useCredits` / `useHistory` / `useMvFlow` / `useSongFlow` return keys | ⚠️ additive only  |
| C5      | `src/lib/authStore.ts` — `localStorage["muse_auth"]`                              | ⚠️ independent PR |
| C6      | `src/lib/i18n/config.ts` + `src/middleware.ts` — locale model                     | ⚠️ independent PR |
| C7      | `src/app/**/page.tsx` — URL shapes                                                | ⚠️ independent PR |
| C8      | `src/lib/mv/types.ts` — `COST_*`, `DEFAULT_SETTINGS`, `isComposeReady`            | ⚠️ additive only  |

---

## 2026-08-06 — C4 gains two setters, additively. Everything else: unchanged.

**Surface:** **C4** (`useMvFlow`, `useSongFlow` return keys). **Additive only — nothing renamed,
nothing removed.**

| Hook          | New key         | Type                                           |
| ------------- | --------------- | ---------------------------------------------- |
| `useMvFlow`   | `setResultUrl`  | `Dispatch<SetStateAction<string \| null>>`     |
| `useSongFlow` | `setSongResult` | `Dispatch<SetStateAction<SongResult \| null>>` |

**Why.** `/history`'s done MV/song rows used to open a modal; they now navigate to `/mv/result` /
`/song/result`, which is what DP does. Both result screens render from the live MV/Song flow and
guard back to their flow entry when it is empty, so a row has to write its artifact into the flow
before navigating — the same seed-then-navigate the storyboard rows already used. These two
setters are that write. `setCompose` / `setStoryboard` were already exposed for exactly this
reason; these complete the pair.

**What RD must do: nothing.** No wire format, no endpoint, no cost constant changed. When the real
history endpoint lands (`TBD-GL-04`), the seeding in `src/components/history/useOpenCreation.ts` is
the one place that fabricates a result from a history row, and it is where a real fetch belongs.

**Everything else is unchanged, and that was checked rather than assumed:**

| Surface | Path                                          | Diff                                                                                                                                                                               |
| ------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1      | `src/lib/api/contract.ts`                     | none                                                                                                                                                                               |
| C2      | `src/lib/api/schemas.ts`                      | none                                                                                                                                                                               |
| C3      | `src/lib/api/index.ts`                        | none                                                                                                                                                                               |
| C4      | `src/components/providers/**`                 | **+2 keys, additive** (above)                                                                                                                                                      |
| C5      | `src/lib/authStore.ts`                        | none                                                                                                                                                                               |
| C6      | `src/lib/i18n/config.ts`, `src/middleware.ts` | none                                                                                                                                                                               |
| C7      | every `src/app/**/page.tsx`                   | **URL shapes unchanged**; two pages gained a `<Suspense>` wrapper because their view now reads `?id=`. `?id=` is optional on both — omitted, the screens behave exactly as before. |
| C8      | `src/lib/mv/types.ts`                         | none                                                                                                                                                                               |

`providers.surface.test.ts` (G4-b) is green: the add-only baseline test passes untouched, and the
shape snapshot was re-recorded with the two additions.

---

## 2026-08-06 — Phase 3 finished (16 of 16 routes). **C1–C8 diff for RD purposes: ZERO.**

**Surface:** none. This entry exists because the migration was large enough that "no contract
change" is itself the thing RD needs stated, not assumed.

**What happened:** the whole designer-UI migration landed — slices 3a…3k, every route in the
plan's §2.1 table. Eleven screens were rewritten, six overlays replaced, four shared components
added (`MvSheet`, `TemplateSheet`, `useDialogTransition`, `DpIcon`'s `as` prop).

**Verified, not asserted.** `git diff 5296f1a..HEAD` is EMPTY for every gated surface:

| Surface | Path                                                             | Diff |
| ------- | ---------------------------------------------------------------- | ---- |
| C1      | `src/lib/api/contract.ts`                                        | none |
| C2      | `src/lib/api/schemas.ts`                                         | none |
| C3      | `src/lib/api/index.ts`                                           | none |
| C4      | `src/components/providers/**` (hook return keys)                 | none |
| C5      | `src/lib/authStore.ts`                                           | none |
| C6      | `src/lib/i18n/config.ts`, `src/middleware.ts`                    | none |
| C7      | every `src/app/**/page.tsx` (URL shapes)                         | none |
| C8      | `src/lib/mv/types.ts` (`COST_*`, `DEFAULT_SETTINGS`, predicates) | none |

Reproduce it yourself:

```bash
git diff --stat 5296f1a HEAD -- src/lib/api src/lib/authStore.ts src/lib/i18n/config.ts \
  src/middleware.ts src/lib/mv/types.ts src/components/providers 'src/app'
```

**The one `src/lib` file that DID change is `src/lib/user.ts`** (+123/−17, slice 3f) — the
`SUBSCRIPTION_PLANS` / `CREDIT_PACKS` data. It is not a gated surface, but it is where the
Business Model's prices and credit grants live, so RD should read it before wiring real IAP.
The designer prototype's own markup disagreed with the Business Model in two places and
hardcoded `/ week` on all three plan cards including Yearly; WA renders every number from this
file instead, which is why it grew.

**Still owed to RD as its own PR, deliberately NOT done here:** S4's removal of `bpm` /
`musicKey` from `SongCompose`. §11 requires a C8 change to travel alone. Slice 3j removed the
Tempo and Key CONTROLS from `/song/create` and left the FIELDS untouched, still carrying
`DEFAULT_SONG_COMPOSE`'s values into every request. `e2e`'s `3j / S4` guards that boundary in
both directions.

---

## 2026-08-05 — `/explore/songs` and `/song/play` now render one shared view; **URL shapes unchanged**

**Surface:** C7 (`src/app/[locale]/explore/songs/page.tsx`, `src/app/[locale]/song/play/page.tsx`).

**Change:** both files were rewritten to render the same component
(`src/components/song/SongDetailView`, wrapped in `<Suspense>`) instead of two separate views.
**Nothing about either URL moved:** both routes still exist, both still accept the same query
parameters (`?id=`, and `?tab=` on the explore side), and no path, segment, or parameter name
changed. **C7 diff for RD purposes: zero.**

**Why it looks like a contract change and is not.** The designer's `SongDetailPage` is a
two-column screen — song list on the left, Now Playing on the right, sharing one `<audio>` — and
at ≥1024px CSS makes those columns an exact 1:1 split. Migrating "the list" and "the player" as
separate screens would leave half of a 1440px viewport empty. So one view now serves both URLs.

**Keeping both `page.tsx` files was the specific reason this approach was chosen** over merging
them into a single route: every link RD or anyone else has pointing at either URL keeps working,
and this gate stays at zero diff. If we had merged the routes, this entry would be reporting a
breaking change instead.

**Also in this change, and explicitly NOT contract surface:**

- Song audio URLs are derived per id in `src/lib/mv/community.ts` (`songAudioUrl`). **`CommunitySongSchema` (C2) gained no `audio` field** — same discipline as `mvCoverRatio` in the
  previous slice. When the real API grows an `audio` field, that function is the single place to
  replace. Until then the whole catalog maps onto the two demo mp3s.
- The 30s free-playback cap is gone from this screen (product decision S1/S3). No API, cost, or
  entitlement constant moved: `src/lib/mv/types.ts` (C8) and `src/lib/api/**` (C1–C3) are
  untouched in this change — verified by `git diff`.

**RD action required:** none. No interface, schema, cost, locale, or URL changed.

**Notified:** recorded here; flag at the next sync if any of you deep-link `/song/play` with
query parameters beyond `?id=`, since that is the one thing this screen now reads more of.

---

## 2026-08-04 — Phase 1 token swap; no contract change, but ONE thing you must not drop

**Surface:** the gate flagged `src/app/globals.css` and `src/app/layout.tsx` because they sit
under `src/app/**`. **Neither is a `page.tsx`, so no URL shape moved — C7 is unchanged, and so
are C1–C6 and C8.** Stating that explicitly is the point of this entry.

**What changed:** `src/styles/tokens.css` is now the DESIGNER's token file, copied wholesale from
`designer-prototype/` and replaced wholesale on every drop. WA's previous token names did not
disappear — they moved to the new `src/styles/token-aliases.css`, frozen at their existing values,
and shrink as screens migrate. Stylesheet load order is now
`tokens -> token-aliases -> tailwind -> designer`. Six breakpoints replaced the old two.

**The one thing to carry:** the root layout now sets **`<html data-theme="dark">`**, and it is
load-bearing, not cosmetic. The designer's token file ships light AND dark, and its `:root` block
is the LIGHT one. If you rebuild or replace the root layout and drop that attribute, every
`--color-*` silently resolves to its light value while the app still paints dark surfaces from the
alias layer. It presents as a random CSS bug with no error anywhere. Keep the attribute.

**RD action required:** none for C1–C8. Just don't drop `data-theme="dark"` when you touch the
root layout, and don't hand-edit `tokens.css` — a value you change there is lost at the next
designer drop. WA-specific semantic names belong in `token-aliases.css`.

**Verified by:** Phase 1's acceptance is "old screens unchanged", checked two independent ways and
both zero: **G2-b** computed-style census, 19 routes x 4 widths, 17,704 element samples, diff = 0;
**G2-c** pixel diff, 114 screenshots across 6 widths, 0 differing. Plus typecheck / lint /
test:run (76) / build and 47 e2e green.

## 2026-08-02 (b) — docs corrected to match code; no contract change

**Surface:** C9 (`docs/DEVELOPER-HANDOVER.md`) — documentation only. **C1–C8 unchanged.**

**Change:** §6 was materially wrong and RD reads it as the source of truth:

- It said **"Credits are display-only … nothing in the codebase subtracts them"**. False —
  generation charges on job start and refunds from the poll's `onError` (GL-01). Replaced with a
  cost/charge/refund table.
- The plan table listed a **non-existent `super` plan** and wrong prices for `weekly` ($9.99, real
  $19.99) and `yearly` ($69.99, real $59.99). Replaced with the real three tiers + SKUs.
- Added where the insufficient-balance guard actually lives: **`MvRoom.selectMode()`** for both MV
  modes, `SongCompose` / `SongResultView` for song. Reading only `MvFlowProvider` makes it look
  absent (it charges unconditionally) — that misreading cost us a wrong finding during this pass.

**Why:** the redesign migration is UI-only and must be zero-diff to RD, but the written contract had
already drifted from the code. A wrong doc is as dangerous as a wrong interface.

**RD action required:** re-read §6 if you built anything against the old credits text. Nothing in
C1–C8 moved, so no code changes on your side.

**Verified by:** `e2e/behaviour-regressions.spec.ts` (46 e2e tests, all green) now proves the charge
amounts, the refund, and the insufficient-balance routing. `.claude/hooks/stop-verify.sh` runs it.

## 2026-08-02 — baseline established, no contract change

The C1–C8 surface was frozen into snapshot tests. **Nothing RD depends on moved.**

- Added `src/lib/api/contract.surface.test.ts` — freezes C1, C2, C3, C5, C6, C7, C8.
- Added `src/components/providers/providers.surface.test.ts` — freezes C4 (additive-only).
- Added `scripts/check-rd-changelog.sh` — Gate G4-g, this file's enforcement.
- Both tests run inside `npm run test:run`, which `.claude/hooks/stop-verify.sh` already
  gates on, so a contract break now fails before a session can report done.

**RD action required:** none. But please confirm the C1–C8 list in §9 is actually everything
you depend on — the gate is only as good as that list. Anything missing, tell us and we add it.

Recorded baseline at this point:

- `MuseApi`: `createMvJob`, `createSongJob`, `enhancePrompt`, `getMvJob`, `getSongJob`, `renderMvJob`
- `LOCALES`: `enu jpn kor cht chs deu fra esp ptg` (9), English unprefixed
- Costs: `COST_STORYBOARD 20` · `COST_RENDER 200` · `COST_SONG 10` · `COST_SONG_RECREATE 50`
- Auth: `localStorage["muse_auth"]`
- Routes: 20 under `/[locale]`

<!-- Template — copy for the next entry:

## YYYY-MM-DD — <one-line summary>

**Surface:** C_ (<file>)
**Change:** <before → after>
**Why:** <reason; link the decision if there is one>
**RD action required:** <exactly what they must do, or "none">
**Notified:** <who, when, where>
-->
