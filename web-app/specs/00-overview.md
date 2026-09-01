# YouCam Muse Web — Spec Overview (READ FIRST)

> **Audience:** RD & QA taking `web-app/` toward production.
> **What this is:** the index + global-conventions doc for the per-area specs in `specs/areas/`.
> **Basis:** **as-built** — every spec describes what the current `web-app/` code actually does
> (code is the source of truth, per `AGENTS.md`), then flags divergences from the mobile
> **App Spec v3.0** and open questions for the product owner to resolve.
> **Not a parity contract.** The web build is a deliberate desktop-native redesign, not a 1:1 port.
>
> **Designer-UI migration status (2026-08-06): complete, 16 of 16 routes.** Every screen described
> here now renders the designer prototype's markup and stylesheets, except `/mv/creating` and
> `/share`, which were deliberately left on the old UI. Where a UI slice deliberately diverged from
> a criterion below, the criterion is **annotated in place rather than rewritten away** — look for
> ⚠️ in areas 02, 03 and 07. Change log for RD: `../docs/CHANGELOG-RD.md`; the migration's own
> record: `../docs/archive/redesign-migration-plan.md`.

---

## 0. How to read these specs

| Convention                        | Meaning                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Path ID** `MV-P1`               | One user journey through an area. **Always area-qualified** (`MV-`, `SONG-`, `EXP-`, …) so IDs never collide across the 10 areas.                                                     |
| **Step ID** `MV-P1-S2`            | A step within a path (screen state + user action + system response).                                                                                                                  |
| **Error ID** `MV-E1`              | An error/edge branch within an area.                                                                                                                                                  |
| **AC** `AC-MV-01`                 | An EARS acceptance criterion (QA-testable), prefixed per area.                                                                                                                        |
| **TBD** `TBD-GL-01` / `TBD-MV-01` | A tracked open decision. `GL` = global (this doc §9); area-specific ones (`TBD-MV-*`) live in that area's §8. Each id is unique and stated **once**; other places cross-reference it. |
| ⚠️ **Divergence**                 | Web behaviour differs from App Spec v3.0 — intentional or drifted; each is flagged.                                                                                                   |
| ❓                                | Points at an open `TBD-*` decision inline.                                                                                                                                            |
| 🔒 **Mock**                       | Backed by mock/seed data or in-memory state; not a real backend yet.                                                                                                                  |

**Single-source-of-truth rule (avoid the doc-drift this repo has already hit):** every fact and every
TBD is authoritative in exactly one place. The parity matrix (§8) owns divergence status; each area's
journeys own the behavioural detail; the TBD registers own open questions. Elsewhere, cross-reference
by id — don't restate.

