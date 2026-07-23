# Area 04 — Explore & Community

> Read `../00-overview.md` first (conventions, ID scheme, global models). **As-built**; ⚠️ = divergence
> from App v3.0, ❓ = a tracked `TBD-*`, 🔒 = mock/seed.
>
> 🔒🔒 **Whole-area caveat (product-undefined):** every surface here runs on **static seed data**
> (`lib/mv/community.ts`). The **Explore Curation PRD** (4 ranked rails, scoring formulas, AI+human
> moderation, refresh cadence, admin pin/unpin) is **not implemented** — there is no ranking, no
> eligibility gating, no moderation, no publish→feed pipeline, and **no community `MuseApi` endpoints**
> (`TODO.md #1`). This spec documents the **UI as-built**; **all curation/feed/moderation logic is
> `TBD`** (`TBD-GL-05` + `TBD-EXP-*`). Do not read production ranking into this doc (gate G3).

---

## 1. Overview & scope

The discovery + community-consumption surface: the Home feed, the two "See all" explore pages, the MV
video player, the community song player, and the creator profile.

**In scope:** `home/HomeView` (`/`), `community/MvExplore` (`/explore/mvs`), `community/SongExplore`
(`/explore/songs`), `community/CommunityMvPlayer` (`/watch`), `community/CommunitySongPlayer`
(`/song/play`), `community/CreatorProfile` (`/creator`), `community/CommunityMvDialog` (modal player),
`community/TrendingMvsPanel` (rendered inside `/mv/room` — area 02), and the shared
`community/ui.tsx` primitives.
**Out of scope (cross-referenced):** the shell (area 01); the actual create flows the CTAs lead into
(areas 02/03); sign-in (area 09); `ShareDialog` (area 10). `LyricsPanel` is shared with area 03.

**Key divergences from the app:** rails are **static seed**, not ranked (Curation PRD) ⚠️; `/watch`
has **no 9:16↔3:4 toggle and no swipe-up feed** (App F10) ⚠️; `/song/play` is a **simulated timer with
no real audio** and **no shuffle/repeat/30s-gate** (App F13) ⚠️; there is a **single sample creator**
(`DEFAULT_CREATOR`) behind every avatar and **no Report/Block** (App F17) ⚠️; like/share are **local,
ungated, non-persistent** ⚠️.

---

## 2. Route / component / state / API map (RD)

| Route / Component | Owns UI | Reads/writes state | `MuseApi` |
|---|---|---|---|
| `/` → `home/HomeView` | hero CTAs, Trending marquee, New MVs, Top Picks, New Songs, per-row like/share/create | `useAuth().requireLogin`, `useSongFlow().patchSongCompose`, local like map | **none** (seed) |
| `/explore/mvs` → `community/MvExplore` | grid of all MVs → `CommunityMvDialog` | local `playId` | **none** |
| `/explore/songs` → `community/SongExplore` | Top Picks + New Songs lists → player; Create | `useSongFlow().patchSongCompose` | **none** |
| `/watch` → `community/CommunityMvPlayer` | 3:4 video player, like/share, Create MV | `useSearchParams().id`, `useMvFlow().setCompose`, local play/mute/like | **none** |
| `/song/play` → `community/CommunitySongPlayer` | disc player (**simulated**), prev/next, like/share, Lyrics, Create AI Song | `useSearchParams().id`, `useSongFlow().patchSongCompose`, local idx/progress | **none** |
| `/creator` → `community/CreatorProfile` | header + stats + MV/Songs tabs + rows | `useSearchParams().{self,tab}` | **none** |
| `community/CommunityMvDialog` | modal 1:1 MV player + Create MV | `useMvFlow().setCompose` | **none** |
| `community/TrendingMvsPanel` | Trending list aside in `/mv/room` (area 02) | — | **none** |

Data: `lib/mv/community.ts` — `TRENDING_MVS`, `NEW_MVS`, `TOP_PICKS_SONGS`, `NEW_SONGS`,
`ALL_COMMUNITY_SONGS`, `CREATOR_MVS`, `CREATOR_SONGS`, `DEFAULT_CREATOR`, `getCommunityMv/Song`,
`formatCount`. All routes are **public** (no `AuthGuard`).

---

## 3. State model & rules

