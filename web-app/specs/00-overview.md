# YouCam Muse Web — Spec Overview (READ FIRST)

> **Audience:** RD & QA taking `web-app/` toward production.
> **What this is:** the index + global-conventions doc for the per-area specs in `specs/areas/`.
> **Basis:** **as-built** — every spec describes what the current `web-app/` code actually does
> (code is the source of truth, per `AGENTS.md`), then flags divergences from the mobile
> **App Spec v3.0** and open questions for the product owner to resolve.
> **Not a parity contract.** The web build is a deliberate desktop-native redesign, not a 1:1 port.

---

## 0. How to read these specs

| Convention | Meaning |
|---|---|
| **Path ID** `MV-P1` | One user journey through an area. **Always area-qualified** (`MV-`, `SONG-`, `EXP-`, …) so IDs never collide across the 10 areas. |
| **Step ID** `MV-P1-S2` | A step within a path (screen state + user action + system response). |
| **Error ID** `MV-E1` | An error/edge branch within an area. |
| **AC** `AC-MV-01` | An EARS acceptance criterion (QA-testable), prefixed per area. |
| **TBD** `TBD-GL-01` / `TBD-MV-01` | A tracked open decision. `GL` = global (this doc §9); area-specific ones (`TBD-MV-*`) live in that area's §8. Each id is unique and stated **once**; other places cross-reference it. |
| ⚠️ **Divergence** | Web behaviour differs from App Spec v3.0 — intentional or drifted; each is flagged. |
| ❓ | Points at an open `TBD-*` decision inline. |
| 🔒 **Mock** | Backed by mock/seed data or in-memory state; not a real backend yet. |

**Single-source-of-truth rule (avoid the doc-drift this repo has already hit):** every fact and every
TBD is authoritative in exactly one place. The parity matrix (§8) owns divergence status; each area's
journeys own the behavioural detail; the TBD registers own open questions. Elsewhere, cross-reference
by id — don't restate.

