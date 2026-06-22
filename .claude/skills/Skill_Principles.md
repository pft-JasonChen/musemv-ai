---
name: Skill_Principles
description: Cross-cutting design judgment — visual hierarchy, density, affordance, icon-vs-label decisions. Always loaded alongside Skill_Core.
user-invocable: false
---

> **⚠️ SUPERSEDED 2026-05-18 — see `skills/web-design-system/`.**
> Component-level judgment lives in `skills/web-design-system/references/component-catalog.md`. Density / affordance / hierarchy still load from this file at build time, but will be folded into `references/principles.md` in a follow-up. Retained as reference until 2 consecutive prototype builds pass with the new skill (per `Project/2026-05-15-design-system-rebuild/plan.md` §4 Phase 6).

# Skill_Principles.md — Cross-Cutting Design Judgment

> Always loaded. Governs the judgment calls that sit *between* tokens (Skill_Core) and components (domain skills). This file says **which component, at what density, with what affordance, at what hierarchy weight** — it does not define the tokens or the components themselves.

---

## 1. Visual Hierarchy

### 1.1 Three-tier rule
Every frame has exactly **three** hierarchy tiers visible at once:

| Tier | Role | Typical tokens |
|---|---|---|
| Primary | One action or one read per frame — the thing the user came for | `type/display`, `color/text/strong`, `color/bg/brand` on CTAs |
| Secondary | Supporting actions, metadata the user needs but didn't come for | `type/body`, `color/text/primary`, neutral surface tokens |
| Tertiary | Wayfinding, timestamps, counts, help text | `type/caption`, `color/text/muted` |

More than three tiers → hierarchy is broken; collapse Secondary and Tertiary or demote Primary.

### 1.2 Primary-action law
Exactly **one** `Button / Tone=Brand / Variant=Primary` per frame. All other buttons on the same frame are `Variant=Secondary`, `Variant=Tertiary`, or `Variant=Ghost`. Two primaries = rejected.

### 1.3 Destructive override
A destructive primary (`Tone=Destructive`) may replace the brand primary on that frame — still only one primary allowed.

---

## 2. Density

### 2.1 Surface density map

| Surface | Density | Row height baseline |
|---|---|---|
| Editor canvas (inspector, tool rail) | Compact | 28–32 |
| Studio shell (nav, drawers) | Compact | 32–40 |
| Dashboard (card grid, tables) | Comfortable | 44–56 |
| Marketing | Spacious | ≥ 72 |
| Flow (onboarding, billing) | Comfortable | 48–56 |

Baseline is the row height of the densest interactive element on that surface — bind via `spacing/*` variables, never hardcoded.

### 2.2 Line-length rule
Body text line length stays between 45 and 75 characters. Wider → split into columns or constrain the reading container. Narrower → collapse to a single column.

### 2.3 Information density escalation
If a surface is showing > 7 pieces of metadata per row, promote the pattern to a `Table` with sortable columns instead of stacked `Summary list` items.

---

## 3. Affordance

### 3.1 Icon-vs-label decision

| Condition | Affordance |
|---|---|
| Action is reversible AND icon is in the shared icon set AND surface is dense | Icon-only with `Tooltip` |
| Action is destructive | Icon + label, always |
| Action is novel (< 6 weeks old in the product) | Icon + label, always |
| Action is one-of-one on the frame | Full `Button` with label |
| Action is part of a set of ≥ 4 sibling actions on dense surface | Icon-only with `Tooltip` |

Never use icon-only for a destructive action, even with tooltip.

### 3.2 Clickable affordance minimums
- Target size: ≥ 32 × 32 on pointer surfaces, ≥ 44 × 44 on touch-first flows (map to `spacing/*` tokens).
- Hover state: required for every interactive node except decorative ones.
- Focus state: required, visible, and ≥ 3:1 contrast against the adjacent surface.

### 3.3 Disabled vs hidden
- If the action is temporarily unavailable → `State=Disabled` with `Tooltip` explaining why.
- If the user cannot perform the action at all in their role → hide it.

Never show a disabled control with no explanation.

---

## 4. Motion & feedback

### 4.1 Feedback latency thresholds

| Latency | Affordance |
|---|---|
| < 100 ms | No indicator needed |
| 100 ms – 1 s | `Loading bar` inline in the control |
| 1 s – 10 s | `Progress indicator` with determinate value where possible |
| > 10 s (AI async jobs) | `Progress indicator / Tone=AI` + non-blocking toast on completion |

### 4.2 Motion tokens only
All transitions bind to `motion/*` tokens from `Skill_Core.md`. No ad-hoc durations, no ad-hoc easings.

---

## 5. Emptiness & error judgment

### 5.1 Empty state tiers

| Trigger | Tier | Component |
|---|---|---|
| User hasn't done anything yet | First-run | `EmptyState / Variant=Onboarding` |
| Filters exclude all rows | Filtered-empty | `EmptyState / Variant=NoResults` |
| Query returned nothing | Search-empty | `EmptyState / Variant=NoResults` |
| System error | Error-empty | `EmptyState / Variant=Error` + recovery CTA |

A surface that can be empty but has no `EmptyState` instance = rejected.

### 5.2 Error recovery
Every error state must offer either a retry affordance or a route out (back, home, cancel). No dead ends.

---

## 6. Routing rules — when this skill decides vs defers

| Question | Answer here? | Or defer to |
|---|---|---|
| Which variant of Button? | Yes | — |
| What color token for muted text? | Defer | `Skill_Core.md` |
| How does a specific component compose? | Defer | Domain skill (Forms/Nav/etc.) |
| Should this gallery use justified or masonry? | Defer | `Skill_Gallery.md` (answer is always justified) |
| Which density for this surface? | Yes | — |
| Is two primary buttons OK? | Yes — no | — |
| Should I show a disabled state or hide it? | Yes | — |

---

## 7. Self-check before emitting any frame

- [ ] Exactly one primary action identified.
- [ ] Three-tier hierarchy verified.
- [ ] Density matches surface map (§2.1).
- [ ] Every icon-only control has a `Tooltip`.
- [ ] Every disabled control has a reason.
- [ ] Every possibly-empty surface has an `EmptyState`.
- [ ] No bespoke motion durations.
