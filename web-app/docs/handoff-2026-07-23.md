# Codebase Handoff — Spec Decisions Round (2026-07-22)

> **中文摘要:** 這是 2026-07-22 PM 決策後,要在**新的 session 修改 codebase** 的變更清單。本輪只改了
> spec(未動 code)。下方 §A 是「現在就能在前端 prototype 做」的項目、§B 是 bug、§C 只補 spec 不動 code、
> §D 後端待做、§E Phase 2 延後、§F 仍待議。每項附上規格出處與大致檔案位置。
>
> **Audience:** the session that will modify `web-app/src/`. **Source:** the decisions recorded in each
> `specs/areas/*.md` §8 and `specs/00-overview.md` §9. Full context per item is in those specs.
>
> **Guardrails (from `AGENTS.md`) — keep these:** no backend / DB / `fetch()` in `src` (mock only);
> never edit token *values* in `src/styles/tokens.css`; commit with explicit `git add <paths>`;
> Definition-of-done = `typecheck && lint && test:run && build` all green; ask before adding deps or
> touching the design system. Update the affected spec/docs in the same change.

**Scope counts:** §A ~23 frontend changes · §B 5 bugs · §C spec-only (Curation) · §D backend-deferred · §E Phase 2 · §F still-open.

> **Implementation status (2026-07-23):** All of **§A** and **§B** are now implemented in `web-app/src/`
> (typecheck / lint / test / build green). §C–§F remain untouched as intended. Three reconciliation
> decisions were made where a value wasn't specified — **RD please confirm:**
> 1. **Merge MV cost** — with GL-01 charging the render on generation start, the editor's old local
>    `COST_MERGE` (10) would have double-charged. Merge is now the re-render priced at `COST_RENDER`
>    (200), consistent with the other two render entry points. (Folds in `TBD-MV-10`.)
> 2. **Muse Pro plan credits/prices** (CR-02) — Weekly $9.99 / Monthly $29.99 / Yearly $199.99, all on
>    an 800 weekly-credit allowance (`WEEKLY_CREDITS` in `lib/user.ts`); exact prices/credits are
>    placeholders.
> 3. **Terms/Privacy URLs** (PROF-06/AUTH-03) — wired to `lib/legal.ts` (`youcam.com/legal/*`
>    placeholders); swap for the real production URLs.

> **Note on IDs:** item tags below drop the `TBD-` prefix for brevity — `[MV-08]` ≡ `TBD-MV-08`. Grep either form; the full `TBD-…` ids live in each area spec's §8.

---

## §A. Frontend changes to implement now (in the prototype / mock)

These are frontend-doable without a real backend (use the existing mock/providers). File pointers are
starting points, not exhaustive.

### Global
- **[GL-02 + EXP-02] Action-level auth gating.** Move from route-entry gating to gating at the action,
  matching App F22: Create MV / Create Song / **Like** / **Get Proof** trigger sign-in *at the action*.
  Unify the inconsistency (Home gates at click via `requireLogin`; `SongExplore` create does not).
  Touch: like/share/publish/proof actions in `components/community/*` (`CommunityMvPlayer`,
  `CommunitySongPlayer`), `components/mv/MvDetail.tsx`, `components/history/HistoryView.tsx`,
  `components/community/SongExplore.tsx`. Decide with RD whether to keep `AuthGuard` on create-flow
  entries as a backstop. Spec: overview §5, area 09.
- **[GL-01] Real credit charging + insufficient-balance block.** On generation start, decrement the
  balance (`useCredits().addCredits(-cost)`); when balance < cost, route the CTA to IAP instead of
  generating. Touch: `providers/MvFlowProvider.tsx` (`startStoryboard`/`startRender`),
  `providers/SongFlowProvider.tsx` (`startSong`), CTA guards in `mv/ModeModal.tsx`, `mv/MvRoom.tsx`,
  `song/SongCompose.tsx`. Costs in `lib/mv/types.ts`. Spec: overview §6, area 02/03/07.

### Shell (area 01)
- **[SHELL-01] Brand → "YouCam Muse".** Replace the "MuseMV.ai" / "MuseMV" wordmark everywhere:
  `shell/Sidebar.tsx`, `shell/TopBar.tsx`, `share/ShareLinkView.tsx`, `auth/SignInModal.tsx`
  ("Sign in to MuseMV"), `proof/ProofView.tsx` ("MuseMV.ai · Verified Creation"). `grep -rn "MuseMV" src`.
- **[SHELL-03] Account menu rows.** Add **Notifications** + **Send Feedback** rows to
  `account/AccountMenu.tsx` (UI only; real wiring is §D PROF-01/02).

### MV creation (area 02)
- **[MV-01] Trim ≥30s.** `mv/TrimAudioModal.tsx` — enforce a minimum selection of 30s (and ≥ the MV's
  required length); disable "Use Trimmed Audio" until satisfied.
- **[MV-02] Import validation.** `mv/MvRoom.tsx` `importAudio` — accept only MP3/AAC/WAV/M4A and ≤50MB;
  reject others with an error toast.
