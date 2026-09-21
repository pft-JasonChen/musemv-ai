# Reference — pitfalls this flow was built from

Every item below is something that actually happened running this flow — the triage,
scope, and verification sections on the first run (2026-09-11), the Step 1 section when
the flow moved onto the ePF REST API (2026-09-18). Read the relevant section before
repeating the step it names.

## Step 1

**The ePF endpoint traps live in [API.md](API.md), not here — read that file before
writing any ePF call by hand.** The short version of why it matters: two of the traps
(`Handler` vs `AssignedBugHandler`, and the broken `terms` operator) produce a *wrong
answer* rather than an error, so a ledger built by hand-rolled curl can look perfectly
healthy and still disagree with the ePF board. `scripts/epf_ebug.py` exists so those
decisions are made once.

- **One ticket is four endpoints, not one.** `TSR.EbugSearch` is fast and gives exact
  counts and filters, but its fields are metadata only — there is no Repro Steps / Result /
  Expected Result to query. That text is in `GetKernel`, comments are in
  `TSR.EbugComments`, and attachment bytes only come from `DownloadByToken`.
  `epf_ebug.py full` composes the first three; `attach` adds the fourth.
- **The browser route is no longer the way in.** Before 2026-09-18 this step needed an
  authenticated ePF SSO session (Claude in Chrome) purely because the search model had no
  report text. It does not any more. Open
  `https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/<BugCode>` only for something the
  read API genuinely does not expose — and if you find such a thing, add it to API.md.
- **Attachments are now real files you can open.** This is a genuine capability change, not
  a convenience: a screenshot downloaded to the scratchpad can be *looked at* during
  triage. Several of the Step 2 calibration cases below turned on evidence that was sitting
  in an attachment. Download to the scratchpad, never into the repo.
- **Read the comments and activity log, not just the top fields.** They routinely contain
  the actual state of the bug: an RD root-cause already posted, a "please confirm behavior"
  from RD waiting on the PM, a reporter's own follow-up saying the first fix didn't work, or
  a note that the bug was filed by an automated agent test (worth knowing when a repro path
  is oddly worded). ePF also stores duplicate comment rows — same author, same text, seconds
  apart — so a thread read raw will show the same request twice; `full` dedupes.
- **No token is a stop, not a detour.** `epf_ebug.py` exits 3 with instructions to apply at
  <https://eperfect.perfectcorp.com/sso/mgm/tokenPage>. Relay that and wait. Falling back to
  scraping the web UI is how this step grew an SSO dependency the first time.

## Step 2

Three real examples from the first run of this flow, to calibrate what "ask before assuming"
means in practice:

- **A bug asked to reverse a decision that was in the code, dated and reasoned.**
  `ProfileView.tsx` had a 2026-08-31 comment explaining exactly why the MVs/Songs stat pills went
  to the public Creator profile. The bug asked for History instead. That contradiction is exactly
  the ask-first case — it turned out the PM wanted the reversal, but guessing right doesn't make
  guessing the correct process.
- **A bug named a control that no longer existed.** "Unpublish to edit does not remove published
  state" — but a 2026-08-28 decision, recorded in three files, had already replaced that control
  everywhere with "Edit MV disappears while published." There was nothing left to reproduce the
  bug against. The right move was to say so, not to invent a plausible-sounding fix.
- **A bug's fix would need new data, not just new code.** "Shows additional avatar on sharing
  music link" — investigation found only one avatar element in the markup (no duplication bug),
  but the underlying data model has no real per-creator avatar image at all, only a name string.
  The bug's own Expected Result offered two different amounts of work ("don't show it" vs "show
  the correct one") — picking one silently would have been a real product decision made without
  the PM.

## Step 3

