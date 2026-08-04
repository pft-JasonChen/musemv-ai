# CHANGELOG-RD

Changes to the **RD contract surface** only — the interfaces RD codes against, listed as
C1–C8 in `redesign-migration-plan-2026-08-01.md` §9. Nothing else belongs here: UI, styling,
copy, and internal refactors are out of scope no matter how large.

`scripts/check-rd-changelog.sh` (Gate G4-g) fails any change that touches C1–C8 without
adding an entry here. If your edit was a comment or a reformat, say exactly that — the
required output is an explicit statement that you looked, not paperwork.

**Newest first.** One entry per change, with the surface, what moved, and what RD must do.

| Surface | What it is | May change? |
|---|---|---|
| C1 | `src/lib/api/contract.ts` — the `MuseApi` interface | ❌ frozen |
| C2 | `src/lib/api/schemas.ts` — Zod = wire contract | ❌ frozen |
| C3 | `src/lib/api/index.ts` — the one-line backend swap point | ❌ frozen |
| C4 | `useAuth` / `useCredits` / `useHistory` / `useMvFlow` / `useSongFlow` return keys | ⚠️ additive only |
| C5 | `src/lib/authStore.ts` — `localStorage["muse_auth"]` | ⚠️ independent PR |
| C6 | `src/lib/i18n/config.ts` + `src/middleware.ts` — locale model | ⚠️ independent PR |
| C7 | `src/app/**/page.tsx` — URL shapes | ⚠️ independent PR |
| C8 | `src/lib/mv/types.ts` — `COST_*`, `DEFAULT_SETTINGS`, `isComposeReady` | ⚠️ additive only |

---

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
