# Area 07 — Credits & IAP

> Read `../00-overview.md` first (conventions, ID scheme, global credits model §6). **As-built**;
> ⚠️ = divergence from App v3.0, ❓ = a tracked `TBD-*`, 🔒 = mock/in-memory.
>
> ⚠️ **Backend note (G3):** there is **no real payment** — every purchase/subscribe just mutates the
> in-memory balance/flag. Real IAP (App Store / Play Store), persistence, credit reset/expiry, and
> restore-purchases are backend/store concerns this spec does **not** define (`TBD-CR-*`).

---

## 1. Overview & scope

Credit balance + the three monetization modals. `CreditsProvider` holds an in-memory balance;
`SubscribeModal` (Muse Pro plans), `BuyCreditsModal` (credit packs), and `CreditsDetailModal` (balance
+ ledger) are opened from the shell, account menu, and profile. Disclaimer copy differs per modal:
only **`SubscribeModal`** says "Demo only — no real payment"; `BuyCreditsModal` shows a
non-refundable / 12-month-expiry / prices-vary note; `CreditsDetailModal` has none.

**In scope:** `providers/CreditsProvider`, `credits/SubscribeModal`, `credits/BuyCreditsModal`,
`credits/CreditsDetailModal`; the plan/pack/ledger data in `lib/user.ts`.
**Out of scope (cross-referenced):** entry points — header credits badge + account menu Buy Credits
(area 01), profile Credits tile / Muse Pro row (area 06); how generation *spends* credits (area 02
Edit MV; `TBD-GL-01`).

**Key divergences from App F20:** plans are **Weekly / Super Weekly / Yearly** (200 / 1000 / 2000 cr),
not the app's Weekly/Monthly/Yearly + "800 Weekly Credits" header + 6-feature list ⚠️; **no native IAP**
— purchase is instant `addCredits` 🔒; **no Restore Purchases** ⚠️; purchased credits show **"expire
after 12 months"** (app: purchased never expire; subscription credits reset per cycle — web has no
reset/expiry logic) ⚠️.

---

## 2. Route / component / state / API map (RD)

| Component | Owns UI | Reads/writes state | `MuseApi` |
|---|---|---|---|
| `providers/CreditsProvider` | — (state only) | `useState(DEFAULT_CREDITS=390)`, `addCredits(n)` | **none** |
| `credits/SubscribeModal` | Muse Pro plan picker + Subscribe CTA | `useAuth().subscribe`, `useCredits().addCredits`, `SUBSCRIPTION_PLANS` | — |
| `credits/BuyCreditsModal` | balance + credit-pack picker + Buy CTA | `useCredits().{credits,addCredits}`, `CREDIT_PACKS` | — |
| `credits/CreditsDetailModal` | balance + transaction ledger + Buy CTA | `useCredits().credits`, `CREDIT_TRANSACTIONS` | — |

No route of its own; opened as modals. No backend.

---

## 3. State model & rules

- **Balance** (`CreditsProvider.tsx:14-15`): single in-memory `credits` (`DEFAULT_CREDITS = 390`) +
  `addCredits(n)` (adds `n`, may be negative — the only negative callers are Edit MV, area 02). No
  balance gate anywhere; generation never blocks (→ `TBD-GL-01`). Resets to 390 on reload 🔒.
- **`SubscribeModal`** (`SubscribeModal.tsx`): title "Muse Pro"; blurb "More credits, faster renders,
  no watermark"; three `SUBSCRIPTION_PLANS` cards (code names **"Weekly Plan"** $9.99/200cr ·
  **"Super Weekly Plan"** $29.99/1000cr **POPULAR** · **"Yearly Plan"** $69.99/2000cr **BEST VALUE**);
  default selected **super**; **Subscribe** → `subscribe(plan)` + `addCredits(plan.credits)` +
  `onSubscribed` toast + close. Disclaimer: "Demo only — no real payment. Cancel anytime." Each card
  shows "resets {cadence}" — 🔒 **display-only, no reset logic exists** (→ `TBD-CR-03`).