**The one that actually shipped a scope gap:** `YMW260909P0008` asked for a Home rail's Next/
Previous buttons to advance faster (a full row per click instead of one card). The fix went into
`MvGridSections.tsx`'s `MvTopPicksRow` — the component the bug's repro path led to. That shipped
and was reported fixed. The PM then tried it on production and found two OTHER rails
("Trending Music Videos", "Top Picks Songs" on Home) still moving one card at a time. A grep for
the implementation signature (`scrollByCard|firstItem.offsetWidth`) turned up **four** independent
copies of the identical pattern across `MvGridSections.tsx`, `NewMVsSection.tsx`,
`TopPicksSection.tsx`, and `SongDetailView.tsx` — three of which the first fix never touched. That
grep, run before the first fix shipped, would have caught all four in one pass instead of two.

**Rule of thumb:** if the component you're about to edit has a header comment mentioning it's a
"copy of," "duplicated," or "same pattern as" another file — or you simply don't know — grep for
its most distinctive line before calling the fix done.

## Browser verification quirks

The Browser pane in this environment intermittently reports itself "hidden" (`tabs_context`'s
`browserOpen`/hidden state), and while hidden:

- `requestAnimationFrame` callbacks may never fire at all (confirmed: a CSS class toggled via
  `requestAnimationFrame` inside `useDialogTransition` stayed un-toggled after 9+ seconds of
  polling). Anything gated on rAF — a dialog's fade-in class, a transition-driven state — cannot
  be observed this way; test its underlying state directly instead (e.g. an element's `inert`
  attribute, which reflects the `open` prop synchronously, not the transition state).
- A **smooth** `scrollBy`/`scrollTo` can read back `0` for many seconds after the call, then
  suddenly report the correct final value — not because it failed, but because the compositor
  commit is severely throttled while hidden. Confirmed by polling every 1.5s for up to 12s until
  the value converged to the expected one.
- Calling `computer` `screenshot` (even of unrelated content) appears to force a compositor tick —
  a property read immediately after one is more likely to reflect the real state than a read with
  no screenshot in between.
- **Practical rule:** a single stale-looking read (`0`, unchanged, a class never appearing) is not
  evidence of a bug. Either poll the same property for 10–15 real seconds, or take a screenshot
  first, before concluding the fix didn't work. This cost real time twice in the first run of this
  flow, once nearly leading to a false "verification failed" report on a fix that was correct.
- Prefer plain DOM property reads/writes and direct event dispatch (`element.click()`,
  constructed `PointerEvent`/`MouseEvent` with real `clientX`/`clientY`) over relying on visual
  screenshots for anything timing-sensitive — screenshots are for confirming layout, not for
  timing a scroll or a transition.

## Gates & the port-3100 rule

- **Never run `npm run e2e` or `.claude/hooks/stop-verify.sh` yourself in this flow.** The Stop
  hook already runs the e2e suite when you finish. Running it manually starts a `next start -p
  3100` that the Bash tool's 10-minute cap will background if it runs long — and it will still be
  holding port 3100 when the real Stop hook fires its own run, which then fails with
  `http://localhost:3100 is already used`. This happened once already in this flow's first run:
  the leftover process (`next start -p 3100`) had to be found via `netstat -ano` and killed
  directly (`Stop-Process -Id <pid> -Force`) because stopping the parent bash task did not kill
  the grandchild process.
- **G4-g (`docs/CHANGELOG-RD.md`)** fires on any touch to `src/app/**/page.tsx` or the other C1–C8
  files, even for a change that adds no real contract surface (e.g. wrapping a page in
  `<Suspense>` to support a new, purely-additive query param). The fix is always to add the entry
  and say plainly whether it's a real contract move or "flagging because C7 covers URL shapes and
  this widens what the URL accepts" — never to work around the gate.
- The four Definition-of-Done commands (`typecheck`, `lint`, `test:run`, `build`) are safe to run
  yourself and should all be green before you consider a fix finished.

## Shipping

- Stage explicit paths (`git add <path> <path> ...`); never `git add -A`.
- Push to `main` only on explicit instruction — this repo's `main` auto-deploys to
  `https://musemv-ai.vercel.app/` via Vercel, so a push is a production release, not a save point.
- After a push the PM may test production directly rather than trusting your local verification —
  treat that as a real second opinion, not a formality. It caught the Step 3 scope gap above.
