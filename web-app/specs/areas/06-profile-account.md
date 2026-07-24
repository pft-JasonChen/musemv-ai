# Area 06 — Profile, Account & Settings

> Read `../00-overview.md` first (conventions, ID scheme, global auth/credits/i18n models).
> **As-built**; ⚠️ = divergence from App v3.0, ❓ = a tracked `TBD-*`, 🔒 = mock/in-memory.

---

## 1. Overview & scope

The account hub. `/profile` is a **settings-style hub** (avatar/name/PRO, credits+MVs+Songs stats,
Muse Pro, Notifications, Language, Feedback, Settings) with an inline Edit-Profile modal. **Sign Out
now lives in `/settings`** (PROF-03), not on the profile screen. `/settings` (auth-gated) holds legal
links + Sign Out + subscription cancel + account delete.

**In scope:** `profile/ProfileView` (`/profile`, 🔒 **Auth**), `profile/SettingsView` (`/settings`),
the Edit-Profile / Language / Feedback modals.
**Out of scope (cross-referenced):** the account dropdown (area 01 `AccountMenu`); the credits/IAP
modals opened from here (area 07 — `BuyCreditsModal`, `CreditsDetailModal`, `SubscribeModal`); the
**community profile content grid** at `/creator?self=1` that the stat tiles link to (area 04);
sign-in (area 09).

**Key mapping note (important):** web `/profile` is closest to the **App's Account screen (F18)** — a
row-based hub — **not** the App's *My Community Profile* (F16), whose tabbed content grid lives at
`/creator?self=1` (area 04). The stat tiles bridge the two. ⚠️ The overview parity matrix lists
F16→06 for convenience; the content-grid half is actually area 04.

**Other key divergences:** Notifications is a **local toggle with no effect** ⚠️; Unsubscribe /
Delete Account are **demo toasts** (Unsubscribe does not actually downgrade; Delete does not delete)
⚠️. **Synced to App F19 (2026-07-23):** **Sign Out moved into Settings** (PROF-03) and **`/settings` is
now auth-gated** (`AuthGuard`); Terms of Use / Privacy Policy are **real links** (PROF-06).

---

## 2. Route / component / state / API map (RD)

| Route / Component | Owns UI | Reads/writes state | `MuseApi` |
|---|---|---|---|
| `/profile` → `profile/ProfileView` (🔒 **Auth**) | header (avatar/name/PRO/email + edit), stat tiles (Credits/MVs/Songs), rows (Muse Pro, Notifications, Language, Feedback, Settings), Edit-Profile/Language/Feedback modals | `useAuth().{profile,subscribed,subscribedPlan,updateProfile}`, `useCredits().credits`, `useLocale().{locale,setLocale}`, `useT()` | **none** |
| `/settings` → `profile/SettingsView` (🔒 **Auth**, PROF-03) | Back, Terms/Privacy (real links → `lib/legal.ts`, new tab), Unsubscribe confirm, Delete-Account confirm, **Sign Out** | `useAuth().signOut`, `useLocale()`, local `dialog` | **none** |

Localized via `useT()` (`profile.*`, `language.*`, `common.*`) — `/profile` is one of the only two
localized surfaces (nav + Profile). `/settings` copy is hardcoded English.

---

## 3. State model & rules