- **`BuyCreditsModal`** (`BuyCreditsModal.tsx`): shows balance; four `CREDIT_PACKS` (**100** $0.99 ·
  **300** $2.49 **POPULAR** · **600** $4.49 · **1000** $6.49); default selected **300** (id 2);
  **Buy Now** → `addCredits(pack.credits)` + `onPurchased` toast + close. Copy: "non-refundable and
  expire after 12 months. Prices may vary by region." + "Cancel anytime · No commitment". 🔒 (no expiry logic exists).
- **`CreditsDetailModal`** (`CreditsDetailModal.tsx`): balance card + **Buy Credits** CTA + a
  **Transaction History** list rendered from the static 7-entry `CREDIT_TRANSACTIONS` seed
  (`lib/user.ts`) — 🔒 **not live**; it does not reflect `addCredits` calls.
- 🔒 All credit state and the ledger are in-memory/static; nothing persists across reload; no store integration.

---

## 4. Journeys

Screens to capture later: SubscribeModal, BuyCreditsModal, CreditsDetailModal.

### CR-P1 — Buy credits
- **CR-P1-S1** Open `BuyCreditsModal` (header badge / account menu / profile). **System:** shows balance + 4 packs (300 preselected).
- **CR-P1-S2** Pick a pack → **Buy Now** → `addCredits(pack.credits)`, toast "Added N credits", close. Balance updates in the shell (in-memory).

### CR-P2 — Subscribe (Muse Pro)
- **CR-P2-S1** Open `SubscribeModal` (profile Muse Pro row). **System:** 3 plans (super preselected).
- **CR-P2-S2** Pick a plan → **Subscribe** → `subscribe(plan)` (account → subscriber) + `addCredits(plan.credits)` + toast, close. Avatar gains the gold ring / PRO badge (areas 01/06).

### CR-P3 — Credits detail
- **CR-P3-S1** Open `CreditsDetailModal` (profile Credits tile / Muse Pro Manage). **System:** balance + static ledger + **Buy Credits** → `BuyCreditsModal`.

---

## 5. Error & edge states

| ID | Trigger | Behaviour |
|---|---|---|
| **CR-E1** | Reload after buy/subscribe | Balance resets to 390; subscription cleared (in-memory; → `TBD-GL-04`). |
| **CR-E2** | Ledger vs balance mismatch | The ledger is a fixed seed; it never matches actual `addCredits` history 🔒 (→ `TBD-CR-04`). |
| **CR-E3** | Already subscribed | No "already Pro" guard in the modal (App F20 shows one); Subscribe can be tapped again (→ `TBD-CR-05`). |

---

## 6. Acceptance criteria (EARS)

- **AC-CR-01** — WHEN a credit pack is purchased, THE SYSTEM SHALL add the pack's credits to the balance, toast, and close — with no real payment step.
- **AC-CR-02** — WHEN a plan is subscribed, THE SYSTEM SHALL set the account to subscriber, add the plan's credits, and reflect PRO status in the shell/profile.
- **AC-CR-03** — WHEN `CreditsDetailModal` opens, THE SYSTEM SHALL show the current balance, the static transaction ledger, and a Buy Credits CTA.
- **AC-CR-04** — THE SYSTEM SHALL show `SubscribeModal`'s "Demo only — no real payment. Cancel anytime." disclaimer; `BuyCreditsModal`'s "non-refundable / expire after 12 months / prices may vary" + "Cancel anytime · No commitment"; and no disclaimer on `CreditsDetailModal`. *(as-built per-modal copy)*
- **AC-CR-05** — THE SYSTEM SHALL render the three modals at 390/768/1024/1440px with no overflow. *(visual)*

> No AC asserts persistence, credit reset/expiry, restore, or real charging — those don't exist (§8).

---

## 7. Per-path QA checklist

