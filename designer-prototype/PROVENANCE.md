# designer-prototype/ — provenance

**This is DP** (Designer Prototype) in the vocabulary of
`web-app/docs/UI-INTEGRATION-HANDOFF.md` §0. It is the designer's **web** prototype and the
**source of truth for the new UI** — and for nothing else.

| | |
|---|---|
| Upstream | `https://github.com/marukox1105/YCM` (`main`) |
| Commit | `2670ed200146ff5e10f53216aeedc9454f47697b` |
| Commit date | 2026-08-06 17:24:15 +0800 |
| Commit subject | Widen SongPlayBar title space, cap progress bar width, and re-center row |
| Vendored | 2026-08-06 (drop 2; drop 1 was `568e64c`, 2026-08-04) |
| Also deployed at | Vercel (see the upstream `PROJECT_CONTEXT.md` → Deployment) |

## Why it is vendored rather than cloned per-machine

The plan and the handoff were written against `~/Downloads/YCM-main`, a path that exists on
exactly one laptop. Everything keyed to it degraded silently elsewhere: the Stop gate's
**G2-a** leg ran `build-token-map.mjs --check`, got "DP not found", and reported *skipped* —
a gate that looks green while checking nothing. `scripts/build-token-map.mjs` now defaults to
this folder, so G2-a is live wherever the repo is.

## READ-ONLY

Never edit anything under this folder. It is a drop, not a working copy — the next drop
replaces it wholesale, and any local edit is lost without a trace. Do not import from it in
`web-app/` code or config either; the migration **copies** DOM and CSS across, it does not
reference them in place.

## What was excluded from the drop

The upstream repo is 583 MB — 281 MB of it git history, 295 MB of it demo media. Vendored
here is the code, CSS, tokens, icons and small assets (**8.2 MB** as of drop 2). Excluded:

| Path | Size | Why |
|---|---|---|
| `.git/` | 281 MB | History belongs to the upstream repo; drops are diffable through *this* repo's history instead |
| `src/assets/covers/` | 257 MB | 44 mp4 + 36 mp3 of demo content |
| `src/assets/storyboard-clips/` | 25 MB | same |
| `src/assets/hero/` | 13 MB | Home colorflow videos |

The excluded media is **mock content, not design**. Plan D5 already rules that DP's
`import.meta.glob` catalogs (`data/songs.ts`, `musicVideos.ts`, `storyboardClips.ts`) must be
rewritten against `MuseApi`, and `web-app/public/assets/` (35 MB) carries WA's own fixtures.
Migration needs DP's DOM and CSS; it does not need the designer's demo library.

Consequence to know: **this copy will not `npm run dev` with real media** — image and video
`src` paths resolve to missing files. For the side-by-side comparisons that gates G3-b and
G5-b require, use the Vercel deployment, or re-clone upstream in full to a scratch directory.

## Re-syncing on the next drop (plan §12 step 1)

```bash
git clone --depth 1 https://github.com/marukox1105/YCM.git /tmp/YCM-new
# replace this folder's contents with the same exclusions as above, then:
cd web-app && npm run token-map      # regenerate docs/token-map.{md,json} — G2-a
git diff --stat designer-prototype/  # this IS the drop-to-drop diff §12 step 1 asks for
```

Then re-run §12's five steps: classify each change as visual / flow / new-screen, check flow
changes against `web-app/specs/areas/*.md`, and append anything unresolved to the migration
plan's §8 table with a date and a reason.
