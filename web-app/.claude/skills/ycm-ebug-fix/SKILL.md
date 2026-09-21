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
- **Reply comment**: whenever the run implemented, verified, or disproved an eBug, close it out with Step 5's paste-ready comment — including when the run stopped before shipping, in which case the comment says how far it got.

Before starting, confirm the current repository is YouCam Muse Web and read the applicable `AGENTS.md`. Preserve unrelated worktree changes. If the expected project paths, tools, or scripts are unavailable, report the mismatch instead of creating substitute conventions.

## Credentials

eBugs are read over the ePF REST API using the user's own Bearer token, resolved from
`EPF_API_TOKEN` (repo-root `.env`, which is gitignored). No token ships with this skill.

If `scripts/epf_ebug.py` exits `3` ("No ePF API token found"), **stop and tell the user to
apply for their own token at <https://eperfect.perfectcorp.com/sso/mgm/tokenPage>**, then
save it as `EPF_API_TOKEN` in the repo-root `.env` (`.env.example` shows the shape). Do not
route around a missing token by scraping the ePF web UI, and never write the token into a
ledger, a commit, an eBug comment, or anything under `src/`.

Every ePF call in this flow is **read-only**. Nothing here changes a ticket's assignee,
status, or comments; the reply comment in Step 4 is for the user to paste in themselves.

## Step 1 — Pull and document the eBugs

`scripts/epf_ebug.py` wraps the four ePF endpoints that together make up one complete
ticket. Read [API.md](API.md) before deviating from the commands below — several of those
endpoints return a plausible wrong answer rather than an error.

1. Pull the working set:

   ```bash
   python3 web-app/.claude/skills/ycm-ebug-fix/scripts/epf_ebug.py search --ycm-web --pm-open
   ```

   That is Product **YouCam Muse Web** (`ProductID 315`), `BugBelong: PM`, statuses
   `NewCreated` and `Assigned`. Use `--status`, `--handler`, `--since`, `--creator`, or
   `--cond` when the request asks for a different set. Record the filters and the query
   time in the ledger; results are already deduplicated by BugCode and sorted newest first.

2. For each BugCode, pull the complete ticket:

   ```bash
   python3 .../epf_ebug.py full <BugCode>
   ```

   `full` emits the ledger block directly. It reads the report text from GetKernel (Repro
   Steps / Result / Expect Result live there — the search model has none of them), appends
   the deduplicated comment thread, and corrects handler/status/product from the search
   model. That correction matters: GetKernel's `AssignedBugHandler` is the *assignee*, so
   copying it across as "handler" produces a ledger that disagrees with the ePF board.

3. Download attachments that carry decision-relevant evidence, and actually look at them —
   a screenshot frequently settles a triage call the text leaves ambiguous:

   ```bash
   python3 .../epf_ebug.py attach <BugCode> --out "<scratchpad>/ebug"
   ```

   Download into the session scratchpad, never into the repository. Never copy credentials,
   session data, personal information, or unrelated attachment content into the repo.

4. Read the comments and status log, not only the top fields. They routinely hold the real
   state of the bug: an RD root cause already posted, a "please confirm this behavior"
   waiting on the PM, the reporter saying the first fix did not work, or a note that the
   bug came from an automated agent test.

5. Preserve Short Description, Repro Steps, Result, and Expected Result faithfully;
   summarize supporting discussion unless the exact wording affects the decision. If a call
   fails or an attachment cannot be fetched, keep what you have, mark the missing evidence
   explicitly, and do not infer it.

6. Create or update `docs/BUGS-TO-FIX-<YYYY-MM-DD>.md`. Use the current ledger for the run
   when one already exists; do not create multiple same-day ledgers.

The human-readable form is `https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/<BugCode>`
and `full` prints it. Open it in a browser only when you need something the read API does
not expose; the API is the default path and needs no SSO session.

Use this per-eBug structure so the ledger remains actionable:

