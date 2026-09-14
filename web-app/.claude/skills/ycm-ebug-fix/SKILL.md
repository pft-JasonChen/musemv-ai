---
name: ycm-ebug-fix
description: Pull, document, triage, and debug PM-owned YouCam Muse Web eBugs from ePF. Use when asked to check or refresh eBugs, maintain the bug-fix ledger, investigate an eBug, implement cleared fixes, verify fixes, or prepare explicitly requested commits or production checks.
---

# YCM eBug Fix Flow

Automate the eBug workflow without silently making product decisions or expanding the user's requested scope.

## Scope and stopping point

Run only as far as the request authorizes:

- **Pull or refresh**: collect current eBugs, update the ledger, and stop.
- **Triage or investigate**: collect evidence, classify each eBug, update the ledger, and ask about unresolved decisions.
- **Fix or debug**: continue through implementation and verification for independently cleared eBugs. An unresolved eBug does not block other cleared eBugs.
- **Commit**: commit only when the request includes implementing/fixing the eBugs or explicitly asks for a commit.
- **Ship or check production**: push, deploy, or test production only when explicitly requested. A push to `main` is a production release.

Before starting, confirm the current repository is YouCam Muse Web and read the applicable `AGENTS.md`. Preserve unrelated worktree changes. If the expected project paths, tools, or scripts are unavailable, report the mismatch instead of creating substitute conventions.

## Step 1 — Pull and document the eBugs

1. Query ePF MCP with `query_data`, `serviceCode: "tsr"`, and `queryModel: "TSR.EbugSearch"`. Filter to Product **YouCam Muse Web** (`ProductID: 315`), `BugBelong: PM`, and statuses `NewCreated, Assigned`.
2. Fetch every result page, deduplicate by BugCode, and record the query time and filters. The search model supplies metadata such as code, title, priority, assignee, and dates, but not the complete Repro Steps, Result, or Expected Result.
3. Retrieve each full eBug through an authenticated browser session with access to the user's ePF SSO. In the usual Claude environment, use Claude in Chrome rather than an isolated Browser pane. Open either the search page or the direct form URL:
   - `https://eperfect.perfectcorp.com/IF3/ebug/BPM/Start/SearchRequest/Query`
   - `https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/<BugCode>`
4. Capture Short Description, Repro Steps, Result, Expected Result, and decision-relevant comments or attachments. Preserve the four primary fields faithfully; summarize supporting discussion unless exact wording affects the decision. Never copy credentials, session data, personal information, or unrelated attachment content into the repository.
5. If authenticated browser access or an attachment is unavailable, keep the metadata result, mark the missing evidence explicitly, and do not infer it. If search metadata and the current form disagree, use the form's current status and note the discrepancy.
6. Create or update `docs/BUGS-TO-FIX-<YYYY-MM-DD>.md`. Use the current ledger for the run when one already exists; do not create multiple same-day ledgers.

Use this per-eBug structure so the ledger remains actionable:

```markdown
## <BugCode> — <Title>

- ePF status:
- Priority:
- ePF assignee:
- Retrieved at:
- Triage: Pending | Clear to fix | Needs PM | Needs Designer | Stale/unlocatable
- Local status: Pulled | Investigating | Blocked | Fixing | Fixed | Verified | Committed | Shipped
- Decision needed:
- Related code/spec:

### Report
- Short Description:
- Repro Steps:
- Result:
- Expected Result:

### Resolution and verification
- Root cause:
- Resolution:
- Verified:
- Not verified:

### Reply comment (paste into eBug)
<!-- See Step 4's "Reply comment" rule before writing this. -->
```

The ledger is the shared source of truth for the rest of the flow, not a one-time report. Do not change the ePF ticket's assignee, status, or comments unless the user explicitly asks.

## Step 2 — Triage before editing code

Apply this gate independently to every eBug. You may inspect the repository and run read-only diagnostics during triage, but do not edit code for that eBug until it is clear to fix.

- **Needs Designer**: the expected result requires a new or revised visual that cannot be derived from an approved screen. Mark `Needs Designer`, explain what artifact is missing, and ask the PM to transfer it in eBug. Do not invent the design.
- **Needs PM — conflicting decision**: the Expected Result contradicts or extends a dated decision in code comments or `specs/areas/*.md`. Identify the conflict and ask which behavior wins.
- **Stale/unlocatable**: the named control or behavior has no locatable current code path, or was removed by a recorded decision. Show what was searched and ask whether the report is stale or has a different repro path.
- **Needs PM — product/UX choice**: more than one materially different behavior could satisfy the report. Present concrete options and their scope; do not choose silently.
- **Clear to fix**: the expected behavior is explicit, a relevant code path is locatable, no competing recorded decision exists, and the change stays within the reported behavior.

