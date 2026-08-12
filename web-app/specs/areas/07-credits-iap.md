# Area 07 — Credits & IAP

> Read `../00-overview.md` first (conventions, ID scheme, global credits model §6). **As-built**;
> ⚠️ = divergence from App v3.0, ❓ = a tracked `TBD-*`, 🔒 = mock/in-memory.
>
> ⚠️ **Backend note (G3):** there is **no real payment** — every purchase/subscribe just mutates the
> in-memory balance/flag. Real IAP (App Store / Play Store), persistence, credit reset/expiry, and
> restore-purchases are backend/store concerns this spec does **not** define (`TBD-CR-*`).

---

## 1. Overview & scope

Credit balance + two monetization modals and one route. `CreditsProvider` holds an in-memory
balance; `SubscribeModal` (Muse Pro plans) and `BuyCreditsModal` (credit packs) are opened as modals
from the shell, account menu, profile and the in-flow insufficient-balance paths, while the balance

- ledger screen is the **`/profile/credits` route** (`CreditsView`). Disclaimer copy differs per
  surface: only **`SubscribeModal`** says "Demo only — no real payment. Subscription credits expire
  each cycle."; `BuyCreditsModal` says purchased credits are **valid for 2 years** (non-refundable /
  prices-vary); the Credits Detail screen has none.

> **Corrected 2026-08-12 — Credits Detail is a ROUTE, not a modal.** It moved on 2026-08-11
> (`d329719`, designer request): `CreditsDetailModal.tsx` was **deleted** and replaced by
> `credits/CreditsView.tsx` at `/profile/credits`, gated by `AuthGuard`. That commit declared the
> C7 change correctly (route-map snapshot + `CHANGELOG-RD.md`, per G4-c/G4-g) but did not update
> `specs/areas/*`, so this file described a component that no longer existed for a day.
> Subscribe and Buy Credits deliberately gained **no** route — DP has none for either, and keeping
> them modal means a mid-creation top-up never navigates out of an in-memory flow.

**In scope:** `providers/CreditsProvider`, `credits/SubscribeModal`, `credits/BuyCreditsModal`,
`credits/CreditsView` + the `/profile/credits` route; the plan/pack/ledger data in `lib/user.ts`.
**Out of scope (cross-referenced):** entry points — header credits badge + account menu Buy Credits
(area 01), profile Credits tile / Muse Pro row (area 06); how generation _spends_ credits (area 02
MV flow + Edit MV, area 03 song; charging is now real — `GL-01`, see §6 overview).

