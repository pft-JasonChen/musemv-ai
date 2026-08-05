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

**Where it is up to (2026-08-05).** Phases 0 / 1 / 1.5 / 2a / 2b are done, and Phase 3's first
screen (`/explore/mvs`) has landed. The new UI covers the global shell, `/history`, and
`/explore/mvs`. `OWN_CHROME` in `src/components/shell/AppShell.tsx` is the honest ledger of what
has migrated — 2 of the 16 routes in plan §2.1.

**Next is Slice 3b (`/explore/songs` + `/song/play`) and its pre-flight is already done** —
read "3b 的 pre-flight" in plan §4 Phase 3 before writing anything. It carries four decisions
taken 2026-08-05 (S3 lands here and inverts half of G5-d#7; audio URLs are derived in the
presentation layer like 3a's `ratio`, keeping C2 at zero diff; the mobile full-screen player
moves from `history.pushState` to `router.push` + `navHistory.ts`; DP's fake `Trending` tab is
dropped) and a hazard the earlier pre-flight missed: DP calls
`createPortal(…, document.body)` unconditionally during render, which **fails the build**, not
just hydration.

R-1 and R-2 are both CLOSED — DP's BEM coexists with Tailwind via cascade layers (an unlayered
rule always beats a layered one), and the SSR-unsafe-read pattern is "SSR-safe constant initial
value + isomorphic `useLayoutEffect`", now applied to both files in the drop that had it.

**Two things block or shape what comes next — read `docs/DESIGNER-TODO.md` A4/A5 before touching
a detail screen:**

- **A5 blocks `/watch`, but NOT `/song/play`.** DP hides every navbar below 767px and its
  `MobileHeader` has no back control, so migrated detail screens have NO way back on phones. The
  plan's CH2 claimed the opposite; that rationale is corrected in place. The exception, confirmed
  by reading the code: `SongDetailPage` ships its own full-screen `MobileNowPlaying` **with a back
  control**, so Slice 3b is unblocked — don't re-derive this and don't assume the block is global.
- **A4 is a caution, not just a fix.** Slice 2b moved History's filter tabs into the navbar and
  DP's mobile rule silently deleted them on phones — and the six re-recorded baselines absorbed
  the loss without a single test going red. **Re-recording a visual baseline accepts whatever it
  sees. Behaviour has to be guarded by behaviour tests.**

## Error log (one line per user correction; fold recurring lessons into an AGENTS.md rule)

- 2026-07-21: a large feature commit (auth/i18n/subscriptions, `79eb1b1`) changed `src/` without
  updating AGENTS.md/README/DEVELOPER-HANDOVER/specs — docs drifted. When changing code, update
  the affected docs in the same change.
