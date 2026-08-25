# PRD — AI Sticker Pack

## Problem
Users who want a set of matching stickers today have to run the single-image
generator once per sticker and stitch the results themselves. Nothing keeps the
character consistent across the set.

## What it is
A pack-driven sticker generator inside YCO Online Editor. The user picks a
**pack** (a themed set of 4–12 poses), uploads one photo of the subject, picks a
style, and gets the whole pack back as individual stickers.

## User stories
- As a user, I pick a pack and see how many stickers it will produce before I commit.
- As a user, I upload one photo and get every pose in the pack with the same character.
- As a user, I can re-run a pack I already generated without re-uploading.

## Implementation decisions
- Packs come from ACMS, same catalog the mobile app uses.
- One source photo per pack. Multi-photo packs are out of scope for v1.
- Credit cost is per pack, taken from the pack's model action.

## Out of scope
- Mobile layout (desktop 1440 only for v1)
- Editing an individual sticker after generation
- Sharing / export presets
