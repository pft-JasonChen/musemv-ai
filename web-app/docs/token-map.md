# Token map — WA ⇄ DP

> **GENERATED — do not hand-edit.** `node scripts/build-token-map.mjs`
> Sources: `src/styles/tokens.css` · `/Users/jasonchen/Downloads/YCM-main/src/styles/tokens.css`
> Generated 2026-08-04. Gate **G2-a** (`redesign-migration-plan-2026-08-01.md` §10).

Matching is **by value**, which is what plan §4.1 asserts is already true ("顏色不是重畫,
是改名對映"). It cannot tell you which *name* is semantically correct — that is the
judgement G2-a asks a human for. Re-run after every designer drop (§12 step 1).

**Themes.** WA has no light theme — its `:root` is dark. DP ships both, and **9
DP variables hold different values in `[data-theme="light"]` vs `[data-theme="dark"]`. This
map compares DARK to DARK.** DP's light values are not mapped here and are not lost: plan D2
step 4 requires `<html data-theme="dark">` on the root layout, without which DP's `--color-*`
all resolve to their light values. That single missing attribute would make every migrated
screen wrong in a way that looks like a CSS bug.

**DP is not final** (expected 2026-08-04). Treat `wa-only` and `dp-only` as "not yet
mapped", not as "missing" — the designer has 11 of our 20 routes still undesigned.

| | count |
|---|---|
| WA tokens | 80 |
| DP tokens (dark theme) | 179 |
| DP names that differ between light and dark | 9 |
| exact value match | 12 |
| ambiguous (one WA value → several DP names) | 44 |
| WA-only (no DP token with this value) | 24 |
| DP-only | 65 |

---

## 1. The §4.2 conflicts, verified against the live files

These are the five the plan flagged as the main sources of "視覺走鐘". Values below are
read from the actual token files, so this table stops being a claim and starts being a check.

| item | WA | value | DP | value | agree? | note |
|---|---|---|---|---|---|---|
| radius scale | `--r-xl` | `14px` | `--radius-md` | `14px` | ✅ same | plan §4.2: the whole ladder differs — WA rounded-xl (14px) equals DP --radius-md |
| type-name ladder | `--fs-headline` | `20px` | `--font-title-m` | `20px` | ✅ same | plan §4.2: names are off by one step — DP title-m (20px) is WA headline |
| pink | `--accent-2` | `#EC4899` | `--pf-pink` | `#F23B77` | 🔴 differs | different colours |
| blue | `--blue` | `#38BDF8` | `--pf-light-blue` | `#03ADE2` | 🔴 differs | different colours |
| gradient angle | `--mv-grad` | `linear-gradient(135deg,#ff6bce 0%,#a855f7 50%,#4338ca 100%)` | `--gradient-mv` | `(absent)` | 🔴 differs | 135deg vs 90deg — confirm the Figma source |

## 2. The two ladders R2 is about

> **Measured verdict on R2** (plan rates it 🔴 高, "圓角級距 / 字級命名階梯 ... 完全不同"):
> · **Type scale — 11/11 steps carry the SAME value.**
> Every step matches. The type half of R2 is a **pure rename**, not a redesign — a `token-aliases.css` mapping closes it with zero visual change.
> · **Radius — 4/10 values shared.** WA-only: 8px, 10px. DP-only: 20px, 22px, 26px, 999px.
> The shared steps are renames; the DP-only larger steps are the real change (a rounder
> visual language — that is **S17**, a design decision, not a mapping bug).
>
> Net: R2's type half looks over-rated, its radius half is real but narrow. Worth
> re-rating before Phase 1 sizing — but confirm against the 2026-08-04 final first.

### Radius

DP writes radius in `rem`, WA in `px`; both are normalised to px at the 16px root here. Rows marked ✅ are the SAME number under a different name — a rename, not a redesign.

| value | WA token | DP token | aligned? |
|---|---|---|---|
| `8px` | `--r-sm` | — | WA only |
| `10px` | `--r-md` | — | WA only |
| `12px` | `--r-lg` | `--radius-sm` | ✅ same value |
| `14px` | `--r-xl` | `--radius-md` | ✅ same value |
| `16px` | `--r-2xl` | `--radius-lg` | ✅ same value |
| `20px` | — | `--radius-xl` | DP only |
| `22px` | — | `--radius-2xl` | DP only |
| `26px` | — | `--radius-3xl` | DP only |
| `999px` | — | `--radius-pill` | DP only |
| `9999px` | `--r-pill` | `--radius-full` | ✅ same value |

### Type size

WA `--fs-*` vs DP's semantic `--font-*` (the `--font-web-*` / `--font-mobile-*` platform ramps are excluded — they are DP-internal, not the semantic scale).

| value | WA token | DP token | aligned? |
|---|---|---|---|
| `9px` | `--fs-body-xs` · `--fs-cap-s` | `--font-body-xs` · `--font-caption-s` | ✅ same value |
| `11px` | `--fs-cap-m` | `--font-caption-m` | ✅ same value |
| `12px` | `--fs-body-s` · `--fs-label-s` | `--font-body-s` · `--font-label-s` | ✅ same value |
| `13px` | `--fs-label-m` | `--font-label-m` | ✅ same value |
| `14px` | `--fs-body-m` | `--font-body-m` | ✅ same value |
| `15px` | `--fs-title-xs` | `--font-title-xs` | ✅ same value |
| `17px` | `--fs-title-s` · `--fs-section` · `--fs-body-l` | `--font-section` · `--font-title-s` · `--font-body-l` | ✅ same value |
| `20px` | `--fs-headline` | `--font-headline` · `--font-title-m` | ✅ same value |
| `26px` | `--fs-title-m` | `--font-title-l` | ✅ same value |
| `30px` | `--fs-title-l` | `--font-title-xl` | ✅ same value |
| `42px` | `--fs-display` | `--font-display` | ✅ same value |


## 3. Mapped by value

### Exact match — safe to alias (12)

| WA token | value | DP token | category |
|---|---|---|---|
| `--n94` | `#EEEEF1` | `--neutral-dark-94` | colour |
| `--border-2` | `rgba(255,255,255,0.15)` | `--white-15` | colour |
| `--accent` | `#A855F7` | `--purple-500` | colour |
| `--green` | `#01B37B` | `--pf-green` | colour |
| `--red` | `#FF2600` | `--pf-red` | colour |
| `--fs-display` | `42px` | `--font-display` | type |
| `--fs-label-m` | `13px` | `--font-label-m` | type |
| `--sp-1` | `4px` | `--spacing-4` | spacing |
| `--sp-2` | `8px` | `--spacing-8` | spacing |
| `--sp-10` | `40px` | `--spacing-40` | spacing |
| `--r-sm` | `8px` | `--spacing-8` | radius |
| `--r-pill` | `9999px` | `--radius-full` | radius |

### Ambiguous — one WA value maps to several DP names; pick deliberately (44)

| WA token | value | DP token | category |
|---|---|---|---|
| `--n04` | `#09090B` | `--neutral-dark-04` · `--neutral-light-100` | colour |
| `--n09` | `#151519` | `--neutral-dark-09` · `--neutral-light-94` | colour |
| `--n14` | `#212127` | `--neutral-dark-14` · `--neutral-light-89` | colour |
| `--n24` | `#383842` | `--neutral-dark-24` · `--neutral-light-84` | colour |
| `--n34` | `#50505E` | `--neutral-dark-34` · `--neutral-light-74` | colour |
| `--n44` | `#676779` | `--neutral-dark-44` · `--neutral-light-64` | colour |
| `--n54` | `#808093` | `--neutral-dark-54` · `--neutral-light-54` | colour |
| `--n64` | `#9C9CAB` | `--neutral-dark-64` · `--neutral-light-44` | colour |
| `--n74` | `#B7B7C2` | `--neutral-dark-74` · `--neutral-light-34` | colour |
| `--n84` | `#D3D3D9` | `--neutral-dark-84` · `--neutral-light-24` | colour |
| `--n89` | `#E1E1E5` | `--neutral-dark-89` · `--neutral-light-14` | colour |
| `--n100` | `#FFFFFF` | `--neutral-dark-100` · `--neutral-light-04` | colour |
| `--bg` | `#09090B` | `--neutral-dark-04` · `--neutral-light-100` | colour |
| `--card` | `#151519` | `--neutral-dark-09` · `--neutral-light-94` | colour |
| `--card-2` | `#212127` | `--neutral-dark-14` · `--neutral-light-89` | colour |
| `--card-3` | `#383842` | `--neutral-dark-24` · `--neutral-light-84` | colour |
| `--card-4` | `#50505E` | `--neutral-dark-34` · `--neutral-light-74` | colour |
| `--text` | `#FFFFFF` | `--neutral-dark-100` · `--neutral-light-04` | colour |
| `--text-2` | `#9C9CAB` | `--neutral-dark-64` · `--neutral-light-44` | colour |
| `--text-3` | `#B7B7C2` | `--neutral-dark-74` · `--neutral-light-34` | colour |
| `--text-4` | `#D3D3D9` | `--neutral-dark-84` · `--neutral-light-24` | colour |
| `--text-5` | `#676779` | `--neutral-dark-44` · `--neutral-light-64` | colour |
| `--fs-title-l` | `30px` | `--font-mobile-regular-large-title` · `--font-mobile-bold-large-title` · `--font-web-mobile-headline-1` · `--font-title-xl` | type |
| `--fs-title-m` | `26px` | `--font-web-mobile-headline-2` · `--font-title-l` · `--line-height-headline` · `--radius-3xl` | type |
| `--fs-title-s` | `17px` | `--font-mobile-regular-title-3` · `--font-mobile-bold-title-3` · `--font-section` · `--font-title-s` · `--font-body-l` | type |
| `--fs-title-xs` | `15px` | `--font-mobile-regular-title-5` · `--font-mobile-regular-button` · `--font-mobile-bold-title-5` · `--font-mobile-bold-button` · `--font-title-xs` · `--line-height-label-s` | type |
| `--fs-headline` | `20px` | `--font-mobile-regular-title-1` · `--font-mobile-bold-title-1` · `--font-web-desktop-headline-5` · `--font-web-desktop-body-2` · `--font-web-mobile-headline-3` · `--font-web-mobile-button-1` · `--font-headline` · `--font-title-m` · `--line-height-body-m` · `--spacing-20` · `--radius-xl` | type |
| `--fs-section` | `17px` | `--font-mobile-regular-title-3` · `--font-mobile-bold-title-3` · `--font-section` · `--font-title-s` · `--font-body-l` | type |
| `--fs-body-l` | `17px` | `--font-mobile-regular-title-3` · `--font-mobile-bold-title-3` · `--font-section` · `--font-title-s` · `--font-body-l` | type |
| `--fs-body-m` | `14px` | `--font-mobile-regular-body-1` · `--font-mobile-bold-body-1` · `--font-body-m` · `--radius-md` | type |
| `--fs-body-s` | `12px` | `--font-mobile-regular-body-2` · `--font-mobile-regular-subheadline` · `--font-mobile-bold-body-2` · `--font-mobile-bold-subheadline` · `--font-web-desktop-body-5` · `--font-body-s` · `--font-label-s` · `--spacing-12` · `--radius-sm` | type |
| `--fs-body-xs` | `9px` | `--font-mobile-regular-caption-2` · `--font-mobile-bold-caption-2` · `--font-body-xs` · `--font-caption-s` | type |
| `--fs-label-s` | `12px` | `--font-mobile-regular-body-2` · `--font-mobile-regular-subheadline` · `--font-mobile-bold-body-2` · `--font-mobile-bold-subheadline` · `--font-web-desktop-body-5` · `--font-body-s` · `--font-label-s` · `--spacing-12` · `--radius-sm` | type |
| `--fs-cap-m` | `11px` | `--font-mobile-regular-footnote` · `--font-mobile-bold-footnote` · `--font-caption-m` · `--line-height-body-xs` · `--line-height-caption-s` | type |
| `--fs-cap-s` | `9px` | `--font-mobile-regular-caption-2` · `--font-mobile-bold-caption-2` · `--font-body-xs` · `--font-caption-s` | type |
| `--sp-3` | `12px` | `--font-mobile-regular-body-2` · `--font-mobile-regular-subheadline` · `--font-mobile-bold-body-2` · `--font-mobile-bold-subheadline` · `--font-web-desktop-body-5` · `--font-body-s` · `--font-label-s` · `--spacing-12` · `--radius-sm` | spacing |
| `--sp-4` | `16px` | `--font-mobile-regular-title-4` · `--font-mobile-bold-title-4` · `--font-web-desktop-body-4` · `--font-web-mobile-headline-5` · `--line-height-caption-m` · `--spacing-16` · `--radius-lg` | spacing |
| `--sp-5` | `20px` | `--font-mobile-regular-title-1` · `--font-mobile-bold-title-1` · `--font-web-desktop-headline-5` · `--font-web-desktop-body-2` · `--font-web-mobile-headline-3` · `--font-web-mobile-button-1` · `--font-headline` · `--font-title-m` · `--line-height-body-m` · `--spacing-20` · `--radius-xl` | spacing |
| `--sp-6` | `24px` | `--font-web-desktop-headline-4` · `--font-web-desktop-button-1` · `--line-height-title-m` · `--spacing-24` | spacing |
| `--sp-8` | `32px` | `--line-height-title-l` · `--spacing-32` | spacing |
| `--r-md` | `10px` | `--font-mobile-regular-caption-1` · `--font-mobile-bold-caption-1` | radius |
| `--r-lg` | `12px` | `--font-mobile-regular-body-2` · `--font-mobile-regular-subheadline` · `--font-mobile-bold-body-2` · `--font-mobile-bold-subheadline` · `--font-web-desktop-body-5` · `--font-body-s` · `--font-label-s` · `--spacing-12` · `--radius-sm` | radius |
| `--r-xl` | `14px` | `--font-mobile-regular-body-1` · `--font-mobile-bold-body-1` · `--font-body-m` · `--radius-md` | radius |
| `--r-2xl` | `16px` | `--font-mobile-regular-title-4` · `--font-mobile-bold-title-4` · `--font-web-desktop-body-4` · `--font-web-mobile-headline-5` · `--line-height-caption-m` · `--spacing-16` · `--radius-lg` | radius |

### WA-only — no DP token carries this value yet (24)

| WA token | value | DP token | category |
|---|---|---|---|
| `--border` | `rgba(255,255,255,0.09)` | — | colour |
| `--border-3` | `rgba(255,255,255,0.06)` | — | colour |
| `--accent-2` | `#EC4899` | — | colour |
| `--blue` | `#38BDF8` | — | colour |
| `--gold` | `#F59E0B` | — | colour |
| `--orange` | `#F97316` | — | colour |
| `--premium` | `#FFA614` | — | colour |
| `--mv-grad` | `linear-gradient(135deg,#ff6bce 0%,#a855f7 50%,#4338ca 100%)` | — | gradient |
| `--song-grad` | `linear-gradient(135deg,#ffb347 0%,#ff4e50 50%,#d63af9 100%)` | — | gradient |
| `--font-sans` | `'inter', -apple-system, 'sf pro display', system-ui, sans-serif` | — | type |
| `--shadow-cta` | `0 8px 12px rgba(168,85,247,0.32)` | — | other |
| `--shadow-card` | `0 6px 16px rgba(0,0,0,0.3)` | — | other |
| `--dur-fast` | `0.15s` | — | other |
| `--dur-base` | `0.2s` | — | other |
| `--dur-slow` | `0.3s` | — | other |
| `--ease-standard` | `cubic-bezier(0.4,0,0.2,1)` | — | other |
| `--safe-top` | `env(safe-area-inset-top,48px)` | — | other |
| `--safe-bot` | `env(safe-area-inset-bottom,20px)` | — | other |
| `--tab-h` | `66px` | — | other |
| `--nav-h` | `52px` | — | other |
| `--bp-mobile` | `390px` | — | other |
| `--bp-tablet` | `768px` | — | other |
| `--bp-laptop` | `1024px` | — | other |
| `--bp-desktop` | `1440px` | — | other |


## 4. DP-only — new tokens arriving with the redesign (65)

<details><summary>expand</summary>

| DP token | value |
|---|---|
| `--pf-light-blue` | `#03ADE2` |
| `--pf-light-blue-80` | `rgba(3,173,226,0.8)` |
| `--pf-light-blue-60` | `rgba(3,173,226,0.6)` |
| `--pf-light-blue-40` | `rgba(3,173,226,0.4)` |
| `--pf-orange` | `#FF8A02` |
| `--pf-orange-80` | `rgba(255,138,2,0.8)` |
| `--pf-orange-60` | `rgba(255,138,2,0.6)` |
| `--pf-orange-40` | `rgba(255,138,2,0.4)` |
| `--pf-dark-blue` | `#403EDF` |
| `--pf-dark-blue-80` | `rgba(64,62,223,0.8)` |
| `--pf-dark-blue-60` | `rgba(64,62,223,0.6)` |
| `--pf-dark-blue-40` | `rgba(64,62,223,0.4)` |
| `--pf-pink` | `#F23B77` |
| `--pf-pink-80` | `rgba(242,59,119,0.8)` |
| `--pf-pink-60` | `rgba(242,59,119,0.6)` |
| `--pf-pink-40` | `rgba(242,59,119,0.4)` |
| `--pf-green-80` | `rgba(1,179,123,0.8)` |
| `--pf-green-60` | `rgba(1,179,123,0.6)` |
| `--pf-green-40` | `rgba(1,179,123,0.4)` |
| `--pf-purple` | `#9132FF` |
| `--pf-purple-80` | `rgba(145,50,255,0.8)` |
| `--pf-purple-60` | `rgba(145,50,255,0.6)` |
| `--pf-purple-40` | `rgba(145,50,255,0.4)` |
| `--pf-red-80` | `rgba(255,38,0,0.8)` |
| `--pf-red-60` | `rgba(255,38,0,0.6)` |
| `--pf-red-40` | `rgba(255,38,0,0.4)` |
| `--white-40` | `rgba(255,255,255,0.4)` |
| `--white-60` | `rgba(255,255,255,0.6)` |
| `--white-80` | `rgba(255,255,255,0.8)` |
| `--black-15` | `rgba(9,9,11,0.15)` |
| `--black-40` | `rgba(9,9,11,0.4)` |
| `--black-60` | `rgba(9,9,11,0.6)` |
| `--black-80` | `rgba(9,9,11,0.8)` |
| `--neutral-light-09` | `#F7F7F7` |
| `--font-mobile-regular-title-2` | `18px` |
| `--font-mobile-bold-title-2` | `18px` |
| `--font-web-desktop-headline-1` | `48px` |
| `--font-web-desktop-headline-2` | `38px` |
| `--font-web-desktop-headline-3` | `28px` |
| `--font-web-desktop-button-2` | `18px` |
| `--font-web-desktop-body-1` | `22px` |
| `--font-web-desktop-body-3` | `18px` |
| `--font-web-mobile-headline-4` | `18px` |
| `--font-web-mobile-button-2` | `18px` |
| `--color-action-primary` | `#03ADE2` |
| `--color-action-warning` | `#FF8A02` |
| `--font-family-primary` | `inter, sans-serif` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |
| `--font-weight-extrabold` | `800` |
| `--line-height-display` | `50px` |
| `--line-height-section` | `22px` |
| `--line-height-title-xl` | `36px` |
| `--line-height-title-s` | `22px` |
| `--line-height-title-xs` | `18px` |
| `--line-height-body-l` | `22px` |
| `--line-height-label-m` | `18px` |
| `--spacing-28` | `28px` |
| `--spacing-48` | `48px` |
| `--radius-2xl` | `22px` |
| `--radius-pill` | `999px` |
| `--blur-glass` | `3px` |
| `--opacity-disabled` | `0.3` |
| `--overlay-hover-dark` | `rgba(0,0,0,0.2)` |

</details>

---

## How this feeds the gates

- **G2-a** — this file existing and reviewed. The §1 table is the part to review first.
- **G2-b** — `scripts/computed-style-diff.mjs` captures computed styles before/after the
  token swap; a correct map means **zero** diff on the 20 existing routes.
- **G2-c** — `npm run e2e:visual` pixel-compares six widths against the Phase-0 baseline.
- **D2 (decided)** — DP becomes the token source of truth with `token-aliases.css` keeping
  WA's semantic names alive. §2's "exact match" rows are the ones that alias cleanly; the
  §1 conflicts need a decision before Phase 1 starts.