**Profile header** (`ProfileView.tsx`): avatar (image or name-initial), name, **PRO** pill when
`subscribed`, email; edit-pencil → Edit-Profile modal.
**Stat tiles** (`:116-127`): **Credits** → `CreditsDetailModal` (area 07; its **Buy More** opens `BuyCreditsModal`, also mounted here); **MVs** → `/creator?self=1&tab=mv`; **Songs** → `/creator?self=1&tab=songs` (area 04). Counts derive from the **static** `SAMPLE_CREATIONS` (not the user's real creations) ⚠️.
**Rows** (`:129-146`):
- **Muse Pro** — not subscribed → **Subscribe** → `SubscribeModal` (area 07); subscribed → shows plan name + hardcoded "validity 2026-08-10" + **Manage** → `CreditsDetailModal`.
- **Notifications** — local `useState(true)` toggle; **no effect** 🔒 (→ `TBD-PROF-01`).
- **Language** — opens a 9-locale picker → `setLocale(code)` (i18n, area-wide).
- **Send Feedback** — opens a textarea modal; submit → toast, **content discarded** 🔒 (→ `TBD-PROF-02`).
- **Settings** — navigates to `/settings` (via `localePath`). Sign Out is no longer on this screen (PROF-03 moved it into Settings).
**Edit-Profile modal** (`:176-197`): avatar **cycles `AVATAR_SAMPLES`** (mock "Change Photo", no real upload) 🔒; name (max 30); email **read-only**; Save → `updateProfile({name,avatar})` (in-memory; lost on reload → `TBD-GL-04`).

**Settings** (`SettingsView.tsx`): **Terms of Use** / **Privacy Policy** now **open the real legal
pages** (`lib/legal.ts` `TERMS_URL`/`PRIVACY_URL`, new tab — PROF-06, same set as the sign-in modal
AUTH-03) — the old placeholder modals are removed; **Unsubscribe** → confirm → toast "Unsubscribed
(demo)" — **does not clear `subscribed`** 🔒; **Delete Account** → destructive confirm → toast "Account
deleted (demo)" → redirect Home — **no real deletion** 🔒; **Sign Out** (PROF-03) → `signOut()` →
redirect Home. **Auth-gated route** (`AuthGuard`, PROF-03).

🔒 Everything here is in-memory (profile/subscription) or static (stat counts, legal text).

---

## 4. Journeys

Screens to capture later: `/profile`, Edit-Profile modal, Language picker, `/settings`, delete confirm.

### PROF-P1 — View profile hub
- **PROF-P1-S1** Open `/profile` (auth-gated). **System:** header + stat tiles + rows; PRO pill if subscribed.
- **PROF-P1-S2** Tap **Credits** tile → `CreditsDetailModal`; **MVs**/**Songs** tile → `/creator?self=1&tab=…` (area 04).

### PROF-P2 — Edit profile
- **PROF-P2-S1** Tap edit pencil → Edit-Profile modal (draft seeded from live profile).
- **PROF-P2-S2** **Change Photo** cycles sample avatars; edit name (≤30); email read-only. **Save** → `updateProfile` + "updated" toast (in-memory).

### PROF-P3 — Rows
- **PROF-P3-S1** **Muse Pro** → Subscribe modal (area 07) or Manage (if subscribed). **Notifications** → local toggle. **Language** → locale picker → `setLocale`. **Send Feedback** → textarea → submit toast. **Settings** → `/settings` (Sign Out lives there now, PROF-03).

### PROF-P4 — Settings
- **PROF-P4-S1** `/settings` (auth-gated): **Terms**/**Privacy** → real legal pages (new tab); **Sign Out** → `signOut()` → Home.
- **PROF-P4-S2** **Unsubscribe** → confirm → "Unsubscribed (demo)" toast (no downgrade).
- **PROF-P4-S3** **Delete Account** → destructive confirm → "Account deleted (demo)" toast → Home (no real deletion).

---

## 5. Error & edge states

| ID | Trigger | Behaviour |
|---|---|---|
| **PROF-E1** | Logged out on `/profile` | `AuthGuard` → sign-in modal (area 09). |
| **PROF-E2** | Direct-navigate `/settings` logged out | **Auth-gated (PROF-03, 2026-07-23):** `AuthGuard` opens the sign-in modal; dismiss → Home. |
| **PROF-E3** | Reload after edit/subscribe | Name/avatar/subscription reset to defaults (in-memory; only logged-in boolean persists → `TBD-GL-04`). |
| **PROF-E4** | Unsubscribe while subscribed | Toast only; `subscribed` stays true (no state change). 🔒 |

---

## 6. Acceptance criteria (EARS)

- **AC-PROF-01** — WHEN `/profile` loads for a signed-in user, THE SYSTEM SHALL show avatar/name/email, a PRO pill iff subscribed, the Credits/MVs/Songs tiles, and the row list.
- **AC-PROF-02** — WHEN a stat tile is tapped, THE SYSTEM SHALL open `CreditsDetailModal` (Credits) or navigate to `/creator?self=1&tab=mv|songs` (MVs/Songs).
- **AC-PROF-03** — WHEN Edit-Profile is saved, THE SYSTEM SHALL commit name/avatar via `updateProfile` and reflect them in the shell (in-memory).
- **AC-PROF-04** — WHEN the Muse Pro row is tapped, THE SYSTEM SHALL open the Subscribe modal (not subscribed) or the Credits detail (subscribed).
- **AC-PROF-05** — WHEN Language is changed, THE SYSTEM SHALL switch locale via `setLocale` and reflect it in localized surfaces.
- **AC-PROF-06** — WHEN Sign Out is invoked (from Settings — PROF-03 — or the account menu), THE SYSTEM SHALL clear auth and redirect Home. It SHALL NOT appear on `/profile`.
- **AC-PROF-08** — `/settings` SHALL be auth-gated (`AuthGuard`); WHEN logged out, it opens the sign-in modal (PROF-03).
- **AC-PROF-09** — WHEN Terms of Use / Privacy Policy is tapped (Settings or the sign-in modal), THE SYSTEM SHALL open the shared real legal URL in a new tab (PROF-06 / AUTH-03).
- **AC-PROF-07** — WHEN Unsubscribe or Delete Account is confirmed in `/settings`, THE SYSTEM SHALL show a demo toast (and Delete redirects Home) **without** actually cancelling or deleting anything. *(as-built placeholder — pending `TBD-PROF-04`.)*
- **AC-PROF-08** — THE SYSTEM SHALL render `/profile` and `/settings` at 390/768/1024/1440px with no overflow. *(visual)*

---

## 7. Per-path QA checklist

- [ ] **PROF-P1**: header/tiles/rows render; PRO pill only when subscribed; tiles route correctly (AC-01/02).
- [ ] **PROF-P2**: edit → change photo cycles, name ≤30, email read-only, Save reflects in shell (AC-03).
- [ ] **PROF-P3**: Muse Pro → subscribe/manage; Notifications toggles (no effect); Language switches; Feedback toast; Settings nav; Sign Out → Home (AC-04/05/06).
- [ ] **PROF-P4**: Terms/Privacy placeholder; Unsubscribe demo toast (still subscribed); Delete demo toast → Home (AC-07, E4).
- [ ] **PROF-E1**: logged-out /profile → sign-in. **PROF-E3**: reload loses edits/subscription.
- [ ] **AC-08**: both screens clean at 4 widths *(visual)*.

---

## 8. Open items for RD

| ID | Open item |
|---|---|
| **TBD-PROF-01** | 🔧 **Backend (RD)** — real push/notification wiring (App F18 toggles creation-complete/like alerts); today it's an inert local toggle. |
| **TBD-PROF-02** | 🔧 **Backend (RD)** — Send Feedback destination/endpoint. App opens an in-app form (WebView) with device metadata; web discards the input. |
| **TBD-PROF-04** | 🔧 **Backend (RD)** — real Unsubscribe (store deeplink per App F19, cancels subscription) and real account Delete (permanent data removal). Both are demo toasts today. |
| **TBD-PROF-05** | 🔧 **Backend (RD)** — real stats source. MVs/Songs counts come from static `SAMPLE_CREATIONS`; the Muse Pro row hardcodes "validity 2026-08-10". |

See also global: `TBD-GL-01` (credits), `TBD-GL-04` (persistence), `TBD-GL-06` (localization).

---

## 9. Flow diagram

```mermaid
flowchart TD
  Profile["/profile (account hub, auth)"] --> Tiles["Credits → CreditsDetail · MVs/Songs → /creator?self=1 (area 04)"]
  Profile --> Edit["Edit Profile (name/avatar, in-memory)"]
  Profile --> Pro["Muse Pro → SubscribeModal / Manage (area 07)"]
  Profile --> Lang["Language → setLocale"]
  Profile --> Settings["/settings"]
  Profile --> Out["Sign Out → Home"]
  Settings --> Legal["Terms / Privacy (placeholder)"]
  Settings --> Unsub["Unsubscribe (demo toast)"]
  Settings --> Del["Delete Account (demo toast → Home)"]
```

---

**Decisions (as-built):** `/profile` = Account-style hub (rows), community grid split to `/creator?self=1`;
edits/subscription in-memory; Notifications/Feedback/Unsubscribe/Delete are demo-only; `/settings` is
auth-gated with Sign Out (not on `/profile`); Terms/Privacy are real links.