```markdown
## <BugCode> — <Title>          <!-- `full` emits this header block: -->

- ePF status:
- Priority:               | Severity:
- ePF handler:            | Assignee:
- BugBelong:              | Product:  | Version:  | Build:
- Reported by <Creator> at <CreateTime>
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/<BugCode>

<!-- and these you fill in: -->
- Retrieved at:
- Triage: Pending | Clear to fix | Needs PM | Needs Designer | Stale/unlocatable
- Local status: Pulled | Investigating | Blocked | Fixing | Fixed | Verified | Committed | Shipped
- Decision needed:
- Related code/spec:

### Report
- Short Description:
- Repro Steps:
- Result:
- Expect Result:

### Attachments
### Comments

### Resolution and verification
- Root cause:
- Resolution:
- Verified:
- Not verified:

### Reply comment (paste into eBug)
<!-- Written in Step 5, AFTER shipping. Left empty until then. -->
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
8. Update the ledger with root cause, resolution, checks run, live verification, and anything not verified. Use precise statuses; `Fixed` is not `Verified`, and `Committed` is not `Shipped`. Leave that eBug's **Reply comment** field empty for now — it is written in Step 5, once the change has actually shipped.
## Commit and production rules

When committing is authorized:

1. Inspect the worktree and staged diff. Include only changes belonging to the cleared eBugs; preserve unrelated user changes.
2. From the repository root, stage explicit paths with `git add <path> <path> ...`; never use `git add -A`.
3. Commit only after the required local gates pass, or clearly report any user-authorized exception.

Push to `main` only when explicitly requested because Vercel deploys it to production. When asked to check production after a push, verify the live production URL rather than relying on localhost, and update the ledger from `Committed` to `Shipped` only after the requested production check succeeds.

## Step 5 — Write the reply comment (the LAST step, after shipping)

**This is the final step of the flow and it comes after the push, not before it.** Write it once
the change is actually live — or, when the run stops short of shipping, once you know exactly how
far it got. Writing it earlier produces a comment that claims a state the eBug is not in yet:
"Fixed" pasted into ePF while the fix is still sitting uncommitted on a laptop is how RD retests
something that was never deployed.

So the trigger is whichever of these the run reached, and the comment says so plainly:

| How far the run got | What the comment must say |
| --- | --- |
| Shipped (pushed, production check passed) | the fix is live — the normal case |
| Committed, not pushed | what changed and that it is **not on production yet** |
| Fixed locally, not committed | that nothing has shipped, so retesting now proves nothing |
| Not a defect / does not reproduce | that, and what was actually tested |

Produce one comment per eBug, in that eBug's **Reply comment** ledger field, ready for the user to
paste as-is. **Never post it to ePF yourself** — every ePF call in this flow is read-only, and the
user decides what goes on the ticket. Deliver the comments in the session response too, not only
in the ledger, so they can be copied without opening a file.

It is read by RD/QA, not by whoever wrote the code — write it in their terms:

- Lead with **whether the reader will see anything different** — a UI/UX change, a copy change, or
  no observable change at all (a documentation-only correction, or a false alarm that doesn't
  reproduce). Never make them infer this from a code description.
- Describe the **behavior**, not the implementation: what a user does, what they now see. Skip file
  names, function names, hook names, and internal architecture — those belong in the ledger.
- **Say what changed *this time*.** If a follow-up reverses or narrows an earlier fix, or
  contradicts a diagnosis you posted before, lead with that. RD is tracking the eBug across
  replies, and a comment that only restates the final behavior reads as if nothing happened.
- **If the eBug did not reproduce, say so before saying what you changed** — otherwise a behaviour
  change lands on the ticket looking like a bug fix, and QA retests the wrong thing.
- Name anything the reader must retest differently: a **deliberate side effect**, a case that is
  still not fixed, or a build the report was filed against that this repo is not.
- Keep it to 1–3 sentences. Longer justification stays in the ledger's Root cause / Resolution
  fields.

See [API.md](API.md) for the ePF endpoint contract, the token rules, and the API traps
behind Step 1, and [REFERENCE.md](REFERENCE.md) for the repository-specific pitfalls
behind the rest. Read only the section relevant to the current step.