**As-built (pricing finalized 2026-07-24 from the YouCam Muse Business Model, 2026-07-13):**
prices, credit grants, and SKUs are the **as-approved** values (backend "Credit form" / "Subscription
form" tables — annotated _price/SKU 須跟後台一樣_). `SUBSCRIPTION_PLANS`, `CREDIT_PACKS`,
`MUSE_PRO_FEATURES` in `lib/user.ts` now carry these numbers + store SKUs.

- **Credits are subscriber-only** (Business Model "Credit Plans → Proposal 1, Final Decision").
  **Free users never see a Buy-Credits affordance** — every entry point shows **Subscribe** instead
  (header pill, account-menu button, Credits-detail CTA "Get Muse Pro"), and `BuyCreditsModal` renders
  `SubscribeModal` for a non-subscriber (also the safety net for the in-flow insufficient-balance path).
  Only subscribers see **Buy Credits** (CR-06).
  > **Starting balance is now `DEFAULT_CREDITS = 10`** (was 390; product decision 2026-08-12,
  > `TBD-CR-06a`). **10 does not cover any MV** — the cheapest MV path is 220 — so a free account
  > generates one vocal song (6) and then meets the paywall. That is the intended funnel, and it
  > **reverses** this line's old claim that the demo stays playable without subscribing. Because
  > `AGENTS.md` also calls this a CEO-demoable prototype, `startingCredits()` in `lib/user.ts`
  > reads **`NEXT_PUBLIC_DEMO_CREDITS`** and falls back to the rule — set it to 1000 for a demo
  > build. e2e funds itself through the real subscribe flow (`fundAccount`) rather than the env var.
  > ✅ **Re-affirmed and re-implemented 2026-08-12.** A designer drop removed this gate on
  > 2026-08-11; CR-06 comes from the Business Model, not the comp, so the product owner reinstated
  > it and the code was reverted the same day. "As-built" holds again. Guarded by
  > `e2e`'s "3f / CR-06: a free account cannot reach Buy Credits". History in TBD-CR-10.
- **Discount presentation (sample, `TBD-CR-07`):** `BuyCreditsModal` demonstrates the Business Model
  sale UI — a "Limited-time · N% OFF" banner, a struck-through list price + a red "N% OFF" badge per
  pack (a card may carry its tier badge and the discount badge together), and the sale price on the Buy
  CTA. Driven by `CREDIT_SALE_PCT` (demo = 20); the badge % rounds **up to the nearest 5** per the
  Business Model rule (`displayDiscountPct`). Sample only — real promotion values/rules are RD-owned.
- **Subscription plans** = **Weekly $19.99 / 200 cr**, **Weekly Pro $29.99 / 1,000 cr** (default),
  **Yearly $59.99 / 2,000 cr**; the header credit count + expiry cadence track the selected plan.
- **Credit packs** = **300 $14.99 · 600 $23.99 · 1,000 $39.99 (POPULAR) · 2,000 $59.99 (BEST VALUE,
  default) · 5,000 $148.99 · 8,000 $239.99**; displayed largest→smallest.
- **Expiry:** purchased credits are valid **2 years**; subscription credits **expire with the period**
  (weekly / yearly) — copy only, no real expiry engine.

**Restore Purchases** and the **"already on Muse Pro"** state exist. Still mock: **no native IAP** —
purchase is instant `addCredits` 🔒 (`TBD-CR-01`); the discount %-off / strike-through display and the
grid/list/popup layout _proposals_ from the Business Model are **not** built (`TBD-CR-07`).

**Amended 2026-08-06 by the designer-UI migration (slice 3f).** All three dialogs are now DP's
markup on the shared `ui/DpDialog` shell (they **unmount when closed**, unlike the 3b overlays that
stay mounted with `inert`). Two things about that port matter to RD:

- ⚠️ **`SubscribeModal` is no longer a radio picker.** DP's `UpgradeDialog` is three self-contained
  cards, each with its own Subscribe button — a deliberate interaction redesign, ported as designed.
  There is no `selected` state and **`DEFAULT_PLAN_ID` no longer drives this screen** (it stays
  exported because it is the Business Model's stated default and other code may want it).
- **Every number still comes from `lib/user.ts`, not from DP** (S20). DP's own comp shows $9.99 for
  Weekly against WA's $19.99, and hardcodes a literal "/ week" on **all three** cards including
  Yearly — porting its markup verbatim would have shipped a "$59.99 per week" plan. WA models the
  billing period per plan (`SubscriptionPlan.per`), so Yearly reads "/ year". **Layout is DP's,
  pricing is the Business Model's; keep it that way on the next designer drop.**

3f also widened `lib/user.ts` (the only `src/lib` file Phase 3 touched): per-plan `description`,
`cta` treatment and `featured` flag, `per`, an icon per `MUSE_PRO_FEATURES` entry, and
`YEARLY_EXTRA_FEATURES` — DP gives the yearly card one benefit the weekly cards do not have.

---

## 2. Route / component / state / API map (RD)

| Component                   | Owns UI                                            | Reads/writes state                                                     | `MuseApi` |
| --------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- | --------- |
| `providers/CreditsProvider` | — (state only)                                     | `useState(startingCredits())` — `DEFAULT_CREDITS=10`, or `NEXT_PUBLIC_DEMO_CREDITS`; `addCredits(n)` | **none**  |
| `credits/SubscribeModal`    | Muse Pro plan picker + Subscribe CTA               | `useAuth().subscribe`, `useCredits().addCredits`, `SUBSCRIPTION_PLANS` | —         |
| `credits/BuyCreditsModal`   | balance + credit-pack picker + Buy CTA             | `useCredits().{credits,addCredits}`, `CREDIT_PACKS`                    | —         |
| `credits/CreditsView`       | balance + All/Spend/Earn filter + ledger + Buy CTA | `useCredits().credits`, `CREDIT_TRANSACTIONS`                          | —         |

| Route              | Component             | Guard                                         |
| ------------------ | --------------------- | --------------------------------------------- |
| `/profile/credits` | `credits/CreditsView` | `AuthGuard` (same as `/profile`, `/settings`) |

Subscribe and Buy Credits have no route of their own — they stay modals, opened from the shell,
account menu, profile, the in-flow insufficient-balance paths, and from `/profile/credits` itself.
No backend.

`CreditsView` renders DP's Credits Detail (Figma 636:11875) using `styles/designer/CreditsPage.css`
verbatim, with `shell/DetailNavbar` for the back+title bar and `RoomNavbar`'s shared `Tabs` for the
filter. The **All / Spend / Earn** filter and the per-row type icon are DP additions WA did not have
before the migration; the filter derives from the sign of `amount`.

---

## 3. State model & rules

- **Balance** (`CreditsProvider.tsx`): single in-memory `credits` (`startingCredits()` — `DEFAULT_CREDITS = 10`, demo override `NEXT_PUBLIC_DEMO_CREDITS`) +
  `addCredits(n)` (adds `n`, may be negative). **GL-01 (2026-07-23):** the MV/song **flow providers**
  now decrement on generation start (`COST_STORYBOARD`/`COST_RENDER`/`COST_SONG`, refunded on failure)
  and Edit-MV still charges its micro-ops (`COST_REGEN`/`COST_COVER`); when the balance can't cover a
  cost the CTA **routes to IAP instead of generating** (`MvRoom`, `SongCompose`, `StoryboardEditor`,
  `MvEditor`, `SongResultView`). `CreditsProvider` also exposes `enhanceCost` / `consumeEnhance` for
  the AI-Enhance charge (SONG-04). Balance still resets to 390 on reload 🔒 (`TBD-GL-04`); real ledger
  is `TBD-CR-04`.
- **`SubscribeModal`** (`SubscribeModal.tsx`, DP's `UpgradeDialog` since 3f): title **"Upgrade Your
  Plan"**. Three self-contained `SUBSCRIPTION_PLANS` cards, **each with its own Subscribe button and
  no shared selection** — **Weekly Pro** $29.99 / week, 1,000 cr, **BEST VALUE**, `--featured` ·
  **Weekly** $19.99 / week, 200 cr, **MOST POPULAR** · **Yearly** $59.99 / year, 2,000 cr. Each card
  carries a one-line `description`, its own CTA treatment (`cta: default | gradient | white`), a
  "{credits} {cadence} Credits" row, the `MUSE_PRO_FEATURES` list (+ `YEARLY_EXTRA_FEATURES` on the
  yearly card), and a **"Credits Expire {cadence}"** line derived from `cadence`, not hardcoded per
  card. A card's **Subscribe** → `subscribe(plan)` + `addCredits(plan.credits)` + `onSubscribed`
  toast + close. Footer: **Restore Purchases** ("No previous purchases found on this account.") and
  the short disclaimer **"Demo only — no real payment"** — DP's own footer is two dead `#` links and
  Restore takes that slot. When already subscribed the dialog shows the **"You're already on Muse
  Pro"** card with the subscribed plan's credit count and a **Done** button instead of the cards
  (CR-05) — DP has no such state, and without it a subscriber could buy a second subscription.
- **`BuyCreditsModal`** (`BuyCreditsModal.tsx`): **subscriber-gated (CR-06)** — for a non-subscriber it
  renders `SubscribeModal` directly (no Buy-Credits UI is ever shown to a free user); for a subscriber
  it shows the balance + six `CREDIT_PACKS` (**8,000** $239.99 · **5,000** $148.99 · **2,000** $59.99
  **BEST VALUE** · **1,000** $39.99 **POPULAR** · **600** $23.99 · **300** $14.99), default selected
  **2,000** (`DEFAULT_CREDIT_PACK_ID`, BEST VALUE), and the `TBD-CR-07` discount sample when
  `CREDIT_SALE_PCT > 0` (struck list price + "N% OFF" badge + sale price on the CTA). **Buy Now** →
  `addCredits(pack.credits)` + `onPurchased` toast + close. Copy (CR-03): **"Purchased credits are
  valid for 2 years. Non-refundable and lost upon account deletion. Prices may vary by region."** —
  DP's own copy says purchased credits "never expire", which contradicts the Business Model, so WA's
  wording wins for the same reason its prices do.
- **`CreditsView`** (`CreditsView.tsx`, route `/profile/credits`): back+title bar, balance card, an
  **All / Spend / Earn** filter, and the ledger rendered from the static 7-entry
  `CREDIT_TRANSACTIONS` seed (`lib/user.ts`) — 🔒 **not live**; it does not reflect `addCredits`
  calls. Its CTA is now an **unconditional "Buy More"** opening `BuyCreditsModal`.
  > ✅ **Restored 2026-08-12.** The CTA is CR-06-branched again: **"Buy More"** for a subscriber,
  > **"Get Muse Pro"** for a free user, both opening `BuyCreditsModal` (which itself renders
  > `SubscribeModal` for a non-subscriber, so label and destination cannot drift apart).
- 🔒 All credit state and the ledger are in-memory/static; nothing persists across reload; no store integration.

---

## 4. Journeys

Screens to capture later: SubscribeModal, BuyCreditsModal, `/profile/credits`.

### CR-P1 — Buy credits (subscriber-only)

- **CR-P1-S0** (non-subscriber) Open `BuyCreditsModal` → it **renders `SubscribeModal` directly**, with no intermediate "Credit packs are a Muse Pro perk" gate screen and no "See Muse Pro Plans" step (CR-06). ⚠️ The gate screen this step used to describe no longer exists.
- **CR-P1-S1** (subscriber) Open `BuyCreditsModal` (header badge / account menu / profile). **System:** shows balance + 6 packs (2,000 BEST VALUE preselected).
- **CR-P1-S2** Pick a pack → **Buy Now** → `addCredits(pack.credits)`, toast "Added N credits", close. Balance updates in the shell (in-memory).

### CR-P2 — Subscribe (Muse Pro)

- **CR-P2-S1** Open `SubscribeModal` (profile Muse Pro row). **System:** the "Upgrade Your Plan" dialog with 3 plan cards, Weekly Pro `--featured`. **There is no preselection** — each card carries its own credit count, expiry line and Subscribe button (3f).
- **CR-P2-S2** Press a card's **Subscribe** → `subscribe(plan)` (account → subscriber) + `addCredits(plan.credits)` + toast, close. Avatar gains the gold ring / PRO badge (areas 01/06).

### CR-P3 — Credits detail

- **CR-P3-S1** Navigate to `/profile/credits` (profile Credits tile / Muse Pro **Manage** — both `router.push`, no longer a modal). **System:** balance + All/Spend/Earn filter + static ledger + **Buy More** → `BuyCreditsModal`.
- **CR-P3-S2** Pick **Spend** or **Earn** → the ledger filters to negative / positive entries; **All** restores all 7.
- **CR-P3-S3** Back → `/profile`. The route is deep-linkable and survives browser back/forward — the reason it stopped being a modal.

---

## 5. Error & edge states

| ID        | Trigger                                                                                                | Behaviour                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CR-E1** | Reload after buy/subscribe                                                                             | Balance resets to 390; subscription cleared (in-memory; → `TBD-GL-04`).                                                                          |
| **CR-E2** | Ledger vs balance mismatch                                                                             | The ledger is a fixed seed; it never matches actual `addCredits` history 🔒 (→ `TBD-CR-04`).                                                     |
| **CR-E3** | Already subscribed                                                                                     | `SubscribeModal` shows the **"You're already on Muse Pro"** state (no plan picker / re-subscribe) — CR-05 landed 2026-07-23.                     |
| **CR-E4** | Insufficient balance for a generation                                                                  | The CTA opens `BuyCreditsModal` (IAP) instead of starting the job (GL-01). For a **non-subscriber** that modal renders `SubscribeModal` (CR-06). |
| **CR-E5** | Free user anywhere credits could be bought (header, account menu, profile Credits detail, low-balance) | No Buy-Credits UI is shown — the entry is **Subscribe** and `BuyCreditsModal` renders `SubscribeModal` (CR-06).                                  |

---

## 6. Acceptance criteria (EARS)

- **AC-CR-01** — WHEN a credit pack is purchased, THE SYSTEM SHALL add the pack's credits to the balance, toast, and close — with no real payment step.
- **AC-CR-02** — WHEN a plan is subscribed, THE SYSTEM SHALL set the account to subscriber, add the plan's credits, and reflect PRO status in the shell/profile.
- **AC-CR-03** — WHEN a signed-in user opens `/profile/credits`, THE SYSTEM SHALL show the current balance, the All/Spend/Earn filter, the static transaction ledger, and a purchase CTA. WHEN a guest opens it, `AuthGuard` SHALL require sign-in first. _(rewritten 2026-08-12: was "WHEN `CreditsDetailModal` opens")_
- **AC-CR-04** — THE SYSTEM SHALL show `SubscribeModal`'s footer disclaimer "Demo only — no real payment"; `BuyCreditsModal`'s "Purchased credits are valid for 2 years. Non-refundable and lost upon account deletion. Prices may vary by region."; and no disclaimer on the `/profile/credits` screen. _(as-built per-surface copy — the longer "Subscription credits expire each cycle. Cancel anytime." string was replaced in 3f by the per-plan "Credits Expire {cadence}" line inside each card, and the pack cards carry their own "Subscriber-only · No commitment" framing no longer.)_
- **AC-CR-05** — THE SYSTEM SHALL render the three dialogs at 320/375/768/1024/1440/1920px with no overflow. _(visual — six widths since plan D2, not the old four)_
- **AC-CR-06** — WHILE already subscribed, WHEN `SubscribeModal` opens, THE SYSTEM SHALL show the "You're already on Muse Pro" state (no plan cards) with a **Done** action. ⚠️ **Restore Purchases is NOT reachable from that state** — the subscribed branch returns before the footer. This is **pre-existing, not a migration regression** (`5296f1a` behaved identically); the AC has been wrong since CR-05 landed. Decide whether Restore belongs in the subscribed state (arguably where a user would look for it) → `TBD-CR-08`.
- **AC-CR-07** — WHEN a generation is started with `credits < cost`, THE SYSTEM SHALL open the buy-credits IAP instead of generating (GL-01).
- **AC-CR-08** — WHILE NOT subscribed, THE SYSTEM SHALL never present a Buy-Credits affordance: entry points (header, account menu, Credits-detail CTA) SHALL show **Subscribe**, and `BuyCreditsModal` SHALL render `SubscribeModal` (credits are subscriber-only — Business Model Final Decision).
- **AC-CR-09** — WHEN a Muse Pro plan is selected in `SubscribeModal`, THE SYSTEM SHALL update the header credit count and expiry cadence to that plan (200 Weekly / 1,000 Weekly / 2,000 Yearly); default selection SHALL be **Weekly Pro**.
- **AC-CR-10** — WHILE `CREDIT_SALE_PCT > 0`, THE SYSTEM SHALL render the discount sample in `BuyCreditsModal`: a struck-through list price, a "N% OFF" badge per pack (rounded up to the nearest 5), and the sale price on the Buy CTA. _(sample of the Business Model discount presentation — `TBD-CR-07`)_

> Charging is now real within the in-memory economy (GL-01); persistence, a live ledger, real IAP, and real reset/expiry remain backend-deferred (§8).

---

## 7. Per-path QA checklist

- [ ] **CR-P1**: non-subscriber sees **Subscribe** everywhere, never Buy Credits (AC-08); subscriber sees 6 packs with **2,000 BEST VALUE** preselected + the discount sample (struck price + N% OFF, AC-10); Buy adds pack credits + toast; balance updates (AC-01).
- [ ] **CR-P2**: three plan cards, Weekly Pro featured, **no preselection**; each card's credits/cadence/price come from `SUBSCRIPTION_PLANS` and Yearly reads **"/ year"**, not "/ week" (AC-09); a card's Subscribe → subscriber + credits + PRO badge (AC-02).
- [ ] **CR-P3**: detail shows balance + 7-entry ledger + a purchase CTA that reads **Buy More** for a subscriber and **Get Muse Pro** for a free user (AC-03).
- [ ] **CR-E1**: reload resets balance/subscription. **CR-E2**: ledger static. **CR-E3**: already-Pro state shown. **CR-E5**: non-subscriber Buy Credits → `SubscribeModal` directly (no gate screen).
- [ ] **AC-04/05**: SubscribeModal shows the short demo disclaimer, BuyCredits the expiry/refund copy, CreditsDetail none; dialogs clean at **six** widths _(visual)_.

---

## 8. Open items for RD

| ID             | Open item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TBD-CR-01**  | 🔧 **Backend (RD)** — real IAP (App Store / Play Store) for packs and subscription. None today (instant `addCredits`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **TBD-CR-04**  | 🔧 **Backend (RD)** — live credit ledger. `/profile/credits` shows a static seed, not real transactions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **TBD-CR-06a** | ⏳ **Free-user starting balance** — credits are subscriber-only (gating resolved), but the real free-tier credit grant is still open. The web demo keeps `DEFAULT_CREDITS = 390` so it stays playable pre-subscription — is the real value 0? a small trial pack? Proposal 2's 45-credit entry pack?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **TBD-CR-07**  | ⏳ **IAP presentation** — `BuyCreditsModal` demonstrates the discount UI (struck price + "N% OFF" badge, `CREDIT_SALE_PCT`) as a **sample only**. Still open: the real promotion values, the "% off vs 300 credits" value framing, the "View all plans" expand, and the final grid/list/popup layout choice.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **TBD-CR-08**  | ⏳ **Product (raised 2026-08-06)** — **Restore Purchases is unreachable while subscribed** (the already-Pro branch returns before the footer). Pre-existing, not caused by the migration. Decide whether it belongs there; AC-CR-06 is annotated until then.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ~~**TBD-CR-10**~~ | ✅ **CLOSED 2026-08-12 — ruled AND fixed.** The spec was correct: a free user may only **Upgrade**; **Buy Credits appears only after subscribing**. The unauthorized 2026-08-11 reversal is reverted — `BuyCreditsModal` gates on `subscribed` again (returning `SubscribeModal` for a free user) and `CreditsView`'s CTA branches to "Get Muse Pro". Nothing in this file needed rewriting, which was the point of leaving it alone while the question was open. The missing free-user comp is still owed by the designer (`DESIGNER-TODO` A21) — adopting it later is a label/style change, not a behaviour change. |
| **TBD-CR-09**  | 🎨 **Designer (from 3f)** — DP's `UpgradeDialog` disagrees with the approved Business Model in three places: Weekly at **$9.99** (approved: $19.99), a hardcoded **"/ week"** on the Yearly card, and "credits **never expire**" against the approved 2-year validity. WA follows the Business Model (S20). Please correct the comp so the next drop does not re-introduce them.                                                                                                                                                                                                                                                                                                                                                                                                                                              |

See also global: `TBD-GL-01` (credit charging/spending), `TBD-GL-04` (persistence).

---

## 9. Flow diagram

```mermaid
flowchart TD
  Badge["Header badge / Account menu / Profile"] --> Buy["BuyCreditsModal"]
  Profile["Profile Muse Pro row (area 06)"] --> Sub["SubscribeModal (plans)"]
  ProfileCredits["Profile Credits tile"] --> Detail["/profile/credits route (balance + filter + ledger)"]
  Detail --> Buy
  Buy -->|subscriber?| Q{"subscribed"}
  Q -->|no| Sub
  Q -->|yes| Packs["Pack picker (6 packs)"]
  Packs -->|Buy Now| Add["addCredits(pack) — in-memory"]
  Sub -->|Subscribe| Grant["subscribe(plan) + addCredits(plan) — in-memory"]
```

---

**Decisions (as-built):** credits are in-memory + display-mostly; modals are demo-only (no store);
ledger is a static seed; pricing, credit grants, and SKUs match the approved Business Model
(2026-07-13); credits are subscriber-only (free users see only Subscribe, never Buy Credits); the
discount UI is a sample. Free-user starting balance, the discount values, and the final IAP layout
remain open (`TBD-CR-06a/07`).