- [ ] **CR-P1**: 300 preselected; Buy adds pack credits + toast; balance updates (AC-01).
- [ ] **CR-P2**: super preselected; Subscribe → subscriber + credits + PRO badge (AC-02).
- [ ] **CR-P3**: detail shows balance + 7-entry ledger + Buy Credits → BuyCreditsModal (AC-03).
- [ ] **CR-E1**: reload resets balance/subscription. **CR-E2**: ledger static. **CR-E3**: no already-Pro guard.
- [ ] **AC-04/05**: SubscribeModal shows the demo disclaimer, BuyCredits the expiry/refund copy, CreditsDetail none; modals clean at 4 widths *(visual)*.

---

## 8. Area TBD register — decisions 2026-07-22

**Decisions** — codebase change list in [`../handoff.md`](../handoff.md).

| ID | Decision |
|---|---|
| TBD-CR-01 | 🔧 **Backend (RD)** — real IAP (App Store / Play Store). |
| TBD-CR-02 | ✅ **Sync App** — plans = Weekly / Monthly / Yearly + "800 Weekly Credits" header + 6-feature list (reconcile current weekly/super/yearly). |
| TBD-CR-03 | ✅ **Sync App** — purchased credits never expire; subscription credits reset per cycle. |
| TBD-CR-04 | 🔧 **Backend (RD)** — live credit ledger. |
| TBD-CR-05 | ✅ **Sync App** — add Restore Purchases + "already on Muse Pro" state. |

See also global: `TBD-GL-01` (credit charging/spending), `TBD-GL-04` (persistence).

| ID | Question |
|---|---|
| **TBD-CR-01** | **Real IAP** — App Store / Play Store purchase for packs and subscription. None today (instant `addCredits`). |
| **TBD-CR-02** | **Plan structure** — App F20 = Weekly/Monthly/Yearly + "800 Weekly Credits" header + 6-feature list; web = Weekly/Super/Yearly (200/1000/2000). Finalize plans, prices, and credit grants. |
| **TBD-CR-03** | **Credit lifecycle** — App: purchased credits never expire, subscription credits reset per cycle; web shows "expire after 12 months" (copy only) and has no reset. Define the real rules. |
| **TBD-CR-04** | **Live ledger** — `CreditsDetailModal` shows a static seed, not real transactions. Wire to a real ledger. |
| **TBD-CR-05** | **Restore Purchases + already-Pro state** — App F20 has Restore Purchases and an "already on Muse Pro" state; web has neither. |

---

## 9. Flow diagram

```mermaid
flowchart TD
  Badge["Header badge / Account menu / Profile"] --> Buy["BuyCreditsModal (packs)"]
  Profile["Profile Muse Pro row (area 06)"] --> Sub["SubscribeModal (plans)"]
  ProfileCredits["Profile Credits tile"] --> Detail["CreditsDetailModal (balance + ledger)"]
  Detail --> Buy
  Buy -->|Buy Now| Add["addCredits(pack) — in-memory"]
  Sub -->|Subscribe| Grant["subscribe(plan) + addCredits(plan) — in-memory"]
```

---

## 10. Decisions & changelog

**Decisions (as-built):** credits are in-memory + display-mostly; modals are demo-only (no store);
ledger is a static seed; plans differ from the app.

| Date | Change |
|---|---|
| 2026-07-22 | Initial as-built spec. |
| 2026-07-22 | Validator fix: corrected disclaimer claim (only SubscribeModal shows "Demo only — no real payment"; per-modal copy in AC-CR-04); flagged plan-card "resets {cadence}" as display-only; noted code plan names. |
| 2026-07-23 | Implemented: plans restructured to Weekly / Monthly / Yearly with an "800 Weekly Credits" header + six-feature list; `PlanId` now `weekly\|monthly\|yearly`; per-period price suffix (CR-02); purchased credits "never expire" + subscription credits reset per cycle copy (CR-03); Restore Purchases action + "already on Muse Pro" state in `SubscribeModal` (CR-05). Prices/credit amounts are placeholders pending RD confirmation (see handoff status note). GL-01 real charging wired through the flow providers with an insufficient-balance → IAP route. |
