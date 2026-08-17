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

## 2026-08-17 — **C1 + C2 ADDITION** — `submitFeedback` (support ticket)

> **LANDED.** `submitFeedback` exists on `MuseApi`, is implemented in `mock.ts`, and the C1/C2
> snapshots in `contract.surface.test.ts` were re-recorded to include it. The recorded wire shape is
> `attachment · email · language · prodVerId · q · questionTypeId · title` — i.e. the CSB params
> themselves. (This entry was written a few hours ahead of the code, banner-flagged as unlanded;
> the banner is now replaced rather than the entry rewritten.)

**Surfaces:** **C1** (`contract.ts`) and **C2** (`schemas.ts`) — both **additive**, nothing existing
moves or is removed.

`/profile`'s **Send Feedback** stops discarding its input and becomes a real **CS support ticket**,
submitted through the **same CSB endpoint as the CS Chatbot**. Spec: `specs/areas/06-profile-account.md`
**§3.1** (field→param mapping, states, error behaviour) and §10 (the twelve decisions).

- **C2** — new `FeedbackTicket` schema whose **field names ARE the CSB params**: `email`,
  `questionTypeId`, `title`, `q`, `language`, `attachment`. The Zod type is the wire contract, so
  there is no mapping layer to keep in sync.
- **C1** — `submitFeedback(input): Promise<{ ticketId: string }>`, mocked in `mock.ts` (validate →
  short delay → fake id). **This is the whole swap point.**
- `Profile` / `useAuth` are **unchanged** — no `id` field. The ticket's **User ID is injected
  server-side**, deliberately diverging from the CS spec's §T3 where the frontend composes it into `q`.
- `q` carries the **description text alone** — no User ID, no Order ID (Order ID / Invoice # is not
  collected on web at all).
- `language` is the **product locale code** (`enu`…`ptg`), not BCP-47.

