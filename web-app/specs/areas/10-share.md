# Area 10 — Share

> Read `../00-overview.md` first (conventions, ID scheme). **As-built**; ⚠️ = divergence from App
> v3.0, ❓ = a tracked `TBD-*`, 🔒 = mock/in-memory.
>
> ⚠️ **Backend note (G3):** share-link resolution and expiry are **mock** — own creations resolve
> only from in-memory History; there is **no server-side resolution and no real expiry**. Those are
> RD-owned (`TBD-SHARE-*`). Do not read production persistence into this document.

---

## 1. Overview & scope

The recipient-facing **public** share page and the shared **Share dialog**. A share link opens a
standalone landing page (no app chrome). As of 2026-07-23 the page is **simplified** to just three
things: a **logo header** (click → home), the **media** (MV video / song), and a **Download** button —
no Share action, no title/creator, no "Try" CTA. An unresolvable id shows an expired state. The
`ShareDialog` composer (copy link + social targets) is **no longer used on `/share`** but remains a
shared UI primitive opened by the MV/Song result & player screens (areas 02/03/04).

**In scope:** `share/ShareLinkView` (`/share`), the legacy redirect `share/mv/[id]`, `lib/share`,
`ui/ShareDialog` (canonical share component — cross-referenced by areas 02/03/04).
**Out of scope:** the result/player screens that open `ShareDialog` (areas 02/03/04).

**Key divergences from the app:** the app shares via a **native share sheet** from the result/player
(F08/F10/F13); web adds a **dedicated public landing page** (`/share`) — a web-only addition ⚠️.
Social targets in `ShareDialog` are **Facebook / X / Pinterest / Reddit** (app listed Instagram /
TikTok / WhatsApp / X) ⚠️ (→ `TBD-SHARE-02`). Brand is now consistently **"YouCam Muse"** everywhere
(SHELL-01 resolved 2026-07-23).

---

## 2. Route / component / state / API map (RD)

| Route / Component | Owns UI | Reads/writes state | `MuseApi` |
|---|---|---|---|
| `/share` → `share/ShareLinkView` | public landing (simplified 2026-07-23): logo header (→ home), media (MV video / song), Download button, expired state | `useSearchParams` (`id`, `type`), `useHistory`, `resolveShare`, `useLocale` | **none** (resolves from fixtures + History samples + in-memory History) |
| `/share/mv/[id]` → `page.tsx` | *(no UI)* server `redirect()` → `/share?id={id}` (locale-preserved) | route params | — |
| `ui/ShareDialog` | copy-link input, 4 social targets, native Share (if supported) | local `copied` | — |
| `lib/share` | `buildShareUrl(id)`, `resolveShare(id, history)`, `SharedMedia` | — | — |

Renders **bare** (no shell) — `AppShell` treats any `/share…` path as chrome-less (area 01 SHELL-P5).

---

## 3. State model & rules

- **Resolution order** (`lib/share.ts`): `resolveShare(id, history)` tries community MV fixture →
  community song fixture → the user's own **completed** in-memory History item → **static
  `HISTORY_SAMPLES`** (done MV/song, mapped to the shared demo video/audio) → else `null`.
  `?type=expired` forces `null` (`ShareLinkView.tsx`).
- **Valid link (`SharedMedia` present):** logo header (→ home) + media (MV = `<video controls>` at
  9:16; song = cover image + `<audio controls>`) + a **Download** button (only if a media URL exists).
  No Share action, title/creator, or Try CTA (simplified 2026-07-23).
- **Expired/invalid (`null`):** logo header (→ home), bell-off icon, "This link has expired", copy
  "*Shared links are available for 30 days…*". ⚠️ The 30-day window is **copy only** — there is no
  expiry logic; only an unresolvable id triggers this state. (The former "Go to YouCam Muse" button was
  removed 2026-07-23; the header logo is the way home.)
- 🔒 **Prototype limit** (`lib/share.ts`): community items **and** the static History samples resolve
  from fixtures (survive reload + cross-tab). A user's **live** own creation still lives only in the
  in-memory `HistoryProvider`, so a fresh tab or reload cannot resolve it and the page shows the
  expired state. Production resolves every id server-side (→ `TBD-SHARE-01`, ties `TBD-GL-04`).
- **`buildShareUrl(id)`** (`lib/share.ts:30-33`): `${window.location.origin}/share?id={id}` (client-only;
  empty origin on server).
- **`ShareDialog`** (`ui/ShareDialog.tsx`): read-only link field + **Copy** (clipboard, "Copied!"
  1.5s); a 4-cell grid of social **composer** links — Facebook, X, Pinterest, Reddit (open in a new
  tab); a third-party-terms note; and a native **Share…** button only when `navigator.share` exists.

---

## 4. Journeys

Screens to capture later: `/share?id=…` (valid MV + valid song), `/share?type=expired`, `ShareDialog` open.

### SHARE-P1 — Open a valid share link (recipient, unauthenticated)
- **SHARE-P1-S1** Recipient opens `/share?id={hash}`. **System:** bare page; `resolveShare` finds the media; renders the logo header + media.
- **SHARE-P1-S2** **Download** (if URL) saves the file (`{title}.mp4`/`.mp3`); the **logo** → home.

### SHARE-P2 — Expired / invalid link
- **SHARE-P2-S1** `/share` with an unresolvable `id`, no `id`, or `?type=expired` → expired empty state; the **logo** → home.

### SHARE-P3 — Legacy MV share URL
- **SHARE-P3-S1** `/share/mv/{id}` → server redirect to `/share?id={id}` (locale preserved).

### SHARE-P4 — Share dialog (from any result/player, cross-area)
- **SHARE-P4-S1** User taps Share on an MV/Song result (areas 02/03/04) → `ShareDialog` with `buildShareUrl`. Copy → clipboard; social cell → composer in new tab; native Share when supported.

