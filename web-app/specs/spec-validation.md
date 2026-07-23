# Spec Validation Eval

> **Purpose.** A repeatable rubric a **validator subagent** runs against every area spec **right
> after it is generated**, before the spec is considered done. It encodes the lessons from the
> first senior-RD review so the same defect classes can't recur across the 10-area rollout.
> **Basis reminder:** specs are **as-built** — the code in `web-app/src/` is the source of truth.
> The App Spec v3.0 (`muse_spec.txt`) is only for divergence flagging, never for asserting web
> behaviour.

---

## 0. The unknowns rule (hard, product-owner mandate)

**We never fill in anything uncertain.** Any behaviour that is backend-dependent, not yet
implemented, or a product decision — especially **account/auth system, credits/billing,
persistence, moderation, integrations** — must be **left blank or explicitly marked** (`TBD-*`, or an
inline "RD to fill" note), **not guessed**. Writing a plausible-but-unverified backend behaviour as if
it were fact is an automatic **BLOCKER** (gate G3).

A spec that honestly says "unknown — RD to define (`TBD-XX-##`)" passes. A spec that invents a
charging rule, an API shape, or a persistence guarantee fails.

---

## 1. How the validator runs

For the spec under test, the validator subagent MUST:
1. Read the spec file in full.
2. Read the actual code for that area (the components, provider(s), `contract.ts`/`schemas.ts`,
   `lib/*`, and `app/[locale]/.../page.tsx`) — **cite `file:line`** for every confirmation or dispute.
   Do not trust the spec's own claims.
3. Cross-check divergence claims against `muse_spec.txt` only where the spec asserts an "App ref".
4. Score every gate (G) and check (Q) below.
5. Emit the verdict block in §4.

The validator **does not edit** the spec — it reports. The author (main agent) applies fixes and
re-runs the validator until **PASS**.

---

## 2. Hard gates (any unmet BLOCKER ⇒ FAIL)

| Gate | Requirement |
|---|---|
| **G1 Accuracy** | Every factual claim (defaults, enum values, costs, which routes are auth-gated, navigation targets, what mutates credits, guard/redirect behaviour, tab defaults) is verifiable in code. **Zero contradictions** between spec and code. Each disputed claim → BLOCKER with `file:line`. |
| **G2 No invented artifacts** | No route, component, provider, hook, or `MuseApi` endpoint named that does not exist in code. No behaviour asserted that the code does not perform. Reference to a real file that does the opposite = BLOCKER. |
| **G3 No filled-in uncertainties** (see §0) | Backend/implementation/product unknowns are marked `TBD-*` or left blank — never guessed. Any invented backend/account/credit/persistence behaviour = BLOCKER. |
| **G4 ID hygiene** | IDs are area-qualified and unique: paths `AREA-P#`, steps `AREA-P#-S#`, errors `AREA-E#`, criteria `AC-AREA-##`, decisions `TBD-AREA-##`/`TBD-GL-##`. No collisions; every cross-referenced id resolves (exists in this spec or the overview). |
| **G5 Required sections present** | §1 Overview & scope · §2 Route/component/state/API map · §3 State model & rules · §4 Journeys (P/S/E) · §5 Error & edge states · §6 EARS acceptance criteria · §7 Per-path QA checklist · §8 Area TBD register · §9 Flow diagram · §10 Decisions & changelog. Missing a section = BLOCKER. |

---

## 3. Quality checks (scored MAJOR / MINOR; should be fixed before PASS)

| Check | Requirement |
|---|---|
| **Q1 Coverage** | Every route, screen, modal/sheet, and distinct interactive state that exists in the area's code appears in the spec. Code paths with no spec coverage → MAJOR. External entry points (e.g. via `CreationDialog`) are cross-referenced. |
| **Q2 Testable ACs** | Each AC is EARS-form ("WHEN/WHILE … THE SYSTEM SHALL …"), concrete enough to become a test, and maps to a path/step. Screenshot-dependent ACs are tagged *(visual)*. Vague/untestable AC → MAJOR. |
| **Q3 Traceability** | RD can trace requirement → route → component → provider/hook → `MuseApi` endpoint; QA can trace AC → path. The §2 map includes the `MuseApi` column. Gaps → MINOR. |
| **Q4 Divergence flagging** | Every point where web differs from App v3.0 is ⚠️-flagged and, if the correct behaviour is undecided, points at a `TBD-*`. Silent divergence (behaviour differs but unflagged) → MAJOR. |
| **Q5 Single source of truth** | No fact or TBD is restated with independent wording in multiple places (drift risk). Duplicates cross-reference by id instead. Duplicated fact → MINOR. |
| **Q6 Mock/persistence honesty** | Mock/seed/in-memory behaviour is marked 🔒; anything lost on reload is noted. Presenting mock behaviour as production behaviour → MAJOR. |
| **Q7 Edge/error coverage** | Error & edge section covers at least: auth-gate (logged-out), flow-guard/reload with missing state, the failure path, and empty states — where each applies to the area. Missing an applicable one → MAJOR. |
| **Q8 Conventions** | Follows the overview §0 conventions (markers ⚠️/❓/🔒, status vocabulary, token-names-not-hex). Deviations → MINOR. |

---

## 4. Validator output contract (the subagent's final message)

```
VERDICT: PASS | FAIL
Spec: <path>
Gates: G1 ✓/✗ · G2 ✓/✗ · G3 ✓/✗ · G4 ✓/✗ · G5 ✓/✗
Findings (ranked, most severe first):
- [BLOCKER|MAJOR|MINOR|NIT] <gate/check id> — <one-line defect>
  evidence: <file:line or quote>
  fix: <concrete suggested change>
Unverifiable: <any claim the validator could not confirm against code, listed explicitly>
```

Rules for the validator:
- **PASS requires all five gates ✓ and zero BLOCKER/MAJOR findings.** MINOR/NIT may remain if noted.
- Never invent `file:line`. If a claim can't be verified, list it under *Unverifiable* — do not pass it silently.
- If unsure whether something is a defect or an intended product decision, report it as a candidate
  `TBD-*` (belongs in §8), not as an accuracy defect.

---

## 5. Author's pre-submit self-check (before invoking the validator)

Quick list the author runs first, to avoid burning a validation round on obvious misses:
- [ ] Read the area's components + provider + page files; every claim traces to code.
- [ ] No invented endpoints/components; no guessed backend/account/credit behaviour (→ TBD instead).
- [ ] IDs area-qualified; cross-refs resolve; all 10 sections present.
- [ ] Divergences ⚠️-flagged; unknowns → `TBD`; mock → 🔒.
- [ ] ACs EARS + testable; §2 has the `MuseApi` column.

---

## 6. Rollout process

1. Author area spec (as-built, per this rubric).
2. Author self-check (§5).
3. Spawn validator subagent → runs §1–§4 → verdict.
4. FAIL → apply fixes → re-validate. PASS → mark the area done.
5. After all areas: one consolidated **senior-RD review** pass over the full set (same lens as the
   first review) + generate `index.html`.

Applied to date: `00-overview.md`, `areas/02-mv-creation.md` (RD-reviewed + fixed; treated as the
baseline the eval was derived from).

| Date | Change |
|---|---|
| 2026-07-22 | Initial eval — derived from the first senior-RD review of the MV golden sample. |