**RD must do:** point `submitFeedback` at the endpoint in the
[Feedback API document](https://ecl.cyberlink.com/dc/DocView.aspx?d=4828) (verify params against the
[API test tool](https://stage2.cyberlink.com/prog/support/app/feedback-test.htm)); send `attachment`
as `multipart/form-data` (any type, 10 MB total, enforced client-side too); inject the User ID from
the session; and supply the **two ids the spec cannot fill** — `prodVerId` for YouCam Muse Web (YCO's
is `504`) and the `questionTypeId` for **Community Report** (the other four are Purchase and Payment
`313` · Account `348` · Feature Issue `204` · Others `211`). Tracked as `TBD-PROF-06`.

**Real-client note:** the mock never reaches a network, so `grep -rn 'fetch(' src` stays empty. When
the real client lands, use the documented relaxation `YCM_REAL_API=1` (fetch allowed inside
`src/lib/api/` only) — see `DEVELOPER-HANDOVER` §4.

---

## 2026-08-12 (c) — **C4 REMOVAL** (AI Enhance is free) + **C8 repriced** (TBD-CC-05)

**Surfaces:** **C4** (`useCredits`) — a **removal**, which C4 normally forbids. **C8**
(`src/lib/mv/types.ts`) — two constants replaced, one revalued.

### C4 — `enhanceCost` / `consumeEnhance` are GONE

AI Enhance costs nothing (spec `areas/11` §5.5, closing TBD-CC-03). There is **no cloud-config
action for Enhance at all**, so billing it was never part of the approved credit model; the old
"first free per session, then 1 credit" rule was WA's own invention.

`useCredits()` is now `{ credits, addCredits }`. `providers.surface.test.ts` + its snapshot updated.

> **This breaks C4's "additive only" rule, deliberately.** The alternative was to keep two
> permanently-inert keys in a frozen contract, which would tell RD to implement billing that must
> not exist. Product decision 2026-08-12. **RD: if you built against `enhanceCost` /
> `consumeEnhance`, delete it — Enhance is free and has no action to bill.**

### C8 — song costs repriced, cover cost corrected

| before                    | after                                                                                    | why                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `COST_SONG = 10`          | **`COST_SONG_VOCAL = 6`** + **`COST_SONG_INSTRUMENTAL = 12`** + `songCost(instrumental)` | spec 11 §3.1 bills on the Instrumental toggle; one constant could not express it                                  |
| `COST_SONG_RECREATE = 50` | **`songRecreateCost` = `songCost`**                                                      | the flat 50 had **no counterpart anywhere** in spec 11 or the cloud config. A Recreate is just another generation |
| `COST_COVER = 10`         | **`COST_COVER = 4`**                                                                     | `edit_poster`, added in the 2026-08-12 cloud-config drop (closes TBD-CC-02)                                       |

`COST_STORYBOARD` (20), `COST_RENDER` (200) and `COST_REGEN` (20) are **unchanged and still
placeholders** — they are `base + rate × seconds` in spec 11, so no constant is correct. Their real
formulas are recorded in `types.ts`'s header. TBD-CC-05's own resolution is _"由後端回傳而非
hardcode"_, so a client-side calculator was deliberately NOT built.

Side effect worth knowing: `SongFlowProvider`'s `nextCost` ref is gone — it existed only to make one
Recreate charge a different amount.

### Also in this change (not a contract surface)

**`DEFAULT_CREDITS` 390 → 10** (`TBD-CR-06a`), plus a demo escape hatch. 10 is the free-tier rule and
**does not cover any MV** (cheapest MV path is 220), so a free account generates one vocal song and
then meets the paywall — intended. Because `AGENTS.md` also calls this a _CEO-demoable_ prototype,
`startingCredits()` reads **`NEXT_PUBLIC_DEMO_CREDITS`** and falls back to the rule. Set it to 1000
for a demo build; leave it unset everywhere else. No UI branch, nothing in the URL.

**RD action required:** drop any use of `enhanceCost` / `consumeEnhance`. Read song costs through
`songCost(instrumental)` rather than a flat constant. Treat all six `COST_*` as placeholders that the
backend will supply — `types.ts` says which are already right (`COST_COVER`, the two song costs) and
which are not.

**Notified:** ⚠️ **not yet sent** — same as the entries below.

**Verified by:** typecheck / lint / test:run 84/84 (C4 + C8 snapshots updated deliberately) / build /
designer:check 42/42; the five e2e that assert credit behaviour all re-run green.

## 2026-08-12 (b) — **C8 GREW: `COST_REGEN` + `COST_COVER` are now contract**

**Surface:** **C8** (`src/lib/mv/types.ts`) — **additive only**, which is what C8 permits.
No existing constant changed name or value.

**Change:** the two MV-Edit credit costs moved into the contract file.

```
COST_REGEN = 20   // per-scene Recreate   — was a module-local const in components/mv/MvEditor.tsx
COST_COVER = 10   // cover Recreate       — same
```

Both are also added to `contract.surface.test.ts`'s C8 snapshot, so they are now frozen like the
other four. Snapshot diff is exactly two added lines.

**Why this mattered:** C8 freezes the `COST_*` surface **in that one file**. These two lived in a
component, so **two of the six credit costs sat outside the RD contract** — they could be changed
without the C8 snapshot or the G4-g changelog gate noticing. A spec-vs-code audit on 2026-08-12
found it; RD reading C8 would have seen four of six credit costs and had no signal the other two
existed.

**Values are unchanged and are still placeholders.** `specs/areas/11` holds the authoritative
cloud-config rules and `TBD-CC-05` owns the revaluation. For the record, the authoritative mapping
now that the 2026-08-12 cloud-config update landed:

| constant     | cloud-config rule                                    | authoritative cost | prototype placeholder |
| ------------ | ---------------------------------------------------- | ------------------ | --------------------- |
| `COST_REGEN` | `edit_mv` + `recreate` + `sing_<res>`\|`story_<res>` | fixed + per-second | 20                    |
| `COST_COVER` | **`edit_poster`** (new in this config drop)          | 4 per result       | 10                    |

`edit_poster` also closes **TBD-CC-02** ("Edit MV cover Recreate — backend action missing").

**RD action required:** none now. When you wire real billing, read all six from `types.ts` — that
is now the complete set.

**⚠️ Separately, and bigger — see `specs/areas/11` `TBD-CC-06`:** the same config drop flipped
`consumedType` from `"duration"` to `"credit"` on all 23 actions, and the product owner confirmed
this moves the quantity/duration into the **frontend's** payload (it was previously derived
backend-side from the task). That IS an interface-contract change, but it is not yet implementable —
field name, unit, and how a delegating action's quantity maps to its sub-actions are all undefined.
Nothing in C1–C8 has moved for it yet.

**Notified:** ⚠️ **not yet sent** — same as the two entries below.

**Verified by:** typecheck / lint / test:run 84/84 (C8 snapshot updated deliberately, +2 lines) /
build / designer:check 42/42.

## 2026-08-12 — `/song/create` loses its `AuthGuard`; **no C1–C8 change**

**Surface:** **none of C1–C8.** `src/app/[locale]/song/create/page.tsx` trips the gate because
C7 is watched by the `src/app/` **prefix**, but **C7 is "URL shapes" and no URL moved** — the
route map is byte-identical, and `contract.surface.test.ts`'s C7 snapshot is untouched (verify:
`npm run test:run` stays 84/84 with no snapshot write).

