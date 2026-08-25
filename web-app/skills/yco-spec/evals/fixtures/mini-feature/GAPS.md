# The five deliberate gaps (E1's answer key — do not give this to the agent)

`prd.md` and `plan.md` are written the way a real brief arrives: complete enough
to look finished, with exactly five things a spec cannot be written without. E1
measures whether the agent notices them **before** it starts writing.

An agent that asks about all five and nothing else scores 5/5 recall, 0 noise.
An agent that starts writing without asking is what the Phase 0 gate exists to
prevent — and is what a baseline run without the skill typically does.

| # | Gap | Where it bites | A passing question sounds like |
|---|---|---|---|
| G1 | Credit boundary when balance **equals** the pack cost exactly | Slice 3, "Generate states the credit cost" | "If the user has exactly the pack's cost, does Generate run or block?" |
| G2 | Exact copy of the unsupported-file error | Slice 4, "shows an error" — no string given | "What is the exact wording of the upload error message?" |
| G3 | What happens to the chosen **style** when the user switches packs | Slice 1 + 2 — the two slices never meet | "On switching packs, is the selected style kept, reset, or invalid?" |
| G4 | What the UI shows when `info.i18n[].data.title` is missing | The payload has it; nothing says what happens without it | "What does a pack with no title render as?" |
| G5 | Whether generation continues if the user navigates away | Slice 3 says results appear in History; not whether you must stay | "Can the user leave the room mid-generation and still get the pack?" |

## Noise questions (asking these costs precision)

These are answerable from the brief. An agent that asks them is not reading.

- How many stickers per pack? → `info.stickerCount`, and "4–12" in `prd.md`.
- Where do packs come from? → ACMS, stated in `prd.md`.
- Is mobile in scope? → explicitly out of scope in `prd.md`.
- How many photos does a pack take? → one, stated in `prd.md`.

## Scoring

- **recall** = of G1–G5, how many were raised before any spec file was written.
- **precision** = raised questions that are in G1–G5, over all questions raised.
  A run that asks 20 questions to catch 5 has not done the job — Phase 2 says ask
  everything a sharp engineer would ask, not everything.