`Clear to fix` is sufficient authorization to implement when the user requested fixing/debugging eBugs. All other buckets require an explicit answer before implementation. Batch unresolved questions when practical, while continuing independently cleared eBugs. Read [REFERENCE.md](REFERENCE.md#step-2) when calibrating ambiguous cases.

## Step 3 — Find the full implementation scope

Before the first edit for a cleared eBug, search the whole `src/` tree for equivalent implementations, not only the file reached by the repro path. Search by several relevant signatures where available: distinctive functions or literals, UI labels, component names, state fields, handlers, selectors, API methods, and comments such as “copy of” or “same pattern as.”

Record the relevant copies in the ledger under `Related code/spec`. Fix all copies that are in the cleared behavioral scope; do not turn duplicate discovery into an unrelated refactor. Repeat the search after implementation to check that no relevant copy was missed. Read [REFERENCE.md](REFERENCE.md#step-3) for the production scope-gap example.

## Step 4 — Fix, verify, document, and stop at the authorized boundary

For each cleared eBug:

1. Reproduce or otherwise establish the current failure when practical, then record the root cause. If the report cannot be reproduced, document the evidence and ask before changing behavior merely to match a theory.
2. Implement the smallest complete fix across the relevant copies found in Step 3. Add or update a regression test when it can meaningfully detect the defect.
3. If the fix reverses, narrows, or extends a recorded decision, update the matching `specs/areas/*.md` and `specs/CHANGELOG-SPEC.md` in the same change.
4. If touching `src/app/**/page.tsx` or another C1–C8 contract surface, add the `docs/CHANGELOG-RD.md` entry required by Gate G4-g, including when the conclusion is that it is not a contract change.
5. Run the repository Definition of Done from `web-app/`: `npm run typecheck`, `npm run lint`, `npm run test:run`, and `npm run build`. Run them so each result can be attributed. Do not leave a build running when ending the session.
6. Do **not** run the full `npm run e2e` or `.claude/hooks/stop-verify.sh`; the Stop hook owns that run and port 3100. A narrowly targeted test is allowed only when its selected scope is known in advance to finish quickly. Read [REFERENCE.md](REFERENCE.md#gates--the-port-3100-rule) before considering one.
7. Verify the exact reported path and Expected Result in the live local app. Record the URL/scenario and observed result. For visual changes, follow the repository's required viewport checks. If authentication, data, environment state, or browser throttling prevents verification, record the concrete blocker under `Not verified`; never report an inferred pass. Read [REFERENCE.md](REFERENCE.md#browser-verification-quirks).
8. Update the ledger with root cause, resolution, checks run, live verification, and anything not verified. Use precise statuses; `Fixed` is not `Verified`, and `Committed` is not `Shipped`.
9. Write a short **reply comment** the user can paste into the eBug as-is, under that eBug's "Reply comment" field. This is read by RD/QA, not by whoever wrote the code — write it in their terms:
   - Lead with **whether the user (or RD/QA) will see anything different** — a UI/UX change, a copy change, or no observable change at all (e.g. a documentation-only correction, or a false alarm that doesn't reproduce). Never make the reader infer this from a code description.
   - Describe the **behavior**, not the implementation: what a user does, what they now see/experience. Skip file names, function names, hook names, and internal architecture — those belong in the ledger, not the reply.
   - If a follow-up comment reverses or narrows an earlier fix (e.g. RD flags a real-backend constraint the mock didn't have), say plainly what changed *this time*, not just what the final state is — RD is tracking the eBug across replies and a comment that only restates the current behavior reads as if nothing happened.
   - Keep it to 1–3 sentences. Longer technical justification stays in the ledger's own Root cause/Resolution fields, not the reply.

## Commit and production rules

When committing is authorized:

1. Inspect the worktree and staged diff. Include only changes belonging to the cleared eBugs; preserve unrelated user changes.
2. From the repository root, stage explicit paths with `git add <path> <path> ...`; never use `git add -A`.
3. Commit only after the required local gates pass, or clearly report any user-authorized exception.

Push to `main` only when explicitly requested because Vercel deploys it to production. When asked to check production after a push, verify the live production URL rather than relying on localhost, and update the ledger from `Committed` to `Shipped` only after the requested production check succeeds.

See [REFERENCE.md](REFERENCE.md) for the repository-specific pitfalls behind these rules. Read only the section relevant to the current step.