---

## 5. Error & edge states

| ID | Trigger | Behaviour |
|---|---|---|
| **SHARE-E1** | **Live** own-creation link opened in a fresh tab / after reload | Not in in-memory History → expired state (🔒 prototype limit; → `TBD-SHARE-01`). Static `HISTORY_SAMPLES` are the exception — they resolve from fixtures. |
| **SHARE-E2** | Clipboard API unavailable | `copy()` silently no-ops (try/catch). The native `Share…` button is shown only when `navigator.share` exists, so its `else → copy()` fallback is code-present but not reachable via the button. |
| **SHARE-E3** | Song with no `audioUrl` / MV with no `videoUrl` | Download button hidden (renders only when a URL exists). |
| **SHARE-E4** | SSR / no `window` | `buildShareUrl` yields a relative `/share?id=…` (empty origin). |

---

## 6. Acceptance criteria (EARS)

- **AC-SHARE-01** — WHEN `/share?id={id}` resolves to media, THE SYSTEM SHALL render it bare (no app chrome) with a logo header (→ home), the media, and (if a URL exists) a Download button — and nothing else.
- **AC-SHARE-02** — WHEN the id is missing/unresolvable or `?type=expired`, THE SYSTEM SHALL render the expired empty state; the logo header links home.
- **AC-SHARE-03** — WHEN `/share/mv/{id}` is opened, THE SYSTEM SHALL redirect to `/share?id={id}` preserving the locale.
- **AC-SHARE-04** — WHEN Share is invoked, THE SYSTEM SHALL open `ShareDialog` exposing a copyable `buildShareUrl` link, the four social targets, and (where supported) native share.
- **AC-SHARE-05** — WHEN Download is tapped on a valid link, THE SYSTEM SHALL download the media as `{title}.mp4` (MV) or `{title}.mp3` (song).
- **AC-SHARE-06** — THE SYSTEM SHALL render `/share` (valid + expired) and `ShareDialog` at 390/768/1024/1440px. *(visual)*

---

## 7. Per-path QA checklist

- [ ] **SHARE-P1**: valid community MV id → video card; valid song id → cover+audio; only header + media + Download shown (AC-01).
- [ ] **SHARE-P1-S2**: Download names file correctly; logo → home (AC-05).
- [ ] **SHARE-P2**: bad id / `?type=expired` → expired state; logo → home (AC-02).
- [ ] **SHARE-P3**: `/share/mv/x` → `/share?id=x`, locale kept (AC-03).
- [ ] **SHARE-E1**: static History sample (e.g. `h-cinematic-night`) resolves in a fresh tab; a *live* own creation still → expired (prototype limit).
- [ ] **SHARE-P4 / AC-04**: `ShareDialog` still reachable from MV/Song result & player screens (areas 02/03/04).
- [ ] **AC-06**: 4 widths clean, page bare (no shell) *(visual)*.

---

## 8. Area TBD register — decisions 2026-07-22

**Decisions** — codebase change list in [`../../docs/handoff-2026-07-23.md`](../../docs/handoff-2026-07-23.md).

| ID | Decision |
|---|---|
| TBD-SHARE-01 | 🔧 **Backend (RD)** — server-side share resolution + real link expiry. |
| TBD-SHARE-02 | ⏳ **TBD** — web social channels differ from app; the web set is to be defined later. |
| TBD-SHARE-03 | ✅ **Decided (yes)** — share links carry analytics; details TBD. |

See also global: `TBD-GL-04` (persistence), `TBD-GL-07` (`/share` gating), `TBD-SHELL-01` (brand).

| ID | Question |
|---|---|
| **TBD-SHARE-01** | **Server-side resolution + real expiry** — production must resolve any id (incl. the sharer's own creations) server-side, and implement the advertised 30-day expiry (copy-only today). RD to define the share record + endpoint. |
| **TBD-SHARE-02** | **Social channels** — final set? App listed Instagram / TikTok / WhatsApp / X; web has Facebook / X / Pinterest / Reddit. |
| **TBD-SHARE-03** | **Analytics / privacy** — should share links carry tracking, and what recipient data (if any) is captured? Undefined. |

---

## 9. Flow diagram

```mermaid
flowchart TD
  Legacy["/share/mv/{id}"] -->|redirect| SharePage["/share?id={id} (bare)"]
  SharePage --> Resolve{resolveShare}
  Resolve -->|community fixture / own completed / History sample| Valid["Logo header + Media + Download"]
  Resolve -->|null or ?type=expired| Expired["Expired state (logo → home)"]
  Result["MV/Song result & player (areas 02/03/04)"] -->|Share| Dialog["ShareDialog: Copy · FB/X/Pinterest/Reddit · native Share"]
```

---

## 10. Decisions & changelog

**Decisions (as-built):** dedicated public share page (web-only) + shared `ShareDialog`; bare (no
shell); community ids **and static History samples** resolve from fixtures, live own creations from
in-memory History only; 30-day expiry is copy, not enforced.

| Date | Change |
|---|---|
| 2026-07-22 | Initial as-built spec. Validator PASS (2 NITs); clarified SHARE-E2 native-share fallback reachability. |
| 2026-07-23 | Public `/share` page **simplified** to logo header (→ home) + media + Download only — Share action, title/creator, and Try/Go-home CTAs removed; brand consistently "YouCam Muse" (SHELL-01). `resolveShare` now also resolves static `HISTORY_SAMPLES` so a shared sample creation opens the page (a demo MV, `h-cinematic-night`, is dated 2026-07-23). `ShareDialog` is no longer opened from `/share` but remains the shared primitive for result/player screens. |
