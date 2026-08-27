# Plan — AI Sticker Pack

> Acceptance criteria live here only.

## Slice 1 — Pack picker (HITL)
**Acceptance criteria**
- [ ] Sidebar shows "Sticker Pack" and opens the pack dialog before the feature room.
- [ ] Each pack tile states its sticker count.
- [ ] Selecting a pack loads it into the feature room.

## Slice 2 — Upload + style (AFK)
**Acceptance criteria**
- [ ] The panel shows one upload slot with a type-specific placeholder.
- [ ] Style chips render from the pack's configured style list.
- [ ] Generate is unavailable until a photo is uploaded and a style is chosen.

## Slice 3 — Generate + results (AFK)
**Acceptance criteria**
- [ ] Generate states the pack's credit cost.
- [ ] Results appear in History as one entry per pack, not per sticker.
- [ ] Re-run reuses the original photo without a fresh upload.

## Slice 4 — Errors (AFK)
**Acceptance criteria**
- [ ] An unsupported file shows an error and does not fill the slot.
- [ ] Insufficient credits blocks generation.