**Screenshots are deferred** to a later "storyboard HTML" phase. Specs are behaviour-first and
diffable today; each path lists the route(s) to capture later. QA items marked *visual* (e.g. "purple
border", "progress 0→100") are **blocked until that phase** and tagged accordingly.

**Parity status vocabulary (§8):** **Ported** (matches app), **Adapted** (same intent, desktop
redesign), **Reduced** (subset of app), **Dropped** (deliberately absent), **spec-pending** (web
behaviour not yet documented — resolved when that area spec is written), **❓** (product-undecided →
a `TBD-*`). "spec-pending" and "❓" are different states: one is our backlog, the other needs the PO.

---

## 1. Site map — route inventory

All routes live under `src/app/[locale]/`. English (`enu`) is served **unprefixed** (`/mv/room`); other
locales are prefixed (`/jpn/mv/room`). "Auth" = wrapped in `<AuthGuard>` (§5).

| Route | View component | Area spec | Auth | App ref |
|---|---|---|---|---|
| `/` | `home/HomeView` | 04 explore-community | — | F02 |
| `/explore/mvs` | `community/MvExplore` | 04 | — | F14 |
| `/explore/songs` | `community/SongExplore` | 04 | — | F14 |
| `/watch` | `community/CommunityMvPlayer` (MV player) | 04 | — | F10 |
| `/song/play` | `community/CommunitySongPlayer` | 04 | — | F13 |
| `/creator` | `community/CreatorProfile` | 04 | — | F17 |
| `/mv/room` | `mv/MvRoom` | 02 mv-creation | 🔒 **Auth** | F03 |
| `/mv/thinking` | `mv/StoryboardGenerationScreen` | 02 | flow-guard | F06 |
| `/mv/storyboard` | `mv/StoryboardEditor` | 02 | flow-guard | F07 |
| `/mv/creating` | `mv/RenderGenerationScreen` | 02 | flow-guard | F08 |
| `/mv/result` | `mv/MvResult` | 02 | flow-guard | F08 |
| `/mv/edit` | `mv/MvEditor` | 02 | flow-guard | F09 |
| `/song/create` | `song/SongCompose` | 03 song-creation | 🔒 **Auth** | F11 |
| `/song/creating` | `song/SongGenerationScreen` | 03 | flow-guard | (web) |
| `/song/result` | `song/SongResultView` | 03 | flow-guard | F12 |
| `/history` | `history/HistoryView` | 05 history | 🔒 **Auth** | F15 |
| `/profile` | `profile/ProfileView` | 06 profile-account | 🔒 **Auth** | F16 |
| `/settings` | `profile/SettingsView` | 06 | — | F19 |
| `/proof` | `proof/ProofView` | 08 proof | — | F21 |
| `/share` | `share/ShareLinkView` | 10 share | **Public** (by design) | (web) |
| `/share/mv/[id]` | *(server redirect → `/share?id=…`; legacy route, no component)* | 10 | — | (web) |

**Modals / sheets (no route)** — specced inside the owning area:
- Credits/IAP: `SubscribeModal`, `BuyCreditsModal`, `CreditsDetailModal` → area 07 (F20)
- Auth: `SignInModal` → area 09 (F22)
- Account menu, Edit-profile → area 06 (F18)
- MV sheets: `ChooseSongModal`, `TrimAudioModal`, `FacePickerModal`, `SettingsModal`, `ModeModal`, Templates (inline modal) → area 02

---

## 2. App-shell & global chrome (detail → `areas/01-app-shell.md`)

- Desktop (≥640px, `sm:`): **left sidebar** nav + top bar (credits badge + account). Below 640px: **bottom tab bar**.
- Nav destinations, credits badge, and account menu are global; area specs assume the shell is present and don't re-describe it.

## 3. Responsive model

- **Code breakpoints:** only `sm:` (640px — bottom-bar → sidebar switch) and `lg:` (1024px — two-column layouts). No `md:`/`xl:`.
- **Review viewports (QA screenshots):** 390 / 768 / 1024 / 1440px.
- Every area spec's responsive AC checks these four widths for no overflow / no broken layout.

## 4. i18n 🔒

- 9 locales (product codes, not BCP-47): `enu jpn kor cht chs deu fra esp ptg`. `enu` default & unprefixed.
- Dictionaries cover **~40 keys (nav + Profile only)**; the 8 non-English files are intentionally empty stubs (English fallback per key). Everything else is hardcoded English JSX by current convention.
- Specs are authored in English; localization QA is out of scope here → `TBD-GL-06`.

## 5. Auth model 🔒

- `AuthProvider` + `authStore.ts`; logged-in boolean persists to `localStorage["muse_auth"]`. Subscription/plan/profile are **in-memory only** (reset on reload).
- `<AuthGuard>` wraps **exactly four route entries**: `/mv/room`, `/song/create`, `/history`, `/profile`. Logged-out → opens `SignInModal`; dismiss → Home.
- `/share` is **intentionally public** (`ShareLinkView` is not guarded) — recipients of a share link aren't signed in. (Intended gating to confirm → `TBD-GL-07`.)
- Downstream flow screens (`/mv/thinking…result`, `/song/creating…result`) are **not** individually guarded — they self-redirect to the flow entry when flow state is missing (flow-guard).
- ⚠️ **Divergence vs the old MV spec** (`mv-creation-flow.spec.md` "no login gate"): auth was added later (`79eb1b1`); the create-flow **entry is now gated**. This overview reflects current code.
- ⚠️ **Divergence vs App F22:** the app gates each *action* (Create/Like/Proof) individually; web gates by *route entry* only. Community like/share are ungated in web → `TBD-GL-02`.

## 6. Credits model 🔒

- `CreditsProvider`: single in-memory balance (`DEFAULT_CREDITS = 390`), `addCredits(n)`. Resets on reload. No balance gate anywhere (generation never blocks). Ledger in `CreditsDetailModal` is a static seed, not live.
- Costs in two places: `COST_STORYBOARD=20 / COST_RENDER=200 / COST_SONG=10` in `src/lib/mv/types.ts`; the Edit-MV costs `COST_REGEN=20 / COST_COVER=10 / COST_MERGE=10` are **hardcoded in `MvEditor.tsx`** (not centralized).
- ⚠️ **Divergence / code-vs-doc conflict:** `DEVELOPER-HANDOVER.md §6` says "nothing decrements the balance." **Not true as-built** — `MvEditor` decrements on Regenerate scene, Recreate cover, and Merge MV. The *primary* generation flow (storyboard/render/song) is display-only and does **not** decrement. Charging semantics → `TBD-GL-01`.
- App routes to IAP when credits are short; web never blocks. ⚠️ Divergence (→ `TBD-GL-01`).

## 7. Design tokens

- `src/styles/tokens.css` (synced from mobile Figma — **values never edited**). New semantic color = new token in `:root`. Specs reference token *names* (e.g. `--accent`), never hex.

---

## 8. App → Web parity matrix

| App F | App feature | Web status | Where |
|---|---|---|---|
| F01 | Splash & Onboarding | **Dropped** (no splash/onboarding route) → `TBD-GL-03` | 09 |
| F02 | Explore Home | **Adapted** 🔒 seed | 04 |
| F03 | AI MV Feature Room | **Adapted** (single-column + Trending aside; no MV-type intro carousel) | 02 |
| F03-2 | MV Output Settings | **Adapted** (Quality = Standard/High, no Pro gate) ⚠️ | 02 |
| F04-1 | Choose Song | **Reduced** (My/Sample tabs; no in-modal preview) | 02 |
| F04-2 | Trim Audio | **Adapted** (drag handles; **no 30s minimum**, no format/size limits) ⚠️ | 02 |
| F05 | Create Mode Selection | **Adapted** (centered modal, 2 cards) | 02 |
| F06 | Storyboard Generation | **Ported** 🔒 mock timing | 02 |
| F07 | Edit Storyboard | **Adapted** (visual style + scenes editable; story/lyrics read-only) | 02 |
| F08 | MV Generation + Result | **Adapted** (result = square stage + docked info panel) | 02 |
| F09 | Edit MV | **Adapted → sync App** (`TBD-MV-08`): regenerate overwrites directly, take/cover picker removed, no Save | 02 |
| F10 | MV Video Player | **Adapted** 🔒 seed | 04 |
| F11 | AI Song Feature Room | **Adapted** (Custom = chips; no BPM/Key) | 03 |
| F12 | Song Result & Lyrics | **Adapted** (no 30s gate; synced Lyrics sheet) | 03 |
| F13 | Song Player | **Adapted** 🔒 seed (simulated playback, no shuffle/repeat) | 04 |
| F14 | Community See-All | **Adapted** 🔒 seed | 04 |
| F15 | History (My Creations) | **Adapted** 🔒 in-memory | 05 |
| F16 | My Community Profile | **Adapted** (content grid at `/creator?self=1`, area 04) | 04/06 |
| F17 | Community User Profile | **Adapted** 🔒 seed | 04 |
| F18 | Account | **Adapted** (`/profile` row-hub) | 06 |
| F19 | Settings | **Adapted** (placeholder legal; demo Unsubscribe/Delete) | 06 |
| F20 | IAP Subscribe / Buy Credits | **Adapted** 🔒 no real payment | 07 |
| F21 | Proof of Creation | **Placeholder** (static stub; whole feature `TBD` in area 08) | 08 |
| F22 | Face Selector / Sign In / Trim | **Adapted** (manual-crop face picker) | 02, 09 |
| — | Curation ranking/moderation (Explore PRD) | **Not implemented** — logic is `TBD` (area 04) | 04 |
| — | Share link page | **Web-only addition** | 10 |

> **Decisions (2026-07-22):** most ⚠️ divergences above are now decided to **sync App**; a few are deferred (Phase 2) or kept as-is. See §9 (global) and each area §8 for the per-item resolution, and [`handoff.md`](handoff.md) for the codebase change list.

---

## 9. Global TBD register — RESOLVED 2026-07-22

Cross-cutting decisions. Area-specific TBDs live in each area spec's §8 (e.g. `TBD-MV-*`).
Codebase change list: [`handoff.md`](handoff.md).

| ID | Question | Decision (2026-07-22) |
|---|---|---|
| **TBD-GL-01** | Credit semantics — which CTAs spend credits; should an empty balance block? | ✅ **Sync App** — real credit charging on generation; when the balance is insufficient, the CTA routes to IAP (blocks generation). |
| **TBD-GL-02** | Auth granularity — route-entry vs action-level gating. | ✅ **Sync App** — action-level gating (Create MV / Create Song / Like / Get Proof trigger sign-in at the action). |
| **TBD-GL-03** | Onboarding / splash (App F01) — in scope or dropped? | ⏸ **Phase 2** — not in the web MVP; added to the Phase-2 todo (may be added later). |
| **TBD-GL-04** | Persistence — what survives reload in production. | ✅ **Sync App** — production persists state (history, storyboard, credits, subscription, profile) via the backend. Backend/RD work. |
| **TBD-GL-05** | Community / Curation — ranking + moderation (Explore PRD). | 📄 **Spec-only** — update spec only; **do NOT change codebase**. Backend integration by RD later. (Applies to every Curation item.) |
| **TBD-GL-06** | Localization QA — owned here or separate? | ✅ **Not owned here** — i18n uses the existing AI-generation mechanism (**"Sync YCO i18n method"**); localization QA is out of scope for these specs. |
| **TBD-GL-07** | `/share` gating — public or gated? | ✅ **Public** — `/share` stays public. |

---

## 10. Glossary

| Term | Meaning |
|---|---|
| Compose state | The MV form (`mvType`, `song`, `description`, `photos`, `settings`). |
| Job | An async generation unit (`queued → processing → done \| failed`), polled via `MuseApi`. |
| Storyboard-first / Direct | The two MV generation modes (review a storyboard first, vs render immediately). |
| Take | *(Legacy)* an alternate generated variant of a scene/cover in Edit MV. ⚠️ The pick-a-take UI is **removed** per `TBD-MV-08` — regenerate now overwrites directly; the mechanism is hidden/marked for a future version (see area 02). |
| Flow-guard | A mid-flow screen that redirects to its flow entry when in-memory state is missing. |
| `MuseApi` | The single typed backend boundary (`src/lib/api/contract.ts`); mock today, real client later. |

---

## 11. Changelog

| Date | Change |
|---|---|
| 2026-07-22 | Initial overview + area architecture (golden-sample phase). |
| 2026-07-22 | Senior-RD review applied: fixed `/share` (public, not gated) + removed non-existent `SharedMvView`; area-qualified ID scheme; global TBD register with stable ids; parity "spec-pending" vs ❓ split; single-source-of-truth rule; Edit-MV cost locations noted. |
| 2026-07-22 | Validator fix: `/settings` view path corrected to `profile/SettingsView` (was `account/SettingsView`). |
| 2026-07-22 | Final RD review fix: corrected 6 stale route-table component names (MvExplore, SongExplore, CommunityMvPlayer, CommunitySongPlayer, CreatorProfile, SongResultView) to match code. |
| 2026-07-22 | PM decisions round: §9 global register resolved; each area §8 now carries per-area decisions; codebase changes captured in `handoff.md`. |
| 2026-07-23 | §A + §B implemented in `web-app/src/`. Global items: GL-01 real credit charging (flow providers decrement on generation start, refund on failure) with an insufficient-balance → IAP route at the CTAs; GL-02/EXP-02 action-level auth gating. Per-area as-built in each area §10; three reconciliation flags (Merge cost, plan pricing, legal URLs) in `handoff.md`. |