**Change:** the route stopped wrapping its view in `AuthGuard`. `/song/create` is now reachable
by a logged-out user, matching `/mv/room` (which was opened to guests on 2026-08-07). The
sign-in gate moved from the route entry to the action:

| screen         | guest can                      | gate fires on                            |
| -------------- | ------------------------------ | ---------------------------------------- |
| `/mv/room`     | browse, Import Audio, describe | **Song Library**, **Create Music Video** |
| `/song/create` | browse, describe, pick mode    | **Create Song**                          |

Also changed, same reason, neither a contract surface: `shell/Sidebar.tsx`'s `GATED` set
(`{/mv/room, /song/create, /history, /profile}` → `{/history, /profile, /settings}`),
`shell/MobileTabBar.tsx`'s create sheet (no longer calls `requireLogin` before navigating;
its History entry still does), and `song/SongCompose.tsx` (`generate()` now wraps the whole
action in `requireLogin`).

**Why:** product decision 2026-08-12. Gating the nav click meant a guest tapping **Create MV**
or the phone ＋ sheet got a sign-in modal _instead of_ the screen, which walled off the entire
create flow and defeated the marketing Navbar's **Start for Free** (which lands on `/mv/room`).

**One ordering rule worth knowing, because it is a revenue path:** in `SongCompose.generate()`
the GL-01 insufficient-balance check runs **inside** the `requireLogin` callback. A logged-out
user is therefore never shown the Buy-Credits upsell — sign-in always comes first. Asserted in
`e2e/behaviour-regressions.spec.ts` ("a guest is never shown the credits upsell before signing in").

**RD action required:** none for the contract. If you rely on "these five routes are
`AuthGuard`-wrapped", the set is now **four**: `/history`, `/profile`, `/profile/credits`,
`/settings`. Specs 01 / 02 / 03 / 09 were updated in the same change (AC-AUTH-08, AC-MV-01b,
AC-SONG-01b).

**Notified:** ⚠️ **not yet sent** — same as the 2026-08-12 (a) entry below. Whoever lands this
must tell RD and replace this line.

**Verified by:** typecheck / lint / test:run 84/84 / build / designer:check 42/42 all green;
`e2e` G5-d#3 block **11/11**, which now also covers `/profile/credits` (previously untested) and
repairs a test that had never passed — see below.

**Bonus fix, unrelated to the contract:** `e2e`'s "G5-d#3 /mv/room's gate moved to Create Music
Video" had been failing since the commit that introduced it (`0748b66`). It composed via
`composeMv()`, which picks a song through **Song Library** — the very control that same commit
put behind `requireLogin`. The test now imports audio (deliberately ungated) instead.

## 2026-08-11 (b) — `globals.css` touched under `src/app/`; no contract change

**Surface:** none of C1–C8 — this is a styling-only edit to `src/app/globals.css`, which the
gate watches by prefix (`src/app/`) because that directory also holds `page.tsx` route files,
not because every file under it is a contract surface.

**Change:** three rules, none of them C7 (no route/URL shape touched):

- `.app-layout__content { z-index: 2; }` — raises page content above the footer's own
  `z-index: 1` so the fixed `SongPlayBar` isn't painted over by a later-in-DOM footer.
- `body:has(.song-bar) footer.footer { display: none; }` — hides the footer entirely while
  the song player bar is open.
- `textarea:focus-visible, input:focus-visible { outline: none; }` — drops the global purple
  focus ring specifically on text inputs (kept on buttons/links for accessibility).

**Why:** designer requests, 2026-08-11 (song player bar layering/footer overlap, and the
default focus-ring color reading as an error state on text fields).

