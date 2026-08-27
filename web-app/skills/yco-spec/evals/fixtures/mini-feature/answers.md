# Answers — feed this to E2 only

E1 measures whether the agent finds the gaps. E2 measures what it builds once
they are answered, so E2 hands it this file up front and the Phase 0/2 gates
have nothing left to block on.

## G1 — Credit boundary
Generate runs when the balance is **greater than or equal to** the pack cost.
Exactly equal proceeds and leaves the user at zero. Below cost, Generate stays
available but opens the top-up dialog instead of starting; nothing is charged.

## G2 — Upload error copy
Exact string: "This file type isn't supported. Use a JPG, PNG or WEBP under 20 MB."
Shown as the site's standard error toast. The slot stays empty and keeps its
placeholder. No credits are involved.

## G3 — Style on pack switch
Switching packs **always resets the style to the new pack's first style**, and
clears the uploaded photo. Styles are per-pack; a style id from the old pack is
not guaranteed to exist in the new one, so nothing carries over.

## G4 — Missing pack title
A pack with no `info.i18n[].data.title` is **not offered** — it does not appear in
the dialog at all. The client never invents a name and never shows the `guid`.

## G5 — Navigating away during generation
Generation is engine-reported. The user may leave the feature room entirely; the
pack lands in History when it completes and the profile-icon notification marks
it. The user is never locked to the screen.

## Additional facts the spec needs

- Sidebar item reads "Sticker Pack"; the pack dialog title reads "Choose a pack".
- The upload slot placeholder reads "Add Photo".
- Generate action label: "Generate Pack", with the credit cost beside it.
- One History entry per pack, showing the pack name and sticker count.
- Re-run label: "Run again". It restores the original photo into the slot.
- `info.styleList` values render as chips in the order given; the first is
  selected by default.
- `info.previewImgs` is dialog-tile artwork only — never pre-filled into the slot.
- `meta.prompt[]` (model, style_prompt, negative_prompt, srcKeys) is engine-only
  and must never surface in the UI.
- `createdTime` / `lastModified` are ACMS bookkeeping with no UI meaning.
- The prototype fakes generation with a 3 s timer and canned sticker images;
  production calls the pack's model action and reports real progress.