**Screenshots are deferred** to a later "storyboard HTML" phase. Specs are behaviour-first and
diffable today; each path lists the route(s) to capture later. QA items marked _visual_ (e.g. "purple
border", "progress 0→100") are **blocked until that phase** and tagged accordingly.

**Parity status vocabulary (§8):** **Ported** (matches app), **Adapted** (same intent, desktop
redesign), **Reduced** (subset of app), **Dropped** (deliberately absent), **spec-pending** (web
behaviour not yet documented — resolved when that area spec is written), **❓** (product-undecided →
a `TBD-*`). "spec-pending" and "❓" are different states: one is our backlog, the other needs the PO.

---

## 1. Site map — route inventory

All routes live under `src/app/[locale]/`. English (`enu`) is served **unprefixed** (`/mv/room`); other
locales are prefixed (`/jpn/mv/room`). "Auth" = wrapped in `<AuthGuard>` (§5).

| Route            | View component                                                  | Area spec            | Auth                   | App ref |
| ---------------- | --------------------------------------------------------------- | -------------------- | ---------------------- | ------- |
| `/`              | `home/HomeView`                                                 | 04 explore-community | —                      | F02     |
| `/explore/mvs`   | `community/MvExplore`                                           | 04                   | —                      | F14     |
| `/explore/songs` | `song/SongDetailView`                                           | 04                   | —                      | F14     |
| `/watch`         | `community/CommunityMvPlayer` (MV player)                       | 04                   | —                      | F10     |
| `/song/play`     | `song/SongDetailView` (same view as `/explore/songs`)           | 04                   | —                      | F13     |
| `/creator`       | `community/CreatorProfile`                                      | 04                   | —                      | F17     |
| `/mv/room`       | `mv/MvRoom`                                                     | 02 mv-creation       | 🔒 **Auth**            | F03     |
| `/mv/thinking`   | `mv/StoryboardGenerationScreen`                                 | 02                   | flow-guard             | F06     |
| `/mv/storyboard` | `mv/StoryboardEditor`                                           | 02                   | flow-guard             | F07     |
| `/mv/creating`   | `mv/RenderGenerationScreen`                                     | 02                   | flow-guard             | F08     |
| `/mv/result`     | `mv/MvResult`                                                   | 02                   | flow-guard             | F08     |
| `/mv/edit`       | `mv/MvEditor`                                                   | 02                   | flow-guard             | F09     |
| `/song/create`   | `song/SongCompose`                                              | 03 song-creation     | 🔒 **Auth**            | F11     |
| `/song/creating` | `song/SongGenerationScreen`                                     | 03                   | flow-guard             | (web)   |
| `/song/result`   | `song/SongResultView`                                           | 03                   | flow-guard             | F12     |
| `/history`       | `history/HistoryView`                                           | 05 history           | 🔒 **Auth**            | F15     |
| `/profile`       | `profile/ProfileView`                                           | 06 profile-account   | 🔒 **Auth**            | F16     |
| `/settings`      | `profile/SettingsView`                                          | 06                   | 🔒 **Auth**            | F19     |
| `/share`         | `share/ShareLinkView`                                           | 10 share             | **Public** (by design) | (web)   |
| `/share/mv/[id]` | _(server redirect → `/share?id=…`; legacy route, no component)_ | 10                   | —                      | (web)   |

**Modals / sheets (no route)** — specced inside the owning area:

- Credits/IAP: `SubscribeModal`, `BuyCreditsModal` (modals) + `/profile/credits` `CreditsView` (route) → area 07 (F20)
- Auth: `SignInModal` → area 09 (F22)
- Account menu, Edit-profile → area 06 (F18)
- MV sheets: `ChooseSongModal`, `TrimAudioModal`, `FacePickerModal`, `SettingsModal`, `ModeModal`, Templates (inline modal) → area 02

**Surfaces with no route AND no UI** — specced because RD implements them, not because anything renders:

- Notification emails (5 types: verification, welcome, MV done, storyboard done, subscription
  confirmation) → **area 12** (`areas/12-notifications-email.md`, `MAIL-*` / `TBD-MAIL-*`). Backend
  only — the prototype has no mail capability at all, so there is nothing here for QA to click.
  _(Added 2026-09-01.)_

---

## 2. App-shell & global chrome (detail → `areas/01-app-shell.md`)

- Desktop (≥768px): **left sidebar** nav + top bar (credits badge + account). Below 768px: **bottom tab bar**.
  _(Was 640px/`sm:`. The designer-UI migration moved the phone cutover to 767px — see `AppShell.tsx` and `designer/AppLayout.css:96`. Corrected 2026-08-19 from code.)_
- Nav destinations, credits badge, and account menu are global; area specs assume the shell is present and don't re-describe it.

## 3. Responsive model

- **Code breakpoints:** six tiers — 320 / 375 / 768 / 1024 / 1440 / 1920. `md:` (768px) carries the sidebar switch, `lg:` (1024px) the two-column layouts. 320px is the minimum supported width and has no query of its own.
  _(Corrected 2026-08-19 from code: `designer-overrides.css` uses 768px throughout; the old "only sm:/lg:" line predates the designer-UI migration. The other file this cited, `TopBar.tsx`, was deleted 2026-08-27 — see area 01 §1 point 5.)_
- **Review viewports (QA screenshots):** 390 / 768 / 1024 / 1440px.
- Every area spec's responsive AC checks these four widths for no overflow / no broken layout.

## 4. i18n 🔒

- 9 locales (product codes, not BCP-47): `enu jpn kor cht chs deu fra esp ptg`. `enu` default & unprefixed.
- Dictionaries cover **~40 keys (nav + Profile only)**; the 8 non-English files are intentionally empty stubs (English fallback per key). Everything else is hardcoded English JSX by current convention.
- Specs are authored in English; localization QA is out of scope here → `TBD-GL-06` _(registered in `OPEN-QUESTIONS.md` on 2026-08-19 — it had only ever existed in this sentence)_.

## 5. Auth model 🔒

- `AuthProvider` + `authStore.ts`; logged-in boolean persists to `localStorage["muse_auth"]`. Subscription/plan/profile are **in-memory only** (reset on reload).
- `<AuthGuard>` wraps **four route entries**: `/history`, `/profile`, `/profile/credits`, and (since PROF-03, 2026-07-23) `/settings`. Logged-out → opens `SignInModal`; dismiss → Home.
  _(Corrected 2026-08-19 from code. `/mv/room` lost its guard 2026-08-07 and `/song/create` on 2026-08-12 — both `page.tsx` files carry an explicit "No `AuthGuard` here on purpose" comment. `/profile/credits` was guarded all along but never listed.)_
- **Action-level gating (GL-02, 2026-07-23):** the primary create/social actions now call `requireLogin` **at the action** — Create MV / Create Song / Like on community surfaces and publish on an MV result — synced to App F22. For the two **create** routes this is now the ONLY layer — their route guards were deliberately removed so guests can see the screen and are gated at the Create button (`AC-AUTH-08`). The other four routes still gate at both layers.
- `/share` is **intentionally public** (`ShareLinkView` is not guarded) — recipients of a share link aren't signed in. (Intended gating to confirm → `TBD-GL-07` — _registered in `OPEN-QUESTIONS.md` on 2026-08-19, same omission_.)
- Downstream flow screens (`/mv/thinking…result`, `/song/creating…result`) are **not** individually guarded — they self-redirect to the flow entry when flow state is missing (flow-guard).

## 6. Credits model 🔒

- `CreditsProvider`: single in-memory balance (`DEFAULT_CREDITS = 10`, overridable for a demo via `NEXT_PUBLIC_DEMO_CREDITS`) and `addCredits(n)`. Resets on reload; the ledger on `/profile/credits` is a static seed, not live.
  _(Corrected 2026-08-19 from code: the balance dropped 390→10 on 2026-08-12 (`TBD-CR-06a`), and `enhanceCost`/`consumeEnhance` were removed the same day when AI Enhance became free.)_
- **Real charging (GL-01, 2026-07-23):** the MV/song **flow providers** decrement on generation start and **refund on failure**. Constants in `src/lib/mv/types.ts`: `COST_STORYBOARD=20`, `COST_RENDER=200`, `COST_SONG_VOCAL=6` / `COST_SONG_INSTRUMENTAL=12` (song recreate is priced the same as a first render, `songRecreateCost = songCost`); Edit-MV charges its micro-ops `COST_REGEN=20` / `COST_COVER=4` in `MvEditor.tsx`. The former `COST_MERGE` was removed — Merge MV is the re-render priced at `COST_RENDER`.
  _(Corrected 2026-08-19 from code: `COST_SONG=10` was split into vocal 6 / instrumental 12, `COST_SONG_RECREATE=50` was replaced, and `COST_COVER` went 10→4 — all on 2026-08-12.)_
  > ⚠️ **`COST_STORYBOARD` / `COST_RENDER` / `COST_REGEN` are still placeholders and do NOT match `areas/11-credit-consumption.md`**, which prices these per-second and per-tier (e.g. a 30s singing/1080p render should be 225, not a flat 200). **11 is the authority; the code has not been brought up to it**, blocked on `TBD-CC-06`. Do not "reconcile" spec 11 down to these three numbers.
- **Backend charging contract → `areas/11-credit-consumption.md`.** The prototype's `COST_*` constants are
  **placeholders**; the real charge is the MSR Credit Consume Form (`credit_consume: 1.0`), where each
  generation posts a main action + `subActions` and the backend sums the matching rules. Area 11 is the
  RD-facing action map; the prototype numbers below are what the demo does today (`TBD-CC-05`).
- **Insufficient-balance gate:** when `credits < cost`, the CTA **routes to the buy-credits IAP instead of generating** (`MvRoom` mode select, `SongCompose`, `StoryboardEditor`, `MvEditor` merge, `SongResultView` recreate) — synced to the app. Real persistence / live ledger / real IAP stay backend-deferred (`TBD-GL-04`, `TBD-CR-01/04`).

## 7. Design tokens

- `src/styles/tokens.css` (synced from mobile Figma — **values never edited**). New semantic color = new token in `:root`. Specs reference token _names_ (e.g. `--accent`), never hex.

---

## 8. App → Web parity matrix

| App F | App feature                               | Web status                                                                                                                                                                                                                                              | Where  |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| F01   | Splash & Onboarding                       | **Dropped** (no splash/onboarding route) → `TBD-GL-03`                                                                                                                                                                                                  | 09     |
| F02   | Explore Home                              | **Adapted** 🔒 seed                                                                                                                                                                                                                                     | 04     |
| F03   | AI MV Feature Room                        | **Adapted** (single-column + Trending aside; no MV-type intro carousel)                                                                                                                                                                                 | 02     |
| F03-2 | MV Output Settings                        | **Adapted → sync App** — Quality = Standard/High; **High is Pro-gated** (MV-04)                                                                                                                                                                         | 02     |
| F04-1 | Choose Song                               | **Reduced** (My/Sample tabs; no in-modal preview)                                                                                                                                                                                                       | 02     |
| F04-2 | Trim Audio                                | **Adapted → sync App** — drag handles; **≥30s minimum** (MV-01); import limited to MP3/AAC/WAV/M4A ≤50MB (MV-02)                                                                                                                                        | 02     |
| F05   | Create Mode Selection                     | **Adapted** (centered modal, 2 cards)                                                                                                                                                                                                                   | 02     |
| F06   | Storyboard Generation                     | **Ported** 🔒 mock timing                                                                                                                                                                                                                               | 02     |
| F07   | Edit Storyboard                           | **Adapted** (visual style + scenes editable; story/lyrics read-only)                                                                                                                                                                                    | 02     |
| F08   | MV Generation + Result                    | **Adapted** (result = square stage + docked info panel)                                                                                                                                                                                                 | 02     |
| F09   | Edit MV                                   | **Adapted → sync App** (`TBD-MV-08`): regenerate overwrites directly, take/cover picker removed, no Save. The `LEGACY_TAKE_TRAY_UI` flag that hid the old trays was deleted in the migration — see area 02 MV-P5                                        | 02     |
| F10   | MV Video Player                           | **Adapted** 🔒 seed                                                                                                                                                                                                                                     | 04     |
| F11   | AI Song Feature Room                      | **Adapted** — Lyrics/Idea is a free-form textarea (SONG-01). ⚠️ The BPM slider + Key selector were **removed** by the designer-UI migration (plan S4, 2026-08-06); the `bpm`/`key` fields remain on the contract — area 03 §1                           | 03     |
| F12   | Song Result & Lyrics                      | **Adapted** — synced Lyrics sheet; player over a **My Creations** playlist. ⚠️ The **30s free-preview gate is cancelled** (S3), so SONG-02 no longer describes either player screen — area 03 §1                                                        | 03     |
| F13   | Song Player                               | **Adapted** 🔒 seed — real `<audio>`, **no 30s gate** (S3 landed 2026-08-05). ⚠️ shuffle/repeat **removed** by the designer-UI migration, still an open divergence from AC-EXP-05 — `DESIGNER-TODO.md` A7 / plan S21                                    | 04     |
| F14   | Community See-All                         | **Adapted** 🔒 seed                                                                                                                                                                                                                                     | 04     |
| F15   | History (My Creations)                    | **Adapted** 🔒 in-memory                                                                                                                                                                                                                                | 05     |
| F16   | My Community Profile                      | **Adapted** (content grid at `/creator?self=1`, area 04)                                                                                                                                                                                                | 04/06  |
| F17   | Community User Profile                    | **Adapted** 🔒 seed                                                                                                                                                                                                                                     | 04     |
| F18   | Account                                   | **Adapted** (`/profile` row-hub)                                                                                                                                                                                                                        | 06     |
| F19   | Settings                                  | **Adapted → sync App** — real Terms/Privacy links; **Sign Out moved here** (gated route, PROF-03); demo Unsubscribe/Delete                                                                                                                              | 06     |
| F20   | IAP Subscribe / Buy Credits               | **Pricing finalized (Business Model 2026-07-13)** 🔒 no real payment — Weekly $19.99/200 · Weekly Pro $29.99/1,000 (default) · Yearly $59.99/2,000; packs 300–8,000; **credits subscriber-only**; Restore Purchases; already-Pro state (CR-02/03/05/06) | 07     |
| F21   | Proof of Creation                         | **Removed 2026-07-24** — decided out of web-MVP scope; the placeholder route/component were deleted (area 08)                                                                                                                                           | 08     |
| F22   | Face Selector / Sign In / Trim            | **Adapted** (manual-crop face picker)                                                                                                                                                                                                                   | 02, 09 |
| —     | Curation ranking/moderation (Explore PRD) | **Not implemented** — logic is `TBD` (area 04)                                                                                                                                                                                                          | 04     |
| —     | Share link page                           | **Web-only addition**                                                                                                                                                                                                                                   | 10     |

---

## 9. Global open items for RD

Cross-cutting items still needing a decision or backend work. Area-specific items live in each area
spec's §8 (e.g. `TBD-MV-*`).

| ID            | Open item                                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TBD-GL-03** | ⏸ **Phase 2** — Onboarding / splash (App F01) is not in the web MVP; may be added later.                                                                                                                             |
| **TBD-GL-04** | 🔧 **Backend (RD)** — production persistence (history, storyboard, credits, subscription, profile all reset today).                                                                                                  |
| **TBD-GL-05** | 📄 **Spec-only, ongoing** — Community / Curation ranking + moderation (Explore PRD). Do **not** change the codebase from this; backend integration is a later RD track. Applies to every Curation item across areas. |

**Support ticket / Send Feedback (area 06 §3.1, `TBD-PROF-02` + `TBD-PROF-06`).** `/profile`'s Send
Feedback submits a **CS support ticket through the same CSB endpoint as the CS Chatbot** — the form,
payload and states are **built** (2026-08-17, `FeedbackDialog` + `MuseApi.submitFeedback`); the
endpoint, auth and multipart upload are RD's.
Reference: [Feedback API document](https://ecl.cyberlink.com/dc/DocView.aspx?d=4828) ·
[API test tool](https://stage2.cyberlink.com/prog/support/app/feedback-test.htm) · field mapping
derived from `CS Chatbot — Support ticket spec` §T3. **Two ids are still missing:** `prodVerId` for
YouCam Muse Web (YCO's is `504`) and the `questionTypeId` for "Community Report".

**Notification emails (area 12, `TBD-MAIL-*`).** Five email types are confirmed: four
(verification, onboarding/welcome, MV generation complete, storyboard generation complete) are
RD-implemented with Marcom copy, ready 2026-09-09; the fifth (subscription confirmation) is sent by
**the payment company — Stripe in the US, 2Checkout elsewhere** — not RD, not this app (product
owner, 2026-09-01, superseding the source document's 2Checkout-only statement). The prototype has
no mail capability at all; this is a backend contract only, and its links to `/mv/result?id=` /
`/mv/storyboard?id=` do not cold-resolve today (`TBD-MAIL-01`).

---

## 10. Glossary

| Term                      | Meaning                                                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Compose state             | The MV form (`mvType`, `song`, `description`, `photos`, `settings`).                                                                                                                                                                 |
| Job                       | An async generation unit (`queued → processing → done \| failed`), polled via `MuseApi`.                                                                                                                                             |
| Storyboard-first / Direct | The two MV generation modes (review a storyboard first, vs render immediately).                                                                                                                                                      |
| Take                      | _(Legacy)_ an alternate generated variant of a scene/cover in Edit MV. ⚠️ The pick-a-take UI is **removed** per `TBD-MV-08` — regenerate now overwrites directly; the mechanism is hidden/marked for a future version (see area 02). |
| Flow-guard                | A mid-flow screen that redirects to its flow entry when in-memory state is missing.                                                                                                                                                  |
| `MuseApi`                 | The single typed backend boundary (`src/lib/api/contract.ts`); mock today, real client later.                                                                                                                                        |