**RD action required:** none — no route, schema, provider, or domain-constant surface moved.

**Notified:** N/A — recorded here per G4-g; no RD action follows.

## 2026-08-11 — Credits Detail moves from a modal to a route. **C7 changed — this is the declared PR.**

**Surface: C7.** `src/app/[locale]/profile/credits/page.tsx` added. `the URL shapes RD
deep-links against are unchanged` snapshot updated: `/[locale]/profile/credits` inserted
(alphabetical, between `/[locale]/profile` and `/[locale]/settings`).

**Why:** plan §2.1 scoped Credits IAP (`CreditsPage` + `CreditsDialog` + `UpgradeDialog`) as
"modal, not route" specifically to avoid a C7 change, since DP's version is a route
(`/account/credits`) but WA opens it from the credit pill anywhere in the app. The designer
asked for DP's actual full-page treatment instead (2026-08-11) — overriding that scoping
decision, not an oversight. `CreditsDetailModal` is deleted; its content moved into
`CreditsView`, rendered by the new route with `DetailNavbar` (fallback `/profile`, same
pattern as the existing `/settings` sub-route) instead of `Modal`.

**What did NOT move:** Buy Credits (`BuyCreditsModal`) and Upgrade (`SubscribeModal`) stay
modals — DP has no route for either of those, so nothing about them is a C7 concern. Both are
opened from the new page exactly as they were opened from the old modal.

**What RD must do:** nothing breaks — no existing URL changed or was removed, this is a pure
addition. If RD wants to deep-link straight to a user's credit balance, `/profile/credits` now
exists for that.

| Surface | Path                          | Diff                                                                                    |
| ------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| C1      | `src/lib/api/contract.ts`     | untouched                                                                               |
| C2      | `src/lib/api/schemas.ts`      | untouched                                                                               |
| C3      | `src/lib/api/index.ts`        | untouched                                                                               |
| C4      | the five providers            | untouched — `CreditsView` only CONSUMES `useCredits`/`useAuth`, both long-standing keys |
| C5      | `src/lib/authStore.ts`        | untouched                                                                               |
| C6      | `config.ts` / `middleware.ts` | untouched                                                                               |
| C7      | `src/app/**/page.tsx`         | **one route added**: `/[locale]/profile/credits`                                        |
| C8      | `src/lib/mv/types.ts`         | untouched                                                                               |

---

## 2026-08-07 — the landing page migrated. **No contract change.**

**Surface: none.** The gate flagged this change because it touches `src/app/globals.css`, which is
watched as part of C7's neighbourhood. **It is a deletion of dead CSS, not a contract change**, and
this entry is the explicit statement the gate asks for rather than paperwork.

**What actually moved in that file:** the `@keyframes marquee` block and the three class names it
drove (`.marquee-wrap`, `.marquee-animate`, `.marquee-clone`). They existed for Home's 45s infinite
Trending MV rail, which DP does not have and which the product owner decided to delete with the
landing-page migration. Their only consumer went with them.

**What RD must do: nothing.** No endpoint, no wire format, no cost constant, no hook key, no URL.

**Checked rather than assumed, since this slice rewrote a whole route:**

| Surface | Path                          | Diff                                                                                                             |
| ------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| C1      | `src/lib/api/contract.ts`     | untouched                                                                                                        |
| C2      | `src/lib/api/schemas.ts`      | untouched                                                                                                        |
| C3      | `src/lib/api/index.ts`        | untouched                                                                                                        |
| C4      | the five providers            | untouched — the new screen only CONSUMES `requireLogin` and `patchSongCompose`, both long-standing keys          |
| C5      | `src/lib/authStore.ts`        | untouched                                                                                                        |
| C6      | `config.ts` / `middleware.ts` | untouched                                                                                                        |
| C7      | `src/app/**/page.tsx`         | untouched — `/`'s `page.tsx` still returns `<HomeView />`; the rewrite is entirely inside `src/components/home/` |
| C8      | `src/lib/mv/types.ts`         | untouched                                                                                                        |

**One thing RD should know even though it is not a contract change:** `web-app/public/assets/hero/`
is new and is 13 MB of vendored demo media (8 mp4 + 8 posters), referenced by path string from
`src/components/home/heroItems.ts`. Four of those filenames contain a space and are
`encodeURIComponent`-ed at the reference site. When real hero content is served, that module is the
single place to change.

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