### 3.1 The four rails (Home) — 🔒 seed, not ranked
`HomeView` renders four sections mirroring the Curation PRD rails, but each is a **fixed seed array**:
- **Trending MV** — auto-scrolling infinite **marquee** (`TRENDING_MVS` cloned ×2); card → `/watch?id`.
- **New MVs** — horizontal scroll, `NEW_MVS.slice(0,8)`, portrait 3:4 cards; "See all" → `/explore/mvs`.
- **Top Picks Songs** — horizontal scroll, `TOP_PICKS_SONGS`, square cards; card → `/song/play?id`; "See all" → `/explore/songs`.
- **New Songs** — 2-col grid, `NEW_SONGS.slice(0,6)`; row → `/song/play?id`; per-row Like (local), Share (`ShareDialog`), **Create** → `createFromSong` (`requireLogin` → `patchSongCompose` → `/song/create`).
- **Hero CTAs**: "AI Music Video Studio" → `requireLogin(→ /mv/room)`; "AI Audio Lab" → `requireLogin(→ /song/create)` (auth triggers — area 09).
- ⚠️ **No ranking, refresh, eligibility, or dedup** from the Curation PRD — ordering is array order (`TBD-EXP-01`).
- 📄 **Publish→feed locale contract (backend; spec-only).** When a creation is published (area 02/05) it carries a **language/locale code**. The backend returns each feed **already ranked locale-primary** (viewer's locale first, then engagement signals per the Curation PRD). The **frontend just requests and displays** the server-sorted data — no client-side ranking; "we only ask, the backend sorts." The **code format (2-char ISO `en` vs 3-char product `enu`, etc.) is RD-TBD** → `TBD-EXP-10` (relates to i18n `TBD-GL-06`). No prototype change now (mock feed stays seed).

### 3.2 Explore pages
- **`/explore/mvs`** (`MvExplore`): responsive grid (2/3/4 cols) of `[...TRENDING_MVS, ...NEW_MVS]`; card → **`CommunityMvDialog`** (modal player); Back → `/`. Every card's creator avatar is `DEFAULT_CREATOR.avatar` ⚠️. (`MvExplore` also accepts an `initialPlayId` deep-link prop, but the route never passes it — currently dead.)
- **`/explore/songs`** (`SongExplore`): "Top Picks" + "New Songs" lists; row → `/song/play?id`; creator → `/creator`; **Create** → `patchSongCompose` + `/song/create` (**no `requireLogin` at click** — relies on the `/song/create` `AuthGuard`; ⚠️ inconsistent with Home's gated Create, `TBD-EXP-02`); Back → `router.back()`.

### 3.3 MV player — `/watch` + `CommunityMvDialog`
- `/watch` reads `?id` → `getCommunityMv(id) ?? NEW_MVS[0]`; **3:4 portrait** stage, autoplay **muted** loop, tap play/pause, mute toggle; `# Music Video` tag, title, meta; creator → `/creator`; **Like** (local), **Share** (`ShareDialog`), `Stats`, prompt; **Create Music Video** → `setCompose` (mvType + prompt + `matchedSong` + title) → `/mv/room` (area 02).
- `CommunityMvDialog` is the same experience as a **modal** (1:1 `object-contain` stage), used from `/explore/mvs`.
- ⚠️ App F10 offers a 9:16↔3:4 aspect toggle and a swipe-up "next MV" community feed; web has neither (`TBD-EXP-03`).

### 3.4 Song player — `/song/play` (`CommunitySongPlayer`)
- Reads `?id` → index into `ALL_COMMUNITY_SONGS`; **disc** cover (spins while playing); **playback is a simulated `setInterval` progress over `DURATION=125s` — there is no real `<audio>`** ⚠️; **Prev/Next** cycle the full `ALL_COMMUNITY_SONGS` playlist; click-to-seek; **Like** (local), **Share**, **Lyrics** → `LyricsPanel` (when the song has lyrics); **Create AI Song** → `patchSongCompose` (genre/mood/title/lyrics) → `/song/create`.
- ⚠️ App F13 has shuffle/repeat, a 30s free-preview gate, and community-vs-own playlist modes; web has none of these (`TBD-EXP-04`).

### 3.5 Creator profile — `/creator` (`CreatorProfile`)
- Reads `?self` (`self=1` → `MOCK_USER` name/email; else `DEFAULT_CREATOR`) and `?tab` (`mv`|`songs`).
- Header avatar/name/email + **Plays/Likes** stats (always `DEFAULT_CREATOR.plays/likes` strings, even in self mode ⚠️); MV/Songs tabs; rows (`CREATOR_MVS`/`CREATOR_SONGS`) → `/watch?id` or `/song/play?id`; per-row `⋯` menu = **Like / Share** only.
- This route is **both** the App's *My Community Profile* (F16, via `/profile` stats → `/creator?self=1`, area 06) **and** *Community User Profile* (F17, via any creator link).
- ⚠️ Self mode shows `MOCK_USER`'s identity but the **sample creator's stats + content** (`CREATOR_MVS/SONGS`); no **Report/Block** (App F17) (`TBD-EXP-05`).

### 3.6 Shared
- `community/ui.tsx`: `Headphones/Heart/Share/Play/ChevronRight` icons, `BadgePill` (HOT/NEW), `Stats`, `SectionHead` ("See all" link). `formatCount` → "1.2k" style.
- 🔒 Every like/share/play interaction is **local component state** — no persistence, no server, ungated by auth.

---

## 4. Journeys

Screens to capture later: `/`, `/explore/mvs` (+ dialog), `/explore/songs`, `/watch`, `/song/play`, `/creator` (self + other, both tabs).

### EXP-P1 — Home feed
- **EXP-P1-S1** Open `/` (public). **System:** hero CTAs + four seed rails render.
- **EXP-P1-S2** Hero **Create MV / Create Song** → `requireLogin` → `/mv/room` / `/song/create` (area 09/02/03).
- **EXP-P1-S3** Tap a Trending/New MV card → `/watch?id`; a Top Picks/New Song → `/song/play?id`; a New-Songs **Create** → `requireLogin` → `/song/create` (song pre-filled); Like/Share act locally.
- **EXP-P1-S4** "See all" → `/explore/mvs` or `/explore/songs`.

### EXP-P2 — Explore MVs
- **EXP-P2-S1** `/explore/mvs`: grid of all MVs. Tap a card → `CommunityMvDialog` (modal player). Back → `/`.
- **EXP-P2-S2** In the dialog: play/pause, mute, creator → `/creator`, Like/Share, **Create Music Video** → `/mv/room`.

### EXP-P3 — Explore Songs
- **EXP-P3-S1** `/explore/songs`: Top Picks + New Songs lists. Row → `/song/play?id`; creator → `/creator`; **Create** → `/song/create` (pre-filled).

### EXP-P4 — Watch (MV player)
- **EXP-P4-S1** `/watch?id`: 3:4 player (autoplay muted, tap to pause, mute toggle). Missing/invalid id → falls back to `NEW_MVS[0]`.
- **EXP-P4-S2** Creator → `/creator`; Like (local); Share (`ShareDialog`); **Create Music Video** → `/mv/room` pre-filled from this MV.

### EXP-P5 — Song play (community)
- **EXP-P5-S1** `/song/play?id`: disc + simulated progress; Prev/Next cycle the playlist; seek; Like/Share; Lyrics sheet (if lyrics).
- **EXP-P5-S2** **Create AI Song** → `/song/create` pre-filled (genre/mood/title/lyrics).

### EXP-P6 — Creator profile
- **EXP-P6-S1** `/creator` (or `?self=1&tab=…`): header + stats + MV/Songs tabs.
- **EXP-P6-S2** Tap a row → `/watch?id` (MV) or `/song/play?id` (song). Row `⋯` → Like/Share.

---

## 5. Error & edge states

| ID | Trigger | Behaviour |
|---|---|---|
| **EXP-E1** | `/watch` or `/song/play` with missing/invalid `?id` | Falls back to `NEW_MVS[0]` / first playlist song (no not-found state). ⚠️ **Bug:** Creator **Songs**-tab rows use `cps-*` ids that are **not** in the `/song/play` playlist (`ALL_COMMUNITY_SONGS` excludes `CREATOR_SONGS`), so they resolve to the first song via this fallback and play the wrong track (→ `TBD-EXP-09`). Creator **MV** rows resolve correctly. |
| **EXP-E2** | Like/Share/Play on any community item | Local state only; lost on reload; no auth required (⚠️ vs App F22 like-gating → `TBD-GL-02`). |
| **EXP-E3** | `/song/play` "playback" | No real audio — a `setInterval` advances a progress bar to 125s then stops. 🔒 |
| **EXP-E4** | Empty rail / no content | Not handled — seed arrays are always populated (`TBD-EXP-06`). |
| **EXP-E5** | Create from a community item while logged out | Home hero + New-Songs Create call `requireLogin`; `/explore/songs` Create and player Create rely on the downstream route's `AuthGuard`. |

---

## 6. Acceptance criteria (EARS)

- **AC-EXP-01** — WHEN `/` loads, THE SYSTEM SHALL render the hero CTAs and the four seed rails (Trending MV marquee, New MVs, Top Picks Songs, New Songs) in seed order.
- **AC-EXP-02** — WHEN a hero CTA or a New-Songs **Create** is tapped, THE SYSTEM SHALL run `requireLogin` and, on success, navigate to the create flow (pre-filling the song for Create-from-song).
- **AC-EXP-03** — WHEN an MV card is tapped, THE SYSTEM SHALL open `/watch?id` (Home) or `CommunityMvDialog` (Explore); a song card → `/song/play?id`.
- **AC-EXP-04** — WHEN `/watch` loads, THE SYSTEM SHALL play the MV muted in 3:4 with play/pause + mute, and expose Like, Share, and **Create Music Video** → `/mv/room` pre-filled.
- **AC-EXP-05** — WHEN `/song/play` loads, THE SYSTEM SHALL show the disc player with a simulated progress, Prev/Next across the playlist, Like/Share, a Lyrics sheet when lyrics exist, and **Create AI Song** → `/song/create` pre-filled.
- **AC-EXP-06** — WHEN `/creator` loads, THE SYSTEM SHALL show the profile header + stats and MV/Songs tabs whose rows open the respective players; `?self=1` shows `MOCK_USER` identity.
- **AC-EXP-07** — WHEN an id is missing/invalid on `/watch` or `/song/play`, THE SYSTEM SHALL fall back to a default item (no crash).
- **AC-EXP-08** — THE SYSTEM SHALL render all six surfaces at 390/768/1024/1440px with no overflow. *(visual)*

> No AC asserts ranking, moderation, refresh, persistence, real audio, or publish→feed — none exist (§8).

---

## 7. Per-path QA checklist

- [ ] **EXP-P1**: rails render in seed order; hero + New-Songs Create gate via sign-in; cards route correctly (AC-01/02/03).
- [ ] **EXP-P2**: grid → dialog player → Create MV → /mv/room (AC-03/04).
- [ ] **EXP-P3**: song lists → player; Create → /song/create pre-filled (AC-03).
- [ ] **EXP-P4**: /watch autoplay muted 3:4; play/mute/like/share; Create MV pre-fills (AC-04); bad id → NEW_MVS[0] (AC-07, E1).
- [ ] **EXP-P5**: simulated progress; Prev/Next cycle; Lyrics when present; Create AI Song pre-fills (AC-05, E3).
- [ ] **EXP-P6**: creator tabs + rows open players; self=1 shows MOCK_USER (AC-06).
- [ ] **AC-08**: six surfaces clean at 4 widths *(visual)*.

---

## 8. Area TBD register — decisions 2026-07-22

**Decisions** — codebase change list in [`../handoff.md`](../handoff.md). Curation items are **spec-only** (no codebase change now; backend by RD later — `TBD-GL-05`).

| ID | Decision |
|---|---|
| TBD-EXP-01 | 📄 **Spec-only (Curation PRD)** — 4-rail scoring/eligibility/refresh/dedup; no codebase change now. |
| TBD-EXP-02 | ✅ **Resolved via `TBD-GL-02`** — unify Create gating to action-level (sign-in at click). |
| TBD-EXP-03 | ⏳ **TBD** — MV-player 9:16↔3:4 toggle + swipe-up next-MV feed. |
| TBD-EXP-04 | ✅ **Sync App** — song player: shuffle/repeat + 30s free gate + community/own playlist modes. |
| TBD-EXP-05 | ⏳ **TBD** — real multi-creator data + Report/Block. |
| TBD-EXP-06 | ✅ **Sync App** — empty / not-found states with App-style copy ("Be the first to create!"). |
| TBD-EXP-07 | 📄 **Spec-only (Curation PRD)** — publish→feed + AI/human moderation + admin pin/unpin; no codebase change now. |
| TBD-EXP-08 | 🔧 **Backend (RD)** — real like/share/play counters + auth gating. |
| TBD-EXP-09 | 🐞 **Bug (RD fix)** — creator Songs-tab plays the wrong track (fix the `/song/play` playlist lookup). |
| TBD-EXP-10 | ⏳ **Format TBD (RD)** — the publish/feed **language/locale code format** (2-char vs 3-char). Frontend just passes it through and requests the server-sorted feed; RD decides the format (ties i18n `TBD-GL-06`). |

See also global: `TBD-GL-02` (like/publish gating), `TBD-GL-05` (Curation/community backend track), and `TBD-MV-06` (publish → community pipeline, area 02).

| ID | Question |
|---|---|
| **TBD-EXP-01** | **Rail curation** — implement the Explore PRD: scoring formulas per rail (Trending/New MVs/Top Picks/New Songs), eligibility gates, refresh cadence, dedup. Today all four are static seed in array order. (See the Explore Curation PRD.) |
| **TBD-EXP-02** | **Create gating consistency** — Home hero + New-Songs Create call `requireLogin`; `/explore/songs` Create and the players' Create rely only on the destination route's `AuthGuard`. Standardize. |
| **TBD-EXP-03** | **MV player parity** — App F10 aspect toggle (9:16↔3:4) + swipe-up next-MV community feed; web has neither. In scope? |
| **TBD-EXP-04** | **Song player parity** — App F13 shuffle/repeat + 30s free gate + community/own playlist modes; web has none, and playback is a simulated timer (no real audio). Define real playback + gating. |
| **TBD-EXP-05** | **Creator profiles** — a single `DEFAULT_CREATOR` backs every avatar; self mode mixes `MOCK_USER` identity with sample content/stats; no Report/Block (App F17). Wire real creators + moderation actions. |
| **TBD-EXP-06** | **Empty/error states** — no empty-rail, not-found, or offline states (App has empty-state illustrations). Define them. |
| **TBD-EXP-07** | **Publish→feed + moderation** — how user creations enter these rails (ties `TBD-MV-06`), plus the AI+human moderation pipeline and admin pin/unpin from the Curation PRD. Entirely unbuilt. |
| **TBD-EXP-08** | **Engagement persistence** — likes/shares/plays are local, ungated, non-persistent. Define real counters + auth gating (App F22). |
| **TBD-EXP-09** | **Creator-song deep link (bug)** — Creator profile Songs-tab rows push `/song/play?id=cps-*`, but those ids aren't in the player playlist (`ALL_COMMUNITY_SONGS`), so the wrong song plays (falls back to index 0). Fix the lookup/playlist. |

---

## 9. Flow diagram

```mermaid
flowchart TD
  Home["/ (Home feed — 4 seed rails)"] -->|hero CTA| Create["requireLogin → /mv/room or /song/create"]
  Home -->|MV card| Watch["/watch?id (3:4 player)"]
  Home -->|song card| Play["/song/play?id (disc, simulated)"]
  Home -->|See all| Explore["/explore/mvs · /explore/songs"]
  Explore -->|MV| Dialog["CommunityMvDialog (modal)"]
  Explore -->|song| Play
  Watch -->|creator| Creator["/creator (F16 self / F17 other)"]
  Play -->|creator| Creator
  Watch -->|Create MV| Room["/mv/room (area 02, prefilled)"]
  Dialog -->|Create MV| Room
  Play -->|Create AI Song| Song["/song/create (area 03, prefilled)"]
  Creator -->|row| Watch
  Creator -->|row| Play
```

---

## 10. Decisions & changelog

**Decisions (as-built):** community is UI-only on static seed; no ranking/moderation/persistence; single
sample creator; MV player 3:4-only; song player simulated (no real audio); like/share local + ungated.
All curation/feed logic deferred to the backend track (Explore Curation PRD).

| Date | Change |
|---|---|
| 2026-07-22 | Initial as-built spec; all ranking/moderation/curation logic marked TBD per the Explore PRD (`TODO.md #1`). |
| 2026-07-22 | Validator PASS; documented creator-song deep-link bug (TBD-EXP-09), noted unused `initialPlayId` prop. |