- **[MV-04] "High" quality Pro-gate.** `mv/SettingsModal.tsx` — greyed + crown on free plan; tap → IAP.
- **[MV-11] Choose Song empty state.** `mv/ChooseSongModal.tsx` — My Songs empty → "You haven't created
  any songs yet" + a Create Song shortcut.
- **[MV-08] Edit MV rework — app-consistent (SUPERSEDES the earlier "keep the take tray" note).**
  `mv/MvEditor.tsx` — **remove Save** (no Project mode; edits ephemeral, lost on leaving `/mv/edit`);
  **Regenerate scene / Recreate cover overwrite directly** (no "pick which take/cover" trays, no undo);
  keep **Merge MV** as the re-render, enabled by any pending edit. **Hide + code-mark** the removed
  take-tray / cover-variant / Save mechanisms (comment so RD knows what they were; **do not delete** —
  we'll develop toward that richer version later).
- **[MV-12] MV result publish confirm.** `mv/MvDetail.tsx` — toggling **Publish on** opens a
  **"Ready to Go Public?" confirm** (reuse History's existing dialog); confirm → Published · pending review.
- **[MV-13] Published → "Unpublish to edit MV".** While an MV is published / in-review, the **Edit MV**
  button is neutral (white bg / black text) labeled **"Unpublish to edit MV"** (string optimizable);
  tapping unpublishes, then it becomes the active accent **"Edit MV"**. Apply on `mv/MvDetail.tsx`
  (result) **and** `history/HistoryView.tsx` (the Edit MV entry).

### Song creation (area 03)
- **[SONG-01] Custom-mode controls.** `song/SongCompose.tsx` — add BPM slider + Key selector +
  per-line lyrics editor (Genre picker exists). May extend `SongComposeSchema` in `lib/api/schemas.ts`.
- **[SONG-02] 30s free-preview gate.** Free users limited to 30s; Pro unlocks full playback.
  `song/SongDetail.tsx` (+ `audio/useAudioPlayer` range) and mirror on `community/CommunitySongPlayer.tsx`.
- **[SONG-03] Recreate = 50 credits + keep prior.** `song/SongResultView.tsx` recreate → charge 50,
  keep the previous song in History.
- **[SONG-04] Enhance cost.** First Enhance per session free, then 1 credit each. `ui/EnhanceButton` +
  the `enhancePrompt` call sites.

### Explore & community (area 04)
- **[EXP-04] Song-player parity.** `community/CommunitySongPlayer.tsx` — add shuffle/repeat, the 30s
  free gate (see SONG-02), and community-vs-own playlist modes. (Note: this player is currently a
  simulated timer with no real `<audio>` — real playback likely pairs with §D.)
- **[EXP-06] Empty / not-found states.** Community views — empty-rail + not-found + offline states with
  App-style copy ("Be the first to create!").

### History (area 05)
- **[HIST-02] Retention → permanent.** `history/HistoryView.tsx` — creations are **never auto-deleted**;
  update/remove the "kept for 14 days" note (share-**link** expiry is a separate concept — §D SHARE-01).
- **[HIST-03] Liked tab = community-liked only.** `history/HistoryView.tsx` filter — restrict Liked to
  community-liked content (not any liked own-row).
- **[HIST-05] Storyboard "Create" pill.** `history/HistoryView.tsx` — surface Create as a row pill on
  Storyboard rows, not (only) a `⋯`-menu CTA.
- **[HIST-04] Publish confirm (frontend).** Keep the "Ready to Go Public?" confirm; the actual
  review→feed pipeline is §C (Curation).

### Profile / account / settings (area 06)
- **[PROF-03] Sign Out into Settings.** Move Sign Out from `profile/ProfileView.tsx` into
  `profile/SettingsView.tsx`; reach `/settings` via the (gated) account, and gate `/settings`.
- **[PROF-06 + AUTH-03] Wire Terms/Privacy links.** `profile/SettingsView.tsx` (placeholder modals) and
  `auth/SignInModal.tsx` (inert spans) → real localized URLs. Same link set for both.

### Credits / IAP (area 07)
- **[CR-02] Plan restructure.** `lib/user.ts` `SUBSCRIPTION_PLANS` → Weekly / Monthly / Yearly; add the
  "800 Weekly Credits" header + 6-feature list in `credits/SubscribeModal.tsx`. (Reconcile the current
  weekly/super/yearly set.)
- **[CR-03] Credit lifecycle copy.** Purchased credits never expire (fix `credits/BuyCreditsModal.tsx`
  "expire after 12 months"); subscription credits reset per cycle.
- **[CR-05] Restore Purchases + already-Pro.** `credits/SubscribeModal.tsx` — add a "Restore Purchases"
  action and an "You're already on Muse Pro" state.

---

## §B. Bugs to fix (RD)

| ID | Area | Fix | Where |
|---|---|---|---|
| TBD-EXP-09 | Explore | Creator Songs-tab plays the wrong track — `cps-*` ids aren't in `ALL_COMMUNITY_SONGS`. Fix the playlist/lookup (or include CREATOR_SONGS). | `lib/mv/community.ts` (`ALL_COMMUNITY_SONGS`), `community/CommunitySongPlayer.tsx:26` |
| TBD-MV-09 | MV | Generation screens hang at 0% when a storyboard is hydrated but `gen` is idle (reload). Add a guard/kick-off. | `mv/StoryboardGenerationScreen.tsx`, `mv/RenderGenerationScreen.tsx` |
| ~~TBD-MV-10~~ | MV | **Folded into the Edit-MV rework (§A [MV-08])** — with Save removed, Merge is enabled by any edit; no separate fix needed. | `mv/MvEditor.tsx` |
| TBD-HIST-06 | History | Failed row should be Delete-only (currently also shows Like + Share). | `history/HistoryView.tsx:~339-355` |
| TBD-SONG-05 | Song | Compose credit pill is hardcoded `390`; use the live balance. | `song/SongCompose.tsx:46` (`useCredits`) |
| TBD-SHELL-04 | Shell | Pre-hydration logged-out→in header flash; gate the header on `hydrated`. | `shell/HeaderActions.tsx` |

---

## §C. Spec-only — do NOT change codebase now (Curation / backend track)

Per `TBD-GL-05`: update spec only; RD implements the backend later. No prototype change now.

- **[EXP-01]** 4-rail curation scoring / eligibility / refresh / dedup (Explore Curation PRD).
- **[EXP-07]** Publish→feed + AI/human moderation queue + admin pin/unpin (Explore Curation PRD).
- **[MV-06] / [HIST-04]** the publish→community *review pipeline* (frontend confirm stays; pipeline deferred).
- **[HIST-07 / EXP-10] Publish→feed locale ranking.** On publish, the creation carries a **language/locale
  code**; the backend returns each feed **already ranked locale-primary** — the frontend just requests the
  sorted data ("we only ask; the backend sorts"). When publish becomes real, add the locale to the publish
  payload (a small frontend hook). The **code format (2- vs 3-char) is RD-TBD** (`TBD-EXP-10`, ties `TBD-GL-06`).

---

## §D. Backend / RD-deferred (documented target; not a prototype change)

Real backend work; the prototype keeps its mock. Behaviour documented in the specs.

- **[GL-04]** Production persistence (history, storyboard, credits, subscription, profile).
- **[CR-01]** Real IAP (App Store / Play Store). **[CR-04]** Live credit ledger.
- **[AUTH-01]** Real auth integration (provider, session/token).
- **[PROF-01]** Notifications wiring. **[PROF-02]** Feedback endpoint. **[PROF-04]** Real Unsubscribe +
  account Delete. **[PROF-05]** Real stats source.
- **[SHARE-01]** Server-side share resolution + real expiry.
- **[EXP-08]** Real like/share/play counters + gating persistence.
- **[SONG-06]** Production song-failure trigger.

---

## §E. Phase 2 — deferred (add to the Phase-2 todo)

- **[GL-03]** Onboarding / Splash — not in web MVP; may add later.
- **[MV-03]** Multi-face auto-detect — keep manual crop for MVP.
- **[PROOF-01/02/03/04]** Proof of Creation — the whole feature is out of the web MVP.

---

## §F. Still open — needs a decision / design before build

Not ready to implement; flagged for follow-up.

- **[MV-07]** MV-type intro / Style-Picker — awaiting the **designer's guideline + UX flow**.
- **[SONG-07]** Supported-language list for lyric generation.
- **[EXP-03]** MV-player 9:16↔3:4 toggle + swipe-up feed.
- **[EXP-05]** Real multi-creator data + Report/Block.
- **[AUTH-04]** Detailed **web** guest-browsing / gating spec (a web access matrix — not a straight App copy).
- **[SHARE-02]** Web social-channel set (differs from app). **[SHARE-03]** Share-link analytics — decided to do it; details TBD.

---

## Notes for the implementer

- **i18n (`TBD-GL-06`):** localization is handled by the existing AI-generation mechanism —
  "**Sync YCO i18n method**". Don't hand-fill the empty dictionaries.
- **Terms/Privacy links** appear twice (PROF-06 + AUTH-03) — same localized URL set; wire once, reuse.
- **Brand rename** is a plain string swap, not a token change — safe to do directly.
- Every ✅ item's authoritative detail lives in the matching `specs/areas/*.md` (§8 decision + the
  as-built description above it). Update the spec's as-built text as you land each change.

| Date | Change |
|---|---|
| 2026-07-22 | Initial handoff from the PM decisions round. |
| 2026-07-22 | Round 2: permanent history retention; MV result publish confirm (MV-12); published→"Unpublish to edit MV" (MV-13); Edit-MV rework — no Save, regenerate overwrites, hide+mark take/Save mechanisms (MV-08, supersedes prior); publish→feed locale ranking + code-format TBD (HIST-07/EXP-10). |
| 2026-07-23 | **Implemented §A + §B in the codebase.** See per-area spec §10 changelogs for as-built details and the three reconciliation flags above (Merge cost, plan pricing, legal URLs). |
